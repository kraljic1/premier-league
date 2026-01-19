import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { securityMonitor } from './security-monitor';
import { apiKeyManager } from './api-key-manager';
import type { SecurityEvent } from './security-monitor';

// Rate limiting store (in production, use Redis)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  burstTokens: number; // Burst allowance tokens
  lastRequest: number; // Timestamp of last request
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// API Keys for different access levels
const API_KEYS = {
  // Read-only access for public APIs
  read: process.env['API_KEY_READ'] || '',
  // Write access for refresh operations
  write: process.env['API_KEY_WRITE'] || '',
  // Admin access for system operations
  admin: process.env['API_KEY_ADMIN'] || '',
} as const;

type AccessLevel = keyof typeof API_KEYS;

/**
 * Authenticate API request with API key
 */
export function authenticateRequest(
  request: NextRequest,
  requiredLevel: AccessLevel = 'read'
): { success: true } | { success: false; error: string } {
  const apiKey = request.headers.get('x-api-key');
  const clientId = getClientIdentifier(request);

  if (!apiKey) {
    // Log authentication failure
    const eventData: Omit<SecurityEvent, 'timestamp'> = {
      type: 'auth_failure',
      severity: 'low',
      clientId,
      endpoint: request.nextUrl.pathname,
      details: { reason: 'missing_api_key' },
    };

    const ip = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');

    if (ip) eventData.ip = ip;
    if (userAgent) eventData.userAgent = userAgent;

    securityMonitor.logEvent(eventData);

    return { success: false, error: 'Missing API key' };
  }

  // Validate API key using the key manager
  const keyValidation = apiKeyManager.validateKey(apiKey);

  if (!keyValidation.valid) {
    // Log authentication failure
    securityMonitor.logEvent({
      type: 'auth_failure',
      severity: 'medium',
      clientId,
      endpoint: request.nextUrl.pathname,
      details: { reason: keyValidation.error.toLowerCase().replace(/\s+/g, '_') },
      ip: request.headers.get('x-forwarded-for') || request.ip || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return { success: false, error: keyValidation.error };
  }

  // Check if user has sufficient access level
  const levels: AccessLevel[] = ['read', 'write', 'admin'];
  const userLevelIndex = levels.indexOf(keyValidation.level);
  const requiredLevelIndex = levels.indexOf(requiredLevel);

  if (userLevelIndex < requiredLevelIndex) {
    // Log authorization failure
    securityMonitor.logEvent({
      type: 'auth_failure',
      severity: 'medium',
      clientId,
      endpoint: request.nextUrl.pathname,
      details: {
        reason: 'insufficient_access_level',
        userLevel: keyValidation.level,
        requiredLevel
      },
      ip: request.headers.get('x-forwarded-for') || request.ip || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return { success: false, error: `Insufficient access level. Required: ${requiredLevel}` };
  }

  return { success: true };
}

/**
 * Check rate limiting for requests with burst protection and sliding window
 */
export function checkRateLimit(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  burstAllowance: number = 10 // Additional burst tokens
): { allowed: true } | { allowed: false; resetTime: number } {
  const identifier = getClientIdentifier(request);
  const now = Date.now();
  const windowData = rateLimitStore.get(identifier);

  // Initialize new window data if none exists or window has expired
  if (!windowData || now > windowData.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
      burstTokens: burstAllowance,
      lastRequest: now
    };
    rateLimitStore.set(identifier, newEntry);
    return { allowed: true };
  }

  // Calculate tokens to replenish based on time passed (sliding window)
  const timeSinceLastRequest = now - windowData.lastRequest;
  const tokensToReplenish = Math.floor((timeSinceLastRequest / windowMs) * maxRequests);
  windowData.burstTokens = Math.min(burstAllowance, windowData.burstTokens + tokensToReplenish);

  // Check if request is allowed (regular limit + burst tokens)
  const totalAllowance = maxRequests + windowData.burstTokens;

  if (windowData.count >= totalAllowance) {
    // Log rate limit violation
    securityMonitor.logEvent({
      type: 'rate_limit',
      severity: 'low',
      clientId: identifier,
      endpoint: request.nextUrl.pathname,
        details: {
          attempts: windowData.count,
          limit: maxRequests,
          burstUsed: windowData.burstTokens,
          totalAllowance,
          resetTime: new Date(windowData.resetTime).toISOString()
        },
        ip: request.headers.get('x-forwarded-for') || request.ip || undefined,
        userAgent: request.headers.get('user-agent') || undefined
    });

    return { allowed: false, resetTime: windowData.resetTime };
  }

  // Allow request and update counters
  windowData.count++;
  windowData.burstTokens = Math.max(0, windowData.burstTokens - 1); // Consume burst token
  windowData.lastRequest = now;

  return { allowed: true };
}

/**
 * Get client identifier for rate limiting
 * Uses IP + User-Agent for better identification
 */
function getClientIdentifier(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             request.ip ||
             'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Create a hash-like identifier
  return Buffer.from(`${ip}:${userAgent}`).toString('base64').substring(0, 32);
}

/**
 * Input validation schemas
 */
export const validationSchemas = {
  refreshRequest: z.object({
    force: z.boolean().optional(),
    source: z.enum(['onefootball', 'official']).optional(),
    matchweek: z.number().min(1).max(38).optional()
  }),

  keepAliveRequest: z.object({
    ping: z.string().optional()
  })
};

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
    try {
      const data = schema.parse(body);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Validation failed: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        };
      }
      return { success: false, error: 'Invalid request format' };
    }
}

/**
 * Secure logging - never log sensitive data
 */
export function logApiRequest(
  request: NextRequest,
  response: NextResponse,
  startTime: number,
  additionalData?: Record<string, any>
) {
  const duration = Date.now() - startTime;
  const clientId = getClientIdentifier(request).substring(0, 8); // Only log first 8 chars for privacy

  const logEntry = {
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.nextUrl.pathname,
    status: response.status,
    duration,
    clientId,
    userAgent: (request.headers.get('user-agent') || 'unknown').substring(0, 50) || undefined,
    ...additionalData
  };

  // Log to console (in production, send to logging service)
  console.log('[API]', JSON.stringify(logEntry));

  // Alert on suspicious activity
  if (response.status === 429) {
    console.warn('[SECURITY] Rate limit exceeded:', { clientId, path: request.nextUrl.pathname });
  }

  if (response.status === 401) {
    console.warn('[SECURITY] Unauthorized access attempt:', { clientId, path: request.nextUrl.pathname });
  }
}

/**
 * Sanitize error messages for API responses
 */
export function sanitizeError(error: unknown): string {
  // Never expose internal error details
  if (error instanceof Error) {
    // Log the actual error for debugging
    console.error('[INTERNAL ERROR]', error.message, error.stack);

    // Return generic message to client
    return 'Internal server error';
  }

  return 'Unknown error occurred';
}

/**
 * Create secure response with appropriate headers
 */
export function createSecureResponse(
  data: any,
  options: {
    status?: number;
    cacheControl?: string;
    additionalHeaders?: Record<string, string>;
  } = {}
): NextResponse {
  const {
    status = 200,
    cacheControl = 'public, s-maxage=300, stale-while-revalidate=600',
    additionalHeaders = {}
  } = options;

  const response = NextResponse.json(data, { status });

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Cache-Control', cacheControl);

  // Add additional headers
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Validate environment variables are set
 */
export function validateEnvironment(): { valid: true } | { valid: false; missing: string[] } {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}