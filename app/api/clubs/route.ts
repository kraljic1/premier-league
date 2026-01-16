import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

/**
 * GET /api/clubs
 * Returns all clubs with their logo URLs from database
 * Query params:
 *   - name: filter by club name
 */
export async function GET(request: Request) {
  try {
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
      console.error('[Clubs API] Error fetching clubs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clubs' },
        { status: 500 }
      );
    }

    return NextResponse.json(clubs || []);
  } catch (error) {
    console.error('[Clubs API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
