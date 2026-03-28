// Типы базы данных, сгенерированные Supabase
// Запуск: npx supabase gen types typescript --local > src/shared/types/database.ts

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
          is_admin: boolean
          country_code: string | null
          language: string | null
          platform: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          created_at?: string
          is_admin?: boolean
          country_code?: string | null
          language?: string | null
          platform?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          created_at?: string
          is_admin?: boolean
          country_code?: string | null
          language?: string | null
          platform?: string | null
          stripe_customer_id?: string | null
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
          is_favorite: boolean
          relation_since: string | null
          birth_date: string | null
          birth_notify_days: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          relation?: string | null
          avatar_url?: string | null
          notes?: string | null
          is_favorite?: boolean
          relation_since?: string | null
          birth_date?: string | null
          birth_notify_days?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          relation?: string | null
          avatar_url?: string | null
          notes?: string | null
          is_favorite?: boolean
          relation_since?: string | null
          birth_date?: string | null
          birth_notify_days?: number
          created_at?: string
        }
        Relationships: []
      }
      person_dates: {
        Row: {
          id: string
          person_id: string
          user_id: string
          title: string
          date: string
          notify_days: number
          created_at: string
        }
        Insert: {
          id?: string
          person_id: string
          user_id: string
          title: string
          date: string
          notify_days?: number
          created_at?: string
        }
        Update: {
          title?: string
          date?: string
          notify_days?: number
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
      custom_relations: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          name?: string
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
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          platform: string | null
          country_code: string | null
          language: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          platform?: string | null
          country_code?: string | null
          language?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          platform?: string | null
          country_code?: string | null
          language?: string | null
          metadata?: Json | null
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
