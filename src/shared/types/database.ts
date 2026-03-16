// Supabase generated database types
// Run: npx supabase gen types typescript --local > src/shared/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          subscription_tier: string
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          created_at?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          id: string
          user_id: string
          name: string
          relation: string | null
          avatar_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          relation?: string | null
          avatar_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          relation?: string | null
          avatar_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          person_id: string
          name: string
          icon: string | null
          is_custom: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          person_id: string
          name: string
          icon?: string | null
          is_custom?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          person_id?: string
          name?: string
          icon?: string | null
          is_custom?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          id: string
          category_id: string
          person_id: string
          title: string
          description: string | null
          image_url: string | null
          external_url: string | null
          price: number | null
          sentiment: string | null
          my_rating: number | null
          partner_rating: number | null
          tags: string[] | null
          ai_suggested: boolean
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          person_id: string
          title: string
          description?: string | null
          image_url?: string | null
          external_url?: string | null
          price?: number | null
          sentiment?: string | null
          my_rating?: number | null
          partner_rating?: number | null
          tags?: string[] | null
          ai_suggested?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          person_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          external_url?: string | null
          price?: number | null
          sentiment?: string | null
          my_rating?: number | null
          partner_rating?: number | null
          tags?: string[] | null
          ai_suggested?: boolean
          created_at?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          id: string
          user_id: string
          person_id: string
          category_id: string
          prompt_summary: string | null
          response: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          person_id: string
          category_id: string
          prompt_summary?: string | null
          response?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          person_id?: string
          category_id?: string
          prompt_summary?: string | null
          response?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
