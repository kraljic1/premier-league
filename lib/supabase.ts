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
          logo_url: string | null
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
          logo_url?: string | null
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
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
          season: string | null
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
          season?: string | null
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
          season?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Only throw during runtime, not during build
const isBuildTime = process.env.NODE_ENV === 'production' && !supabaseUrl

if (!isBuildTime && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Missing Supabase environment variables - database features will be unavailable')
}

// Public client for client-side use
// Creates a dummy client if env vars are missing (for build time)
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Server-side client with service role (bypasses RLS) for API routes
// Falls back to anon key if service role key is not available
export const supabaseServer = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Export row types for use in API routes
export type FixtureRow = Database['public']['Tables']['fixtures']['Row']
export type StandingRow = Database['public']['Tables']['standings']['Row']
export type CacheMetadataRow = Database['public']['Tables']['cache_metadata']['Row']
