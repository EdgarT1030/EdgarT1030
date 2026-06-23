export type Retailer = 'home_depot' | 'lowes' | 'menards' | 'other'
export type ReportStatus = 'pending' | 'confirmed' | 'expired' | 'disputed'
export type VoteType = 'confirm' | 'dispute'

export interface Store {
  id: string
  retailer: Retailer
  store_number: string | null
  name: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  created_at: string
}

export interface Item {
  id: string
  sku: string | null
  model_number: string | null
  name: string
  category: string | null
  image_url: string | null
  created_by: string | null
  created_at: string
}

export interface PennyReport {
  id: string
  item_id: string
  store_id: string
  reported_price: number
  photo_url: string | null
  status: ReportStatus
  reported_by: string | null
  expires_at: string
  created_at: string
}

export interface ReportVote {
  id: string
  report_id: string
  user_id: string
  vote: VoteType
  created_at: string
}

export interface Profile {
  id: string
  username: string | null
  reputation_score: number
  created_at: string
}

// Joined type used in UI queries
export interface ReportWithDetails extends PennyReport {
  item: Item
  store: Store
  vote_counts: { confirm: number; dispute: number }
  user_vote?: VoteType | null
}

// Database shape expected by @supabase/supabase-js generics
export interface Database {
  public: {
    Tables: {
      stores: {
        Row: Store
        Insert: Omit<Store, 'id' | 'created_at'>
        Update: Partial<Omit<Store, 'id'>>
        Relationships: []
      }
      items: {
        Row: Item
        Insert: Omit<Item, 'id' | 'created_at'>
        Update: Partial<Omit<Item, 'id'>>
        Relationships: []
      }
      penny_reports: {
        Row: PennyReport
        Insert: Omit<PennyReport, 'id' | 'created_at' | 'expires_at'>
        Update: Partial<Omit<PennyReport, 'id'>>
        Relationships: []
      }
      report_votes: {
        Row: ReportVote
        Insert: Omit<ReportVote, 'id' | 'created_at'>
        Update: Partial<Omit<ReportVote, 'id'>>
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Pick<Profile, 'id'> & Partial<Omit<Profile, 'id' | 'created_at'>>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      expire_old_reports: { Args: Record<string, never>; Returns: undefined }
    }
    Enums: {
      retailer_type: Retailer
      report_status: ReportStatus
      vote_type: VoteType
    }
    CompositeTypes: Record<string, never>
  }
}
