import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/security';

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://premierleaguematches.com',
  'https://www.premierleaguematches.com',
  'https://plmatches.netlify.app',
  'https://plmatches-staging.netlify.app',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean) as string[];

// API endpoints that require authentication
const PROTECTED_ENDPOINTS = [
  '/api/refresh',
  '/api/keep-alive'
];

// API endpoints with stricter rate limits
const SENSITIVE_ENDPOINTS = [
  '/api/refresh'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');
  const isProtectedEndpoint = PROTECTED_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
  const isSensitiveEndpoint = SENSITIVE_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCorsPreflight(request);
  }

  // Validate CORS for API routes
  if (isApiRoute) {
    const corsValidation = validateCors(request);
    if (!corsValidation.allowed) {
      return NextResponse.json(
        { error: 'CORS policy violation' },
        {
          status: 403,
          headers: corsValidation.headers
        }
      );
    }
  }

  // Apply rate limiting for API routes
  if (isApiRoute) {
    const rateLimitConfig = getRateLimitConfig(isSensitiveEndpoint);
    const rateLimitResult = checkRateLimit(request, rateLimitConfig.maxRequests, rateLimitConfig.windowMs);

    if (!rateLimitResult.allowed) {
      const resetTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: resetTime
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetTime.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          }
        }
      );
    }
  }

  // For protected endpoints, basic API key check (full validation happens in route handlers)
  if (isProtectedEndpoint) {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // CSP for API routes
  if (isApiRoute) {
    response.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  } else {
    // CSP for HTML pages - allow Google Analytics
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.supabase.co",
      "img-src 'self' data: https: blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    response.headers.set('Content-Security-Policy', cspDirectives);
  }

  return response;
}

/**
 * Handle CORS preflight requests
 */
function handleCorsPreflight(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  const response = new NextResponse(null, { status: 204 });

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }

  return response;
}

/**
 * Validate CORS for API requests
 */
function validateCors(request: NextRequest): { allowed: boolean; headers: Record<string, string> } {
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  const headers: Record<string, string> = {};

  if (isAllowedOrigin && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, x-api-key, Authorization';
  }

  return {
    allowed: Boolean(!origin || isAllowedOrigin), // Allow requests without Origin header (server-to-server)
    headers
  };
}

/**
 * Get rate limit configuration based on endpoint sensitivity
 */
function getRateLimitConfig(isSensitive: boolean) {
  if (isSensitive) {
    // Stricter limits for sensitive operations
    return {
      maxRequests: 5, // 5 requests
      windowMs: 15 * 60 * 1000 // per 15 minutes
    };
  }

  // Standard limits for regular API calls
  return {
    maxRequests: 300, // 300 requests
    windowMs: 15 * 60 * 1000 // per 15 minutes
  };
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};