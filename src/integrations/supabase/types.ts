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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      ea_commands: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          payload: Json
          result: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["ea_command_status"]
          type: Database["public"]["Enums"]["ea_command_type"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          payload?: Json
          result?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["ea_command_status"]
          type: Database["public"]["Enums"]["ea_command_type"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          payload?: Json
          result?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["ea_command_status"]
          type?: Database["public"]["Enums"]["ea_command_type"]
          user_id?: string
        }
        Relationships: []
      }
      ea_connections: {
        Row: {
          account_currency: string | null
          api_token_hash: string
          balance: number | null
          broker: string | null
          created_at: string
          equity: number | null
          free_margin: number | null
          id: string
          last_heartbeat: string | null
          margin: number | null
          mt5_login: string | null
          mt5_server: string | null
          open_positions: Json
          pnl: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_currency?: string | null
          api_token_hash: string
          balance?: number | null
          broker?: string | null
          created_at?: string
          equity?: number | null
          free_margin?: number | null
          id?: string
          last_heartbeat?: string | null
          margin?: number | null
          mt5_login?: string | null
          mt5_server?: string | null
          open_positions?: Json
          pnl?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_currency?: string | null
          api_token_hash?: string
          balance?: number | null
          broker?: string | null
          created_at?: string
          equity?: number | null
          free_margin?: number | null
          id?: string
          last_heartbeat?: string | null
          margin?: number | null
          mt5_login?: string | null
          mt5_server?: string | null
          open_positions?: Json
          pnl?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ea_trades: {
        Row: {
          close_price: number | null
          closed_at: string | null
          created_at: string
          direction: string
          id: string
          lots: number | null
          open_price: number | null
          opened_at: string | null
          pair: string
          pnl: number | null
          status: string
          stop_loss: number | null
          take_profit: number | null
          ticket: string | null
          user_id: string
        }
        Insert: {
          close_price?: number | null
          closed_at?: string | null
          created_at?: string
          direction: string
          id?: string
          lots?: number | null
          open_price?: number | null
          opened_at?: string | null
          pair: string
          pnl?: number | null
          status?: string
          stop_loss?: number | null
          take_profit?: number | null
          ticket?: string | null
          user_id: string
        }
        Update: {
          close_price?: number | null
          closed_at?: string | null
          created_at?: string
          direction?: string
          id?: string
          lots?: number | null
          open_price?: number | null
          opened_at?: string | null
          pair?: string
          pnl?: number | null
          status?: string
          stop_loss?: number | null
          take_profit?: number | null
          ticket?: string | null
          user_id?: string
        }
        Relationships: []
      }
      economic_calendar_cache: {
        Row: {
          events: Json
          fetched_at: string
          id: string
        }
        Insert: {
          events?: Json
          fetched_at?: string
          id?: string
        }
        Update: {
          events?: Json
          fetched_at?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          broadcast: boolean
          created_at: string
          id: string
          is_read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          broadcast?: boolean
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          broadcast?: boolean
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          created_at: string
          email: string
          id: string
          mt5_broker: string | null
          mt5_login: string | null
          mt5_server: string | null
          name: string
          phone: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          status: Database["public"]["Enums"]["approval_status"]
          surname: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          email: string
          id: string
          mt5_broker?: string | null
          mt5_login?: string | null
          mt5_server?: string | null
          name?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: Database["public"]["Enums"]["approval_status"]
          surname?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          email?: string
          id?: string
          mt5_broker?: string | null
          mt5_login?: string | null
          mt5_server?: string | null
          name?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: Database["public"]["Enums"]["approval_status"]
          surname?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          closed_at: string | null
          created_at: string
          current_price: number | null
          direction: Database["public"]["Enums"]["signal_direction"]
          entry: number
          id: string
          pair: string
          reasoning: string | null
          status: Database["public"]["Enums"]["signal_status"]
          stop_loss: number
          take_profit: number
          tp_progress: number | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          current_price?: number | null
          direction: Database["public"]["Enums"]["signal_direction"]
          entry: number
          id?: string
          pair: string
          reasoning?: string | null
          status?: Database["public"]["Enums"]["signal_status"]
          stop_loss: number
          take_profit: number
          tp_progress?: number | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          current_price?: number | null
          direction?: Database["public"]["Enums"]["signal_direction"]
          entry?: number
          id?: string
          pair?: string
          reasoning?: string | null
          status?: Database["public"]["Enums"]["signal_status"]
          stop_loss?: number
          take_profit?: number
          tp_progress?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          plan: Database["public"]["Enums"]["plan_tier"]
          price_zar: number
          user_id: string
          yoco_charge_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan: Database["public"]["Enums"]["plan_tier"]
          price_zar: number
          user_id: string
          yoco_charge_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan?: Database["public"]["Enums"]["plan_tier"]
          price_zar?: number
          user_id?: string
          yoco_charge_id?: string | null
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
      rotate_ea_api_token: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
      approval_status: "pending" | "approved" | "blocked"
      ea_command_status: "pending" | "sent" | "done" | "failed"
      ea_command_type:
        | "start"
        | "stop"
        | "open_trade"
        | "close_trade"
        | "close_all"
      payment_status: "pending" | "paid" | "failed"
      plan_tier: "none" | "lite" | "pro" | "premium"
      signal_direction: "BUY" | "SELL"
      signal_status: "active" | "tp_hit" | "sl_hit" | "cancelled"
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
      approval_status: ["pending", "approved", "blocked"],
      ea_command_status: ["pending", "sent", "done", "failed"],
      ea_command_type: [
        "start",
        "stop",
        "open_trade",
        "close_trade",
        "close_all",
      ],
      payment_status: ["pending", "paid", "failed"],
      plan_tier: ["none", "lite", "pro", "premium"],
      signal_direction: ["BUY", "SELL"],
      signal_status: ["active", "tp_hit", "sl_hit", "cancelled"],
    },
  },
} as const
