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
      blog_posts: {
        Row: {
          author_id: string
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          last_login_at: string | null
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
          last_login_at?: string | null
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
          last_login_at?: string | null
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
          slug: string | null
          source_site: string | null
          source_url: string | null
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
          slug?: string | null
          source_site?: string | null
          source_url?: string | null
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
          slug?: string | null
          source_site?: string | null
          source_url?: string | null
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
      scraped_properties: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          created_at: string
          description: string | null
          house_number: string | null
          id: string
          images: string[] | null
          last_seen_at: string | null
          listing_type: string | null
          postal_code: string | null
          price: number | null
          property_type: string | null
          published_property_id: string | null
          raw_data: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          scraper_id: string | null
          source_site: string
          source_url: string
          status: string
          street: string | null
          surface_area: number | null
          title: string
          updated_at: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          house_number?: string | null
          id?: string
          images?: string[] | null
          last_seen_at?: string | null
          listing_type?: string | null
          postal_code?: string | null
          price?: number | null
          property_type?: string | null
          published_property_id?: string | null
          raw_data?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scraper_id?: string | null
          source_site: string
          source_url: string
          status?: string
          street?: string | null
          surface_area?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          house_number?: string | null
          id?: string
          images?: string[] | null
          last_seen_at?: string | null
          listing_type?: string | null
          postal_code?: string | null
          price?: number | null
          property_type?: string | null
          published_property_id?: string | null
          raw_data?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scraper_id?: string | null
          source_site?: string
          source_url?: string
          status?: string
          street?: string | null
          surface_area?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraped_properties_published_property_id_fkey"
            columns: ["published_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scraped_properties_scraper_id_fkey"
            columns: ["scraper_id"]
            isOneToOne: false
            referencedRelation: "scrapers"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          message: string | null
          properties_scraped: number | null
          scraper_id: string
          status: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          message?: string | null
          properties_scraped?: number | null
          scraper_id: string
          status: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          message?: string | null
          properties_scraped?: number | null
          scraper_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraper_logs_scraper_id_fkey"
            columns: ["scraper_id"]
            isOneToOne: false
            referencedRelation: "scrapers"
            referencedColumns: ["id"]
          },
        ]
      }
      scrapers: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          last_run_status: string | null
          last_scheduled_run: string | null
          name: string
          properties_found: number | null
          schedule_days: number[] | null
          schedule_interval: string
          updated_at: string
          website_url: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_status?: string | null
          last_scheduled_run?: string | null
          name: string
          properties_found?: number | null
          schedule_days?: number[] | null
          schedule_interval?: string
          updated_at?: string
          website_url: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_status?: string | null
          last_scheduled_run?: string | null
          name?: string
          properties_found?: number | null
          schedule_days?: number[] | null
          schedule_interval?: string
          updated_at?: string
          website_url?: string
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_home_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
      energy_label: ["A++", "A+", "A", "B", "C", "D", "E", "F", "G"],
      listing_type: ["huur", "koop"],
      property_status: ["actief", "verhuurd", "verkocht", "inactief"],
      property_type: ["appartement", "huis", "studio", "kamer"],
    },
  },
} as const
