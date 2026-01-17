import { NextRequest, NextResponse } from 'next/server';

// Server-side API route - sensitive logic stays on server
export async function GET(request: NextRequest) {
  try {
    // This logic runs only on the server, never exposed to client
    const sensitiveData = await fetchSensitiveData();
    const processedData = processDataSecurely(sensitiveData);

    return NextResponse.json({
      success: true,
      data: processedData,
      // Don't expose server implementation details
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

// Sensitive functions that never reach the client
async function fetchSensitiveData() {
  // Your sensitive data fetching logic here
  // This code is never visible to users
  return {
    secret: 'hidden-data',
    algorithm: 'complex-calculation'
  };
}

function processDataSecurely(data: any) {
  // Complex business logic that stays server-side
  // Users only get the processed result
  return {
    result: 'processed-data',
    timestamp: Date.now()
  };
}