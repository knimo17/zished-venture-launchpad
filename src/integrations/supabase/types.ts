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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_evaluation: {
        Row: {
          assessment_result_id: string
          created_at: string
          honesty_assessment: Json | null
          id: string
          overall_recommendation: string
          personalized_growth_areas: Json
          personalized_strengths: Json
          personalized_summary: string
          recommendation_reasoning: string
          red_flags: string[]
          response_patterns: Json
          style_profile: Json | null
        }
        Insert: {
          assessment_result_id: string
          created_at?: string
          honesty_assessment?: Json | null
          id?: string
          overall_recommendation: string
          personalized_growth_areas?: Json
          personalized_strengths?: Json
          personalized_summary: string
          recommendation_reasoning: string
          red_flags?: string[]
          response_patterns?: Json
          style_profile?: Json | null
        }
        Update: {
          assessment_result_id?: string
          created_at?: string
          honesty_assessment?: Json | null
          id?: string
          overall_recommendation?: string
          personalized_growth_areas?: Json
          personalized_strengths?: Json
          personalized_summary?: string
          recommendation_reasoning?: string
          red_flags?: string[]
          response_patterns?: Json
          style_profile?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_evaluation_assessment_result_id_fkey"
            columns: ["assessment_result_id"]
            isOneToOne: false
            referencedRelation: "assessment_results"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interview_questions: {
        Row: {
          assessment_result_id: string
          created_at: string
          id: string
          probing_area: string
          question_context: string
          question_order: number
          question_text: string
          related_venture_id: string | null
        }
        Insert: {
          assessment_result_id: string
          created_at?: string
          id?: string
          probing_area: string
          question_context: string
          question_order: number
          question_text: string
          related_venture_id?: string | null
        }
        Update: {
          assessment_result_id?: string
          created_at?: string
          id?: string
          probing_area?: string
          question_context?: string
          question_order?: number
          question_text?: string
          related_venture_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_questions_assessment_result_id_fkey"
            columns: ["assessment_result_id"]
            isOneToOne: false
            referencedRelation: "assessment_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_questions_related_venture_id_fkey"
            columns: ["related_venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interview_responses: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response_text: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response_text: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response_text?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_venture_analysis: {
        Row: {
          assessment_result_id: string
          created_at: string
          fit_narrative: string
          id: string
          onboarding_suggestions: string[]
          role_recommendation: string
          venture_id: string
        }
        Insert: {
          assessment_result_id: string
          created_at?: string
          fit_narrative: string
          id?: string
          onboarding_suggestions?: string[]
          role_recommendation: string
          venture_id: string
        }
        Update: {
          assessment_result_id?: string
          created_at?: string
          fit_narrative?: string
          id?: string
          onboarding_suggestions?: string[]
          role_recommendation?: string
          venture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_venture_analysis_assessment_result_id_fkey"
            columns: ["assessment_result_id"]
            isOneToOne: false
            referencedRelation: "assessment_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_venture_analysis_venture_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          expected_salary: string
          id: string
          internship_id: string | null
          linkedin_url: string | null
          name: string
          phone: string
          question1: string
          question2: string
          question3: string
          question4: string
          question5: string
          question6: string
          resume_file_name: string | null
          resume_file_path: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          expected_salary: string
          id?: string
          internship_id?: string | null
          linkedin_url?: string | null
          name: string
          phone: string
          question1: string
          question2: string
          question3: string
          question4: string
          question5: string
          question6: string
          resume_file_name?: string | null
          resume_file_path?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          expected_salary?: string
          id?: string
          internship_id?: string | null
          linkedin_url?: string | null
          name?: string
          phone?: string
          question1?: string
          question2?: string
          question3?: string
          question4?: string
          question5?: string
          question6?: string
          resume_file_name?: string | null
          resume_file_path?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          created_at: string
          dimension: string
          id: string
          is_reverse: boolean
          is_trap: boolean
          option_mappings: Json | null
          options: Json | null
          question_number: number
          question_text: string
          question_type: string
          sub_dimension: string | null
        }
        Insert: {
          created_at?: string
          dimension: string
          id?: string
          is_reverse?: boolean
          is_trap?: boolean
          option_mappings?: Json | null
          options?: Json | null
          question_number: number
          question_text: string
          question_type?: string
          sub_dimension?: string | null
        }
        Update: {
          created_at?: string
          dimension?: string
          id?: string
          is_reverse?: boolean
          is_trap?: boolean
          option_mappings?: Json | null
          options?: Json | null
          question_number?: number
          question_text?: string
          question_type?: string
          sub_dimension?: string | null
        }
        Relationships: []
      }
      assessment_responses: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response: number
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response: number
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response?: number
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_results: {
        Row: {
          calculated_at: string
          confidence_level: string
          dimension_scores: Json
          id: string
          primary_operator_type: string
          secondary_operator_type: string | null
          session_id: string
          strengths: string[]
          summary: string
          team_compatibility_scores: Json
          venture_fit_scores: Json
          weakness_summary: string
          weaknesses: string[]
        }
        Insert: {
          calculated_at?: string
          confidence_level: string
          dimension_scores: Json
          id?: string
          primary_operator_type: string
          secondary_operator_type?: string | null
          session_id: string
          strengths: string[]
          summary: string
          team_compatibility_scores: Json
          venture_fit_scores: Json
          weakness_summary: string
          weaknesses: string[]
        }
        Update: {
          calculated_at?: string
          confidence_level?: string
          dimension_scores?: Json
          id?: string
          primary_operator_type?: string
          secondary_operator_type?: string | null
          session_id?: string
          strengths?: string[]
          summary?: string
          team_compatibility_scores?: Json
          venture_fit_scores?: Json
          weakness_summary?: string
          weaknesses?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          application_id: string
          completed_at: string | null
          created_at: string
          current_question: number
          id: string
          interview_status: string
          sent_at: string
          started_at: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          created_at?: string
          current_question?: number
          id?: string
          interview_status?: string
          sent_at?: string
          started_at?: string | null
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          created_at?: string
          current_question?: number
          id?: string
          interview_status?: string
          sent_at?: string
          started_at?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          portfolio_company: string
          responsibilities: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          portfolio_company: string
          responsibilities: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          portfolio_company?: string
          responsibilities?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          created_at: string
          id: string
          key: string
          section: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          section: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          section?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venture_matches: {
        Row: {
          assessment_result_id: string
          compatibility_score: number
          concerns: string[]
          created_at: string
          dimension_score: number
          id: string
          match_reasons: string[]
          operator_type_score: number
          overall_score: number
          suggested_role: string | null
          venture_id: string
        }
        Insert: {
          assessment_result_id: string
          compatibility_score: number
          concerns?: string[]
          created_at?: string
          dimension_score: number
          id?: string
          match_reasons?: string[]
          operator_type_score: number
          overall_score: number
          suggested_role?: string | null
          venture_id: string
        }
        Update: {
          assessment_result_id?: string
          compatibility_score?: number
          concerns?: string[]
          created_at?: string
          dimension_score?: number
          id?: string
          match_reasons?: string[]
          operator_type_score?: number
          overall_score?: number
          suggested_role?: string | null
          venture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_matches_assessment_result_id_fkey"
            columns: ["assessment_result_id"]
            isOneToOne: false
            referencedRelation: "assessment_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venture_matches_venture_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      ventures: {
        Row: {
          created_at: string
          description: string
          dimension_weights: Json
          id: string
          ideal_operator_type: string
          industry: string
          is_active: boolean
          name: string
          secondary_operator_type: string | null
          suggested_roles: string[]
          team_profile: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          dimension_weights?: Json
          id?: string
          ideal_operator_type: string
          industry: string
          is_active?: boolean
          name: string
          secondary_operator_type?: string | null
          suggested_roles?: string[]
          team_profile?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          dimension_weights?: Json
          id?: string
          ideal_operator_type?: string
          industry?: string
          is_active?: boolean
          name?: string
          secondary_operator_type?: string | null
          suggested_roles?: string[]
          team_profile?: Json
          updated_at?: string
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
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
