export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          build_year: number | null
          city: string
          created_at: string
          description: string | null
          energy_label: Database["public"]["Enums"]["energy_label"] | null
          house_number: string
          id: string
          images: string[] | null
          latitude: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          longitude: number | null
          neighborhood: string | null
          postal_code: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          status: Database["public"]["Enums"]["property_status"]
          street: string
          surface_area: number | null
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          build_year?: number | null
          city: string
          created_at?: string
          description?: string | null
          energy_label?: Database["public"]["Enums"]["energy_label"] | null
          house_number: string
          id?: string
          images?: string[] | null
          latitude?: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          neighborhood?: string | null
          postal_code: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"]
          street: string
          surface_area?: number | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          build_year?: number | null
          city?: string
          created_at?: string
          description?: string | null
          energy_label?: Database["public"]["Enums"]["energy_label"] | null
          house_number?: string
          id?: string
          images?: string[] | null
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          neighborhood?: string | null
          postal_code?: string
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"]
          street?: string
          surface_area?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      search_alerts: {
        Row: {
          city: string | null
          created_at: string
          email_notifications: boolean
          id: string
          is_active: boolean
          last_notified_at: string | null
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          max_price: number | null
          max_surface: number | null
          min_bedrooms: number | null
          min_price: number | null
          min_surface: number | null
          name: string
          property_type: Database["public"]["Enums"]["property_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email_notifications?: boolean
          id?: string
          is_active?: boolean
          last_notified_at?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          max_price?: number | null
          max_surface?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          min_surface?: number | null
          name: string
          property_type?: Database["public"]["Enums"]["property_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email_notifications?: boolean
          id?: string
          is_active?: boolean
          last_notified_at?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          max_price?: number | null
          max_surface?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          min_surface?: number | null
          name?: string
          property_type?: Database["public"]["Enums"]["property_type"] | null
          updated_at?: string
          user_id?: string
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
      energy_label: "A++" | "A+" | "A" | "B" | "C" | "D" | "E" | "F" | "G"
      listing_type: "huur" | "koop"
      property_status: "actief" | "verhuurd" | "verkocht" | "inactief"
      property_type: "appartement" | "huis" | "studio" | "kamer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      energy_label: ["A++", "A+", "A", "B", "C", "D", "E", "F", "G"],
      listing_type: ["huur", "koop"],
      property_status: ["actief", "verhuurd", "verkocht", "inactief"],
      property_type: ["appartement", "huis", "studio", "kamer"],
    },
  },
} as const
