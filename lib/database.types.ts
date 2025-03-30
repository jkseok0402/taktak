export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          name: string
          level: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          level: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          level?: number
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          winner_id: string
          loser_id: string
          created_at: string
        }
        Insert: {
          id?: string
          winner_id: string
          loser_id: string
          created_at?: string
        }
        Update: {
          id?: string
          winner_id?: string
          loser_id?: string
          created_at?: string
        }
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
  }
} 