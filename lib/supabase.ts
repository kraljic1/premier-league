import { createClient } from '@supabase/supabase-js'

// Database types (must be defined before use)
export type Database = {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string
          name: string
          short_name: string | null
          primary_color: string | null
          secondary_color: string | null
          text_color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      fixtures: {
        Row: {
          id: string
          date: string
          home_team: string
          away_team: string
          home_score: number | null
          away_score: number | null
          matchweek: number
          status: 'scheduled' | 'live' | 'finished'
          is_derby: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          date: string
          home_team: string
          away_team: string
          home_score?: number | null
          away_score?: number | null
          matchweek: number
          status: 'scheduled' | 'live' | 'finished'
          is_derby?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          home_team?: string
          away_team?: string
          home_score?: number | null
          away_score?: number | null
          matchweek?: number
          status?: 'scheduled' | 'live' | 'finished'
          is_derby?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      standings: {
        Row: {
          id: string
          position: number
          club: string
          played: number
          won: number
          drawn: number
          lost: number
          goals_for: number
          goals_against: number
          goal_difference: number
          points: number
          form: string | null
          season: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          position: number
          club: string
          played?: number
          won?: number
          drawn?: number
          lost?: number
          goals_for?: number
          goals_against?: number
          goal_difference?: number
          points?: number
          form?: string | null
          season?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          position?: number
          club?: string
          played?: number
          won?: number
          drawn?: number
          lost?: number
          goals_for?: number
          goals_against?: number
          goal_difference?: number
          points?: number
          form?: string | null
          season?: string
          created_at?: string
          updated_at?: string
        }
      }
      scorers: {
        Row: {
          id: string
          name: string
          club: string
          goals: number
          assists: number
          season: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          club: string
          goals?: number
          assists?: number
          season?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          club?: string
          goals?: number
          assists?: number
          season?: string
          created_at?: string
          updated_at?: string
        }
      }
      cache_metadata: {
        Row: {
          key: string
          last_updated: string
          data_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          last_updated: string
          data_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          last_updated?: string
          data_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Public client for client-side use
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side client with service role (bypasses RLS) for API routes
// Falls back to anon key if service role key is not available
export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
