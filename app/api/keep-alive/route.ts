import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import {
  authenticateRequest,
  validateRequestBody,
  validationSchemas,
  logApiRequest,
  createSecureResponse,
  sanitizeError,
  validateEnvironment
} from "@/lib/security";

// Force dynamic rendering since we use request.headers
export const dynamic = 'force-dynamic';

/**
 * Keep-alive endpoint to prevent Supabase project from pausing
 * This endpoint performs a simple database query to keep the connection active
 * Should be called every 24 hours via cron job
 * Requires admin-level API key authentication
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate environment configuration
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      console.error("[Keep-Alive] Missing environment variables:", envValidation.missing);
      const response = createSecureResponse(
        { error: "Service configuration error" },
        { status: 503 }
      );
      logApiRequest(request, response, startTime, { error: "env_config" });
      return response;
    }

    // Authenticate request (requires admin access)
    const auth = authenticateRequest(request, 'admin');
    if (!auth.success) {
      const response = createSecureResponse(
        { error: auth.error },
        { status: 401 }
      );
      logApiRequest(request, response, startTime, { error: "auth_failed" });
      return response;
    }

    // Perform a simple query to keep the database active
    // This prevents Supabase free tier projects from pausing due to inactivity
    const { data, error } = await supabaseServer
      .from('cache_metadata')
      .select('key')
      .limit(1);

    if (error) {
      console.error("[Keep-Alive] Database error:", sanitizeError(error));
      const response = createSecureResponse(
        {
          success: false,
          error: "Database connection failed",
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
      logApiRequest(request, response, startTime, { error: "db_error" });
      return response;
    }

    console.log("[Keep-Alive] Secure database connection successful - project will remain active");

    const response = createSecureResponse({
      success: true,
      message: "Database keep-alive successful",
      timestamp: new Date().toISOString(),
      data: data || []
    });

    logApiRequest(request, response, startTime, { success: true });
    return response;
  } catch (error) {
    const sanitizedError = sanitizeError(error);
    console.error("[Keep-Alive] Unexpected error:", error);

    const response = createSecureResponse(
      {
        success: false,
        error: "Internal server error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );

    logApiRequest(request, response, startTime, { error: "internal_error" });
    return response;
  }
}
