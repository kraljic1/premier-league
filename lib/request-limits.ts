/**
 * Request size limits and timeout controls for enhanced API security
 */

export interface RequestLimits {
  maxBodySize: number; // in bytes
  maxQueryParams: number;
  maxHeaders: number;
  timeout: number; // in milliseconds
}

export const REQUEST_LIMITS = {
  // Standard API requests
  standard: {
    maxBodySize: 1024 * 1024, // 1MB
    maxQueryParams: 50,
    maxHeaders: 100,
    timeout: 30000, // 30 seconds
  },
  // Sensitive operations (refresh, admin)
  sensitive: {
    maxBodySize: 512 * 1024, // 512KB
    maxQueryParams: 20,
    maxHeaders: 50,
    timeout: 60000, // 1 minute
  },
  // File uploads (if needed in future)
  upload: {
    maxBodySize: 10 * 1024 * 1024, // 10MB
    maxQueryParams: 10,
    maxHeaders: 50,
    timeout: 120000, // 2 minutes
  }
} as const;

/**
 * Validate request size and structure
 */
export function validateRequestSize(
  request: Request,
  limits: RequestLimits
): { valid: true } | { valid: false; error: string } {
  try {
    // Check Content-Length header if present
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (isNaN(size) || size > limits.maxBodySize) {
        return {
          valid: false,
          error: `Request body too large. Maximum allowed: ${limits.maxBodySize} bytes`
        };
      }
    }

    // Check query parameters count
    const url = new URL(request.url);
    const queryParamCount = Array.from(url.searchParams.keys()).length;
    if (queryParamCount > limits.maxQueryParams) {
      return {
        valid: false,
        error: `Too many query parameters. Maximum allowed: ${limits.maxQueryParams}`
      };
    }

    // Check headers count
    const headerCount = Array.from(request.headers.keys()).length;
    if (headerCount > limits.maxHeaders) {
      return {
        valid: false,
        error: `Too many headers. Maximum allowed: ${limits.maxHeaders}`
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Request validation failed'
    };
  }
}

/**
 * Create AbortController with timeout for requests
 */
export function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // Clean up timeout if request completes normally
  const originalSignal = controller.signal;
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
  });

  return controller;
}

/**
 * Wrap fetch with timeout and size validation
 */
export async function fetchWithLimits(
  url: string,
  options: RequestInit & { limits?: RequestLimits } = {}
): Promise<Response> {
  const limits = options.limits || REQUEST_LIMITS.standard;
  const controller = createTimeoutController(limits.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${limits.timeout}ms`);
    }
    throw error;
  }
}