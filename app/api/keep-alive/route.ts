import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

/**
 * Keep-alive endpoint to prevent Supabase project from pausing
 * This endpoint performs a simple database query to keep the connection active
 * Should be called every 24 hours via cron job
 */
export async function GET() {
  try {
    // Perform a simple query to keep the database active
    // This prevents Supabase free tier projects from pausing due to inactivity
    const { data, error } = await supabaseServer
      .from('cache_metadata')
      .select('key')
      .limit(1);

    if (error) {
      console.error("[Keep-Alive] Database error:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    console.log("[Keep-Alive] Database connection successful - project will remain active");
    
    return NextResponse.json({
      success: true,
      message: "Database keep-alive successful",
      timestamp: new Date().toISOString(),
      data: data || []
    });
  } catch (error) {
    console.error("[Keep-Alive] Unexpected error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
