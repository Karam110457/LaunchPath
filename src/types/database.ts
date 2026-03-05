export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          location_city: string | null
          location_country: string | null
          time_availability: string | null
          outreach_comfort: string | null
          technical_comfort: string | null
          revenue_goal: string | null
          current_situation: string | null
          blockers: string[]
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          location_city?: string | null
          location_country?: string | null
          time_availability?: string | null
          outreach_comfort?: string | null
          technical_comfort?: string | null
          revenue_goal?: string | null
          current_situation?: string | null
          blockers?: string[]
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_city?: string | null
          location_country?: string | null
          time_availability?: string | null
          outreach_comfort?: string | null
          technical_comfort?: string | null
          revenue_goal?: string | null
          current_situation?: string | null
          blockers?: string[]
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_knowledge_documents: {
        Row: {
          id: string
          agent_id: string
          user_id: string
          source_type: string
          source_name: string
          file_path: string | null
          content: string
          chunk_count: number
          status: string
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          user_id: string
          source_type: string
          source_name: string
          file_path?: string | null
          content?: string
          chunk_count?: number
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          user_id?: string
          source_type?: string
          source_name?: string
          file_path?: string | null
          content?: string
          chunk_count?: number
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_knowledge_chunks: {
        Row: {
          id: string
          document_id: string
          agent_id: string
          chunk_index: number
          content: string
          embedding: string | null
          token_count: number
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          agent_id: string
          chunk_index: number
          content: string
          embedding?: string | null
          token_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          agent_id?: string
          chunk_index?: number
          content?: string
          embedding?: string | null
          token_count?: number
          created_at?: string
        }
        Relationships: []
      }
      agent_conversations: {
        Row: {
          id: string
          agent_id: string
          user_id: string
          messages: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          user_id: string
          messages?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          user_id?: string
          messages?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          id: string
          user_id: string
          system_id: string | null
          name: string
          description: string | null
          system_prompt: string
          personality: Json
          enabled_tools: Json
          knowledge_base: Json
          model: string
          template_id: string | null
          status: string
          tool_guidelines: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          system_id?: string | null
          name?: string
          description?: string | null
          system_prompt?: string
          personality?: Json
          enabled_tools?: Json
          knowledge_base?: Json
          model?: string
          template_id?: string | null
          status?: string
          tool_guidelines?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          system_id?: string | null
          name?: string
          description?: string | null
          system_prompt?: string
          personality?: Json
          enabled_tools?: Json
          knowledge_base?: Json
          model?: string
          template_id?: string | null
          status?: string
          tool_guidelines?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_channels: {
        Row: {
          id: string
          agent_id: string
          user_id: string
          channel_type: string
          name: string
          token: string
          allowed_origins: string[]
          rate_limit_rpm: number | null
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          user_id: string
          channel_type: string
          name: string
          token: string
          allowed_origins?: string[]
          rate_limit_rpm?: number | null
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          user_id?: string
          channel_type?: string
          name?: string
          token?: string
          allowed_origins?: string[]
          rate_limit_rpm?: number | null
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      channel_conversations: {
        Row: {
          id: string
          channel_id: string
          agent_id: string
          session_id: string
          messages: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          agent_id: string
          session_id: string
          messages?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          agent_id?: string
          session_id?: string
          messages?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_systems: {
        Row: {
          id: string
          user_id: string
          status: string
          current_step: number
          intent: string | null
          direction_path: string | null
          client_preferences: string[] | null
          own_idea: string | null
          tried_niche: string | null
          what_went_wrong: string | null
          current_niche: string | null
          current_clients: number | null
          current_pricing: string | null
          growth_direction: string | null
          delivery_model: string | null
          pricing_direction: string | null
          location_city: string | null
          location_target: string | null
          ai_recommendations: Json | null
          chosen_recommendation: Json | null
          offer: Json | null
          demo_url: string | null
          prospects: Json | null
          messages: Json | null
          conversation_history: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          current_step?: number
          intent?: string | null
          direction_path?: string | null
          client_preferences?: string[] | null
          own_idea?: string | null
          tried_niche?: string | null
          what_went_wrong?: string | null
          current_niche?: string | null
          current_clients?: number | null
          current_pricing?: string | null
          growth_direction?: string | null
          delivery_model?: string | null
          pricing_direction?: string | null
          location_city?: string | null
          location_target?: string | null
          ai_recommendations?: Json | null
          chosen_recommendation?: Json | null
          offer?: Json | null
          demo_url?: string | null
          prospects?: Json | null
          messages?: Json | null
          conversation_history?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          current_step?: number
          intent?: string | null
          direction_path?: string | null
          client_preferences?: string[] | null
          own_idea?: string | null
          tried_niche?: string | null
          what_went_wrong?: string | null
          current_niche?: string | null
          current_clients?: number | null
          current_pricing?: string | null
          growth_direction?: string | null
          delivery_model?: string | null
          pricing_direction?: string | null
          location_city?: string | null
          location_target?: string | null
          ai_recommendations?: Json | null
          chosen_recommendation?: Json | null
          offer?: Json | null
          demo_url?: string | null
          prospects?: Json | null
          messages?: Json | null
          conversation_history?: Json | null
          created_at?: string
          updated_at?: string
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
