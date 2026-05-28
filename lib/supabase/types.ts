export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      flavor_categories: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_ingredients: {
        Row: {
          created_at: string
          id: string
          order_id: string
          percentage: number
          tobacco_id: string | null
          tobacco_snapshot: Json
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          percentage: number
          tobacco_id?: string | null
          tobacco_snapshot: Json
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          percentage?: number
          tobacco_id?: string | null
          tobacco_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "order_ingredients_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ingredients_tobacco_id_fkey"
            columns: ["tobacco_id"]
            isOneToOne: false
            referencedRelation: "tobaccos"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_by: string | null
          cancelled_reason: string | null
          cool_intensity: number
          created_at: string
          deposit_amount: number
          guest_contact: string | null
          guest_id: string | null
          guest_name: string | null
          id: string
          is_overpack: boolean
          last_coal_reminder_at: string | null
          notes: string | null
          preset_mix_id: string | null
          price: number
          service_type: string
          short_code: string
          status: string
          status_changed_at: string
          table_id: number | null
          telegram_chat_id: string | null
          telegram_message_id: number | null
          updated_at: string
        }
        Insert: {
          accepted_by?: string | null
          cancelled_reason?: string | null
          cool_intensity?: number
          created_at?: string
          deposit_amount?: number
          guest_contact?: string | null
          guest_id?: string | null
          guest_name?: string | null
          id?: string
          is_overpack?: boolean
          last_coal_reminder_at?: string | null
          notes?: string | null
          preset_mix_id?: string | null
          price?: number
          service_type?: string
          short_code: string
          status?: string
          status_changed_at?: string
          table_id?: number | null
          telegram_chat_id?: string | null
          telegram_message_id?: number | null
          updated_at?: string
        }
        Update: {
          accepted_by?: string | null
          cancelled_reason?: string | null
          cool_intensity?: number
          created_at?: string
          deposit_amount?: number
          guest_contact?: string | null
          guest_id?: string | null
          guest_name?: string | null
          id?: string
          is_overpack?: boolean
          last_coal_reminder_at?: string | null
          notes?: string | null
          preset_mix_id?: string | null
          price?: number
          service_type?: string
          short_code?: string
          status?: string
          status_changed_at?: string
          table_id?: number | null
          telegram_chat_id?: string | null
          telegram_message_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_preset_mix_id_fkey"
            columns: ["preset_mix_id"]
            isOneToOne: false
            referencedRelation: "preset_mixes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reviews: {
        Row: {
          comment: string | null
          created_at: string
          guest_id: string
          order_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          guest_id: string
          order_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          guest_id?: string
          order_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      preset_mix_ingredients: {
        Row: {
          percentage: number
          preset_mix_id: string
          tobacco_id: string
        }
        Insert: {
          percentage: number
          preset_mix_id: string
          tobacco_id: string
        }
        Update: {
          percentage?: number
          preset_mix_id?: string
          tobacco_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preset_mix_ingredients_preset_mix_id_fkey"
            columns: ["preset_mix_id"]
            isOneToOne: false
            referencedRelation: "preset_mixes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preset_mix_ingredients_tobacco_id_fkey"
            columns: ["tobacco_id"]
            isOneToOne: false
            referencedRelation: "tobaccos"
            referencedColumns: ["id"]
          },
        ]
      }
      mix_ratings: {
        Row: {
          created_at: string
          guest_id: string
          preset_mix_id: string
          stars: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          preset_mix_id: string
          stars: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          preset_mix_id?: string
          stars?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mix_ratings_preset_mix_id_fkey"
            columns: ["preset_mix_id"]
            isOneToOne: false
            referencedRelation: "preset_mixes"
            referencedColumns: ["id"]
          },
        ]
      }
      preset_mixes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_mix_of_day: boolean
          is_new: boolean
          is_signature: boolean
          name: string
          rating_avg: number
          rating_count: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_mix_of_day?: boolean
          is_new?: boolean
          is_signature?: boolean
          name: string
          rating_avg?: number
          rating_count?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_mix_of_day?: boolean
          is_new?: boolean
          is_signature?: boolean
          name?: string
          rating_avg?: number
          rating_count?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: string
          telegram_chat_id: number | null
          user_telegram_id: number | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          role: string
          telegram_chat_id?: number | null
          user_telegram_id?: number | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
          telegram_chat_id?: number | null
          user_telegram_id?: number | null
        }
        Relationships: []
      }
      tables: {
        Row: {
          created_at: string
          display_name: string | null
          id: number
          is_active: boolean
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: number
          is_active?: boolean
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: number
          is_active?: boolean
        }
        Relationships: []
      }
      tobacco_brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      tobaccos: {
        Row: {
          brand_id: string
          category_id: string | null
          color: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          is_active: boolean
          likes_count: number
          name: string
          popularity: number
          smoke: number
          strength: number
          updated_at: string
        }
        Insert: {
          brand_id: string
          category_id?: string | null
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_active?: boolean
          likes_count?: number
          name: string
          popularity?: number
          smoke?: number
          strength: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category_id?: string | null
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_active?: boolean
          likes_count?: number
          name?: string
          popularity?: number
          smoke?: number
          strength?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tobaccos_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "tobacco_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tobaccos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "flavor_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tobacco_likes: {
        Row: {
          created_at: string
          guest_id: string
          tobacco_id: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          tobacco_id: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          tobacco_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tobacco_likes_tobacco_id_fkey"
            columns: ["tobacco_id"]
            isOneToOne: false
            referencedRelation: "tobaccos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_short_code: { Args: never; Returns: string }
      has_staff_role: { Args: { required_role: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
