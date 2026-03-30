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
      admin_sent_emails: {
        Row: {
          created_at: string
          html_content: string | null
          id: string
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          sent_by: string
          status: string
          subject: string
          template_name: string
          tracking_id: string
        }
        Insert: {
          created_at?: string
          html_content?: string | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_by: string
          status?: string
          subject: string
          template_name: string
          tracking_id?: string
        }
        Update: {
          created_at?: string
          html_content?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_by?: string
          status?: string
          subject?: string
          template_name?: string
          tracking_id?: string
        }
        Relationships: []
      }
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
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          admin_id: string | null
          admin_unread_count: number
          created_at: string
          id: string
          is_closed: boolean
          last_message_at: string
          subject: string | null
          updated_at: string
          user_id: string
          user_unread_count: number
        }
        Insert: {
          admin_id?: string | null
          admin_unread_count?: number
          created_at?: string
          id?: string
          is_closed?: boolean
          last_message_at?: string
          subject?: string | null
          updated_at?: string
          user_id: string
          user_unread_count?: number
        }
        Update: {
          admin_id?: string | null
          admin_unread_count?: number
          created_at?: string
          id?: string
          is_closed?: boolean
          last_message_at?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
          user_unread_count?: number
        }
        Relationships: []
      }
      daily_alert_subscribers: {
        Row: {
          city: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_notified_at: string | null
          phone_number: string | null
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
          user_id: string | null
          whatsapp_enabled: boolean
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_notified_at?: string | null
          phone_number?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_enabled?: boolean
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_notified_at?: string | null
          phone_number?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      daisycon_feeds: {
        Row: {
          created_at: string
          feed_url: string | null
          id: string
          is_active: boolean
          last_import_at: string | null
          logo_url: string | null
          media_id: number
          name: string
          program_id: number
          properties_imported: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          feed_url?: string | null
          id?: string
          is_active?: boolean
          last_import_at?: string | null
          logo_url?: string | null
          media_id: number
          name: string
          program_id: number
          properties_imported?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          feed_url?: string | null
          id?: string
          is_active?: boolean
          last_import_at?: string | null
          logo_url?: string | null
          media_id?: number
          name?: string
          program_id?: number
          properties_imported?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      daisycon_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      facebook_group_posts: {
        Row: {
          group_id: string
          id: string
          posted_at: string
          property_id: string
        }
        Insert: {
          group_id: string
          id?: string
          posted_at?: string
          property_id: string
        }
        Update: {
          group_id?: string
          id?: string
          posted_at?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "facebook_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facebook_group_posts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_groups: {
        Row: {
          city: string | null
          created_at: string
          group_url: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          group_url: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          group_url?: string
          id?: string
          is_active?: boolean
          name?: string
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
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          errors: number | null
          feed_id: string | null
          feed_name: string | null
          id: string
          imported: number | null
          message: string | null
          processed_feeds: number | null
          skipped: number | null
          started_at: string
          status: string
          total_feeds: number | null
          type: string
          updated: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          errors?: number | null
          feed_id?: string | null
          feed_name?: string | null
          id?: string
          imported?: number | null
          message?: string | null
          processed_feeds?: number | null
          skipped?: number | null
          started_at?: string
          status?: string
          total_feeds?: number | null
          type?: string
          updated?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          errors?: number | null
          feed_id?: string | null
          feed_name?: string | null
          id?: string
          imported?: number | null
          message?: string | null
          processed_feeds?: number | null
          skipped?: number | null
          started_at?: string
          status?: string
          total_feeds?: number | null
          type?: string
          updated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "daisycon_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      makelaar_leads: {
        Row: {
          contactpersoon: string
          created_at: string
          crm_software: string | null
          email: string
          feed_url: string | null
          id: string
          kantoornaam: string
          koppeling_type: string
          opmerking: string | null
          status: string
          telefoon: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          contactpersoon: string
          created_at?: string
          crm_software?: string | null
          email: string
          feed_url?: string | null
          id?: string
          kantoornaam: string
          koppeling_type?: string
          opmerking?: string | null
          status?: string
          telefoon?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          contactpersoon?: string
          created_at?: string
          crm_software?: string | null
          email?: string
          feed_url?: string | null
          id?: string
          kantoornaam?: string
          koppeling_type?: string
          opmerking?: string | null
          status?: string
          telefoon?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      neighborhood_reviews: {
        Row: {
          city: string
          comment: string | null
          cons: string | null
          created_at: string
          id: string
          is_approved: boolean
          name: string
          neighborhood: string
          pros: string | null
          rating: number
          user_id: string | null
        }
        Insert: {
          city: string
          comment?: string | null
          cons?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          name: string
          neighborhood: string
          pros?: string | null
          rating: number
          user_id?: string | null
        }
        Update: {
          city?: string
          comment?: string | null
          cons?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          name?: string
          neighborhood?: string
          pros?: string | null
          rating?: number
          user_id?: string | null
        }
        Relationships: []
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
          facebook_posted_at: string | null
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
          facebook_posted_at?: string | null
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
          facebook_posted_at?: string | null
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
      property_comments: {
        Row: {
          content: string
          created_at: string
          email: string
          id: string
          is_approved: boolean
          name: string
          property_id: string
        }
        Insert: {
          content: string
          created_at?: string
          email: string
          id?: string
          is_approved?: boolean
          name: string
          property_id: string
        }
        Update: {
          content?: string
          created_at?: string
          email?: string
          id?: string
          is_approved?: boolean
          name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_comments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      search_queries: {
        Row: {
          city: string | null
          count: number
          first_searched_at: string
          id: string
          last_searched_at: string
          listing_type: string | null
          max_price: number | null
          min_bedrooms: number | null
          property_type: string | null
          query: string | null
        }
        Insert: {
          city?: string | null
          count?: number
          first_searched_at?: string
          id?: string
          last_searched_at?: string
          listing_type?: string | null
          max_price?: number | null
          min_bedrooms?: number | null
          property_type?: string | null
          query?: string | null
        }
        Update: {
          city?: string | null
          count?: number
          first_searched_at?: string
          id?: string
          last_searched_at?: string
          listing_type?: string | null
          max_price?: number | null
          min_bedrooms?: number | null
          property_type?: string | null
          query?: string | null
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
