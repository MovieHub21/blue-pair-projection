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
      bookings: {
        Row: {
          adults: number
          amount: number
          check_in: string
          check_out: string
          children: number
          created_at: string
          customer_id: string
          id: string
          payment_status: string
          reference: string
          room_id: string | null
          room_type_id: string
          special_requests: string | null
          status: string
        }
        Insert: {
          adults?: number
          amount?: number
          check_in: string
          check_out: string
          children?: number
          created_at?: string
          customer_id: string
          id?: string
          payment_status?: string
          reference: string
          room_id?: string | null
          room_type_id: string
          special_requests?: string | null
          status?: string
        }
        Update: {
          adults?: number
          amount?: number
          check_in?: string
          check_out?: string
          children?: number
          created_at?: string
          customer_id?: string
          id?: string
          payment_status?: string
          reference?: string
          room_id?: string | null
          room_type_id?: string
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
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          last_stay: string | null
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
      housekeeping_tasks: {
        Row: {
          assigned_to: string
          checkout_time: string
          completed_at: string | null
          id: string
          notes: string
          priority: string
          room: string
          room_type: string
          status: string
        }
        Insert: {
          assigned_to?: string
          checkout_time?: string
          completed_at?: string | null
          id?: string
          notes?: string
          priority?: string
          room: string
          room_type?: string
          status?: string
        }
        Update: {
          assigned_to?: string
          checkout_time?: string
          completed_at?: string | null
          id?: string
          notes?: string
          priority?: string
          room?: string
          room_type?: string
          status?: string
        }
        Relationships: []
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
          date?: string
          id?: string
          method?: string
          reference?: string
          status?: string
        }
        Relationships: []
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
