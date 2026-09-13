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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      amenities: {
        Row: {
          created_at: string
          cta_label: string
          description: string
          eyebrow: string
          facilities: string[]
          gallery: string[]
          hero_image: string
          hours: string
          key: string
          name: string
          pricing_note: string
          published: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string
          description?: string
          eyebrow?: string
          facilities?: string[]
          gallery?: string[]
          hero_image?: string
          hours?: string
          key: string
          name?: string
          pricing_note?: string
          published?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string
          description?: string
          eyebrow?: string
          facilities?: string[]
          gallery?: string[]
          hero_image?: string
          hours?: string
          key?: string
          name?: string
          pricing_note?: string
          published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      billboards: {
        Row: {
          available: boolean
          dimensions: string
          id: string
          image: string
          location: string
          price: number
        }
        Insert: {
          available?: boolean
          dimensions?: string
          id?: string
          image?: string
          location: string
          price?: number
        }
        Update: {
          available?: boolean
          dimensions?: string
          id?: string
          image?: string
          location?: string
          price?: number
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          category: string
          content: string
          created_at: string
          description: string
          id: string
          image_url: string
          published: boolean
          published_at: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          description: string
          id?: string
          image_url: string
          published?: boolean
          published_at?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          published?: boolean
          published_at?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          adults: number
          amount: number
          check_in: string
          check_out: string
          checked_in_at: string | null
          checked_out_at: string | null
          children: number
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          payment_status: string
          reference: string
          room_id: string | null
          room_type_id: string
          source: string
          special_requests: string | null
          status: string
        }
        Insert: {
          adults?: number
          amount?: number
          check_in: string
          check_out: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          children?: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          payment_status?: string
          reference: string
          room_id?: string | null
          room_type_id: string
          source?: string
          special_requests?: string | null
          status?: string
        }
        Update: {
          adults?: number
          amount?: number
          check_in?: string
          check_out?: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          children?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          payment_status?: string
          reference?: string
          room_id?: string | null
          room_type_id?: string
          source?: string
          special_requests?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_conversations: {
        Row: {
          category: string
          created_at: string
          guest_email: string
          guest_name: string
          guest_phone: string | null
          id: string
          last_message_at: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          id?: string
          last_message_at?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          id?: string
          last_message_at?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          attachment_mime_type: string | null
          attachment_name: string | null
          attachment_path: string | null
          attachment_size: number | null
          conversation_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          sender_type: string
          sender_user_id: string | null
        }
        Insert: {
          attachment_mime_type?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sender_type: string
          sender_user_id?: string | null
        }
        Update: {
          attachment_mime_type?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sender_type?: string
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "contact_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          last_stay: string | null
          marketing_email_opt_in: boolean
          name: string
          phone: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_stay?: string | null
          marketing_email_opt_in?: boolean
          name: string
          phone?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_stay?: string | null
          marketing_email_opt_in?: boolean
          name?: string
          phone?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      drinks: {
        Row: {
          available: boolean
          bar: string
          category: string
          id: string
          name: string
          price: number
        }
        Insert: {
          available?: boolean
          bar: string
          category: string
          id?: string
          name: string
          price?: number
        }
        Update: {
          available?: boolean
          bar?: string
          category?: string
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          recipient: string
          related_id: string | null
          resend_message_id: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          recipient: string
          related_id?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          recipient?: string
          related_id?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      event_reservations: {
        Row: {
          created_at: string
          event_id: string
          guest_count: number
          guest_email: string
          guest_name: string
          guest_phone: string
          id: string
          notes: string | null
          reserved_at: string | null
          reserved_by: string | null
          staff_note: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_count?: number
          guest_email: string
          guest_name: string
          guest_phone: string
          id?: string
          notes?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          staff_note?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_count?: number
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          id?: string
          notes?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          staff_note?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          date: string
          description: string
          id: string
          image: string
          price: number
          published: boolean
          title: string
        }
        Insert: {
          capacity?: number
          date: string
          description?: string
          id?: string
          image?: string
          price?: number
          published?: boolean
          title: string
        }
        Update: {
          capacity?: number
          date?: string
          description?: string
          id?: string
          image?: string
          price?: number
          published?: boolean
          title?: string
        }
        Relationships: []
      }
      financial_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          incurred_at: string
          method: string
          reference: string
          status: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          incurred_at?: string
          method: string
          reference: string
          status?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          incurred_at?: string
          method?: string
          reference?: string
          status?: string
          vendor?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          description: string
          direction: string
          id: string
          metadata: Json
          method: string | null
          occurred_at: string
          outlet: string | null
          reference: string | null
          source_id: string
          source_type: string
          status: string
          transaction_type: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          description: string
          direction: string
          id?: string
          metadata?: Json
          method?: string | null
          occurred_at?: string
          outlet?: string | null
          reference?: string | null
          source_id: string
          source_type: string
          status?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          description?: string
          direction?: string
          id?: string
          metadata?: Json
          method?: string | null
          occurred_at?: string
          outlet?: string | null
          reference?: string | null
          source_id?: string
          source_type?: string
          status?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          sort_order: number
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id: string
          sort_order?: number
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      guest_notifications: {
        Row: {
          body: string
          created_at: string
          href: string | null
          id: string
          metadata: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          href?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          href?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      guest_requests: {
        Row: {
          booking_ref: string | null
          created_at: string
          customer_id: string | null
          guest_name: string
          id: string
          message: string
          room: string | null
          status: string
          type: string
        }
        Insert: {
          booking_ref?: string | null
          created_at?: string
          customer_id?: string | null
          guest_name?: string
          id?: string
          message?: string
          room?: string | null
          status?: string
          type?: string
        }
        Update: {
          booking_ref?: string | null
          created_at?: string
          customer_id?: string | null
          guest_name?: string
          id?: string
          message?: string
          room?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_reviews: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          keywords: string[]
          published: boolean
          published_at: string | null
          rating: number
          review: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          keywords?: string[]
          published?: boolean
          published_at?: string | null
          rating: number
          review: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          keywords?: string[]
          published?: boolean
          published_at?: string | null
          rating?: number
          review?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      housekeeping_tasks: {
        Row: {
          assigned_to: string
          booking_id: string | null
          checkout_time: string
          completed_at: string | null
          id: string
          notes: string
          priority: string
          room: string
          room_id: string | null
          room_type: string
          status: string
        }
        Insert: {
          assigned_to?: string
          booking_id?: string | null
          checkout_time?: string
          completed_at?: string | null
          id?: string
          notes?: string
          priority?: string
          room: string
          room_id?: string | null
          room_type?: string
          status?: string
        }
        Update: {
          assigned_to?: string
          booking_id?: string | null
          checkout_time?: string
          completed_at?: string | null
          id?: string
          notes?: string
          priority?: string
          room?: string
          room_id?: string | null
          room_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tickets: {
        Row: {
          assigned_to: string
          date_reported: string
          id: string
          issue: string
          notes: string
          priority: string
          room: string
          status: string
        }
        Insert: {
          assigned_to?: string
          date_reported?: string
          id?: string
          issue: string
          notes?: string
          priority?: string
          room: string
          status?: string
        }
        Update: {
          assigned_to?: string
          date_reported?: string
          id?: string
          issue?: string
          notes?: string
          priority?: string
          room?: string
          status?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          available: boolean
          category: string
          id: string
          image: string
          name: string
          outlet: string
          price: number
        }
        Insert: {
          available?: boolean
          category: string
          id?: string
          image?: string
          name: string
          outlet: string
          price?: number
        }
        Update: {
          available?: boolean
          category?: string
          id?: string
          image?: string
          name?: string
          outlet?: string
          price?: number
        }
        Relationships: []
      }
      offers: {
        Row: {
          active: boolean
          category: string
          description: string
          discount: string
          id: string
          title: string
        }
        Insert: {
          active?: boolean
          category?: string
          description?: string
          discount?: string
          id?: string
          title: string
        }
        Update: {
          active?: boolean
          category?: string
          description?: string
          discount?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      parking_zones: {
        Row: {
          capacity: number
          id: string
          name: string
          occupied: number
          type: string
        }
        Insert: {
          capacity?: number
          id?: string
          name: string
          occupied?: number
          type?: string
        }
        Update: {
          capacity?: number
          id?: string
          name?: string
          occupied?: number
          type?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_ref: string
          customer: string
          customer_id: string | null
          date: string
          id: string
          method: string
          reference: string
          status: string
        }
        Insert: {
          amount?: number
          booking_ref?: string
          customer?: string
          customer_id?: string | null
          date?: string
          id?: string
          method?: string
          reference: string
          status?: string
        }
        Update: {
          amount?: number
          booking_ref?: string
          customer?: string
          customer_id?: string | null
          date?: string
          id?: string
          method?: string
          reference?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          name?: string
          phone?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          label: string
          role: Database["public"]["Enums"]["app_role"]
          section: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          label: string
          role: Database["public"]["Enums"]["app_role"]
          section: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          label?: string
          role?: Database["public"]["Enums"]["app_role"]
          section?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      room_types: {
        Row: {
          active: boolean
          amenities: string[]
          bed_type: string
          category: string
          created_at: string
          description: string
          guests: number
          id: string
          images: string[]
          name: string
          price: number
          size_sqm: number
          slug: string
        }
        Insert: {
          active?: boolean
          amenities?: string[]
          bed_type?: string
          category: string
          created_at?: string
          description?: string
          guests?: number
          id: string
          images?: string[]
          name: string
          price?: number
          size_sqm?: number
          slug: string
        }
        Update: {
          active?: boolean
          amenities?: string[]
          bed_type?: string
          category?: string
          created_at?: string
          description?: string
          guests?: number
          id?: string
          images?: string[]
          name?: string
          price?: number
          size_sqm?: number
          slug?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          floor: string
          id: string
          room_number: string
          room_type_id: string
          status: string
        }
        Insert: {
          floor?: string
          id: string
          room_number: string
          room_type_id: string
          status?: string
        }
        Update: {
          floor?: string
          id?: string
          room_number?: string
          room_type_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      short_lets: {
        Row: {
          amenities: string[]
          available: boolean
          bedrooms: number
          description: string
          id: string
          image: string
          name: string
          price: number
          type: string
        }
        Insert: {
          amenities?: string[]
          available?: boolean
          bedrooms?: number
          description?: string
          id?: string
          image?: string
          name: string
          price?: number
          type?: string
        }
        Update: {
          amenities?: string[]
          available?: boolean
          bedrooms?: number
          description?: string
          id?: string
          image?: string
          name?: string
          price?: number
          type?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          environment: string
          maintenance_mode: boolean
          updated_at: string
        }
        Insert: {
          environment: string
          maintenance_mode?: boolean
          updated_at?: string
        }
        Update: {
          environment?: string
          maintenance_mode?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          department: string
          email: string
          id: string
          joined: string
          name: string
          phone: string
          role: string
          status: string
          user_id: string | null
        }
        Insert: {
          department?: string
          email: string
          id?: string
          joined?: string
          name: string
          phone?: string
          role: string
          status?: string
          user_id?: string | null
        }
        Update: {
          department?: string
          email?: string
          id?: string
          joined?: string
          name?: string
          phone?: string
          role?: string
          status?: string
          user_id?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      notify_guest: {
        Args: {
          p_body: string
          p_href?: string
          p_metadata?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      record_financial_transaction: {
        Args: {
          p_amount: number
          p_booking_id?: string
          p_created_by?: string
          p_customer_id?: string
          p_description: string
          p_direction: string
          p_metadata?: Json
          p_method?: string
          p_occurred_at?: string
          p_outlet?: string
          p_reference?: string
          p_source_id: string
          p_source_type: string
          p_transaction_type: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "manager"
        | "reception"
        | "housekeeping"
        | "maintenance"
        | "restaurant"
        | "bar"
        | "accountant"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "super_admin",
        "manager",
        "reception",
        "housekeeping",
        "maintenance",
        "restaurant",
        "bar",
        "accountant",
      ],
    },
  },
} as const
