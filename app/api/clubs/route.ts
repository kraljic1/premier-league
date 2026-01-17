import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';

/**
 * GET /api/clubs
 * Returns all clubs with their logo URLs from database
 * Query params:
 *   - name: filter by club name
 */
export async function GET(request: Request) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.warn('[Clubs API] Supabase not configured, returning empty array');
      return NextResponse.json([], {
        headers: {
          'X-Cache': 'MISS-NO-DB',
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const clubName = searchParams.get('name');

    let query = supabaseServer
      .from('clubs')
      .select('*')
      .order('name');

    if (clubName) {
      query = query.eq('name', clubName);
    }

    const { data: clubs, error } = await query;

    if (error) {
      console.error('[Clubs API] Error fetching clubs:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      // Return empty array instead of error to prevent client-side failures
      // The client code already has fallback logic
      return NextResponse.json([], {
        status: 200,
        headers: {
          'X-Cache': 'MISS-ERROR',
          'X-Error': error.message || 'Database query failed',
        },
      });
    }

    return NextResponse.json(clubs || [], {
      headers: {
        'X-Cache': 'HIT',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[Clubs API] Unexpected error:', error);
    
    // Return empty array instead of error to prevent client-side failures
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json([], {
      status: 200,
      headers: {
        'X-Cache': 'MISS-ERROR',
        'X-Error': errorMessage,
      },
    });
  }
}
