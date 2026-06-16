import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let supabaseClient: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ao arquivo .env e reinicie o dev server.'
    )
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  return supabaseClient
}

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ao arquivo .env e reinicie o dev server.'
  )
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          bio: string | null
          favorite_team: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          favorite_team?: string | null
        }
        Update: {
          username?: string
          avatar_url?: string | null
          bio?: string | null
          favorite_team?: string | null
          updated_at?: string
        }
      }
      stickers: {
        Row: {
          id: string
          user_id: string
          athlete_name: string
          country: string
          position: string
          shirt_number: number
          image_url: string | null
          status: 'have' | 'want' | 'duplicate'
          description: string | null
          created_at: string
          updated_at: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          sticker_id: string
          created_at: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          sticker_id: string
          content: string
          created_at: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
        }
      }
    }
  }
}
