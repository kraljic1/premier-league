import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createSecureResponse } from '@/lib/security';
import { apiKeyManager } from '@/lib/api-key-manager';

/**
 * API Key Management Endpoint
 * Requires admin access for key operations
 */

// Get key statistics
export async function GET(request: NextRequest) {
  // Authenticate with admin access
  const auth = authenticateRequest(request, 'admin');
  if (!auth.success) {
    return createSecureResponse(
      { error: auth.error },
      { status: 401 }
    );
  }

  try {
    const stats = apiKeyManager.getKeyStatistics();

    return createSecureResponse({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return createSecureResponse(
      { error: 'Failed to retrieve key statistics' },
      { status: 500 }
    );
  }
}

// Rotate keys for a specific level
export async function POST(request: NextRequest) {
  // Authenticate with admin access
  const auth = authenticateRequest(request, 'admin');
  if (!auth.success) {
    return createSecureResponse(
      { error: auth.error },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { level } = body;

    if (!level || !['read', 'write', 'admin'].includes(level)) {
      return createSecureResponse(
        { error: 'Invalid level. Must be: read, write, or admin' },
        { status: 400 }
      );
    }

    const newKey = await apiKeyManager.rotateKeysForLevel(level);

    return createSecureResponse({
      success: true,
      message: `${level} key rotated successfully`,
      data: {
        level,
        newKey: newKey.substring(0, 8) + '...', // Don't expose full key
        rotatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return createSecureResponse(
      { error: 'Failed to rotate keys' },
      { status: 500 }
    );
  }
}