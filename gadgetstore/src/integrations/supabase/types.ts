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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_name: string
          category_tag: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          read_time_minutes: number | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          category_tag?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          read_time_minutes?: number | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          category_tag?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          read_time_minutes?: number | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          payment_reference: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_country: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          payment_reference?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          payment_reference?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          label: string
          price_modifier: number
          product_id: string
          sort_order: number
          value: string | null
          variant_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          price_modifier?: number
          product_id: string
          sort_order?: number
          value?: string | null
          variant_type: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          price_modifier?: number
          product_id?: string
          sort_order?: number
          value?: string | null
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          is_on_sale: boolean
          name: string
          price: number
          rating: number | null
          rating_count: number | null
          sale_price: number | null
          slug: string
          specs: Json | null
          stock: number
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_on_sale?: boolean
          name: string
          price: number
          rating?: number | null
          rating_count?: number | null
          sale_price?: number | null
          slug: string
          specs?: Json | null
          stock?: number
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_on_sale?: boolean
          name?: string
          price?: number
          rating?: number | null
          rating_count?: number | null
          sale_price?: number | null
          slug?: string
          specs?: Json | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          reward_amount: number
          reward_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          reward_amount?: number
          reward_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          reward_amount?: number
          reward_status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          product_id: string
          rating: number
          review_text: string | null
          reviewer_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          rating?: number
          review_text?: string | null
          reviewer_name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          review_text?: string | null
          reviewer_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sell_request_images: {
        Row: {
          created_at: string
          id: string
          sell_request_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          sell_request_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          sell_request_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sell_request_images_sell_request_id_fkey"
            columns: ["sell_request_id"]
            isOneToOne: false
            referencedRelation: "sell_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sell_requests: {
        Row: {
          admin_quoted_price: number | null
          battery_health: string | null
          battery_replaced: boolean
          broken_screen: boolean
          carrier: string | null
          casing_changed: boolean
          condition: Database["public"]["Enums"]["device_condition"]
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          device_type: string
          estimated_price: number
          face_id_working: boolean
          id: string
          model: string
          notes: string | null
          number_of_devices: number
          screen_replaced: boolean
          snapchat_banned: boolean
          status: Database["public"]["Enums"]["sell_request_status"]
          storage_size: string | null
          touch_id_working: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_quoted_price?: number | null
          battery_health?: string | null
          battery_replaced?: boolean
          broken_screen?: boolean
          carrier?: string | null
          casing_changed?: boolean
          condition?: Database["public"]["Enums"]["device_condition"]
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          device_type: string
          estimated_price?: number
          face_id_working?: boolean
          id?: string
          model: string
          notes?: string | null
          number_of_devices?: number
          screen_replaced?: boolean
          snapchat_banned?: boolean
          status?: Database["public"]["Enums"]["sell_request_status"]
          storage_size?: string | null
          touch_id_working?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_quoted_price?: number | null
          battery_health?: string | null
          battery_replaced?: boolean
          broken_screen?: boolean
          carrier?: string | null
          casing_changed?: boolean
          condition?: Database["public"]["Enums"]["device_condition"]
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          device_type?: string
          estimated_price?: number
          face_id_working?: boolean
          id?: string
          model?: string
          notes?: string | null
          number_of_devices?: number
          screen_replaced?: boolean
          snapchat_banned?: boolean
          status?: Database["public"]["Enums"]["sell_request_status"]
          storage_size?: string | null
          touch_id_working?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      swap_listing_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          listing_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          listing_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          listing_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "swap_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      swap_listings: {
        Row: {
          brand: string | null
          cash_topup_amount: number | null
          category: string
          condition: Database["public"]["Enums"]["swap_condition"]
          created_at: string
          description: string | null
          desired_items: string[] | null
          estimated_value: number
          id: string
          location_city: string | null
          model: string | null
          open_to_cash_topup: boolean
          open_to_partial_trade: boolean
          status: Database["public"]["Enums"]["swap_listing_status"]
          storage_specs: string | null
          swap_type: Database["public"]["Enums"]["swap_type"]
          title: string
          updated_at: string
          user_id: string
          year_purchased: number | null
        }
        Insert: {
          brand?: string | null
          cash_topup_amount?: number | null
          category?: string
          condition?: Database["public"]["Enums"]["swap_condition"]
          created_at?: string
          description?: string | null
          desired_items?: string[] | null
          estimated_value?: number
          id?: string
          location_city?: string | null
          model?: string | null
          open_to_cash_topup?: boolean
          open_to_partial_trade?: boolean
          status?: Database["public"]["Enums"]["swap_listing_status"]
          storage_specs?: string | null
          swap_type?: Database["public"]["Enums"]["swap_type"]
          title: string
          updated_at?: string
          user_id: string
          year_purchased?: number | null
        }
        Update: {
          brand?: string | null
          cash_topup_amount?: number | null
          category?: string
          condition?: Database["public"]["Enums"]["swap_condition"]
          created_at?: string
          description?: string | null
          desired_items?: string[] | null
          estimated_value?: number
          id?: string
          location_city?: string | null
          model?: string | null
          open_to_cash_topup?: boolean
          open_to_partial_trade?: boolean
          status?: Database["public"]["Enums"]["swap_listing_status"]
          storage_specs?: string | null
          swap_type?: Database["public"]["Enums"]["swap_type"]
          title?: string
          updated_at?: string
          user_id?: string
          year_purchased?: number | null
        }
        Relationships: []
      }
      swap_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          proposal_id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          proposal_id: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          proposal_id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_messages_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "swap_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      swap_proposals: {
        Row: {
          cash_topup_amount: number | null
          created_at: string
          id: string
          listing_id: string
          message: string | null
          offered_listing_id: string | null
          proposer_id: string
          status: Database["public"]["Enums"]["swap_proposal_status"]
          updated_at: string
        }
        Insert: {
          cash_topup_amount?: number | null
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          offered_listing_id?: string | null
          proposer_id: string
          status?: Database["public"]["Enums"]["swap_proposal_status"]
          updated_at?: string
        }
        Update: {
          cash_topup_amount?: number | null
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          offered_listing_id?: string | null
          proposer_id?: string
          status?: Database["public"]["Enums"]["swap_proposal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_proposals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "swap_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_proposals_offered_listing_id_fkey"
            columns: ["offered_listing_id"]
            isOneToOne: false
            referencedRelation: "swap_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      swap_reviews: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          rating: number
          review_text: string | null
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          proposal_id: string
          rating?: number
          review_text?: string | null
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          rating?: number
          review_text?: string | null
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_reviews_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "swap_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      swap_saved: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_saved_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "swap_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
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
      device_condition: "excellent" | "good" | "fair" | "poor"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      sell_request_status:
        | "pending"
        | "reviewing"
        | "quoted"
        | "accepted"
        | "rejected"
        | "completed"
      swap_condition: "new" | "like_new" | "good" | "fair"
      swap_listing_status: "active" | "swapped" | "archived" | "expired"
      swap_proposal_status:
        | "pending"
        | "accepted"
        | "declined"
        | "countered"
        | "completed"
        | "cancelled"
      swap_type: "swap_only" | "swap_and_cash" | "will_also_sell"
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
      device_condition: ["excellent", "good", "fair", "poor"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      sell_request_status: [
        "pending",
        "reviewing",
        "quoted",
        "accepted",
        "rejected",
        "completed",
      ],
      swap_condition: ["new", "like_new", "good", "fair"],
      swap_listing_status: ["active", "swapped", "archived", "expired"],
      swap_proposal_status: [
        "pending",
        "accepted",
        "declined",
        "countered",
        "completed",
        "cancelled",
      ],
      swap_type: ["swap_only", "swap_and_cash", "will_also_sell"],
    },
  },
} as const
