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
      goal_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          goal_id: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          goal_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          goal_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_comments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean
          is_completed: boolean
          name: string
          owner_id: string
          target_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          is_completed?: boolean
          name: string
          owner_id: string
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          is_completed?: boolean
          name?: string
          owner_id?: string
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_lists_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "team_members"
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
      task_collaborators: {
        Row: {
          created_at: string
          id: string
          role_description: string | null
          task_id: string
          team_member_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_description?: string | null
          task_id: string
          team_member_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_description?: string | null
          task_id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_collaborators_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_collaborators_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      task_reminders: {
        Row: {
          created_at: string
          id: string
          is_sent: boolean
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_sent?: boolean
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_sent?: boolean
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          completion_criteria: string | null
          created_at: string
          default_priority: string
          depends_on_order: number | null
          description: string | null
          goal_template_id: string
          id: string
          is_required: boolean
          order_index: number
          title: string
        }
        Insert: {
          completion_criteria?: string | null
          created_at?: string
          default_priority?: string
          depends_on_order?: number | null
          description?: string | null
          goal_template_id: string
          id?: string
          is_required?: boolean
          order_index?: number
          title: string
        }
        Update: {
          completion_criteria?: string | null
          created_at?: string
          default_priority?: string
          depends_on_order?: number | null
          description?: string | null
          goal_template_id?: string
          id?: string
          is_required?: boolean
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_goal_template_id_fkey"
            columns: ["goal_template_id"]
            isOneToOne: false
            referencedRelation: "goal_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completion_criteria: string | null
          created_at: string
          created_by: string
          depends_on: string | null
          description: string | null
          due_date: string | null
          goal_id: string
          id: string
          is_required: boolean
          notes: string | null
          order_index: number
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completion_criteria?: string | null
          created_at?: string
          created_by: string
          depends_on?: string | null
          description?: string | null
          due_date?: string | null
          goal_id: string
          id?: string
          is_required?: boolean
          notes?: string | null
          order_index?: number
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completion_criteria?: string | null
          created_at?: string
          created_by?: string
          depends_on?: string | null
          description?: string | null
          due_date?: string | null
          goal_id?: string
          id?: string
          is_required?: boolean
          notes?: string | null
          order_index?: number
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_depends_on_fkey"
            columns: ["depends_on"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_list_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          team_member_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          team_member_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_permissions_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          id: string
          invite_token: string | null
          is_active: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invite_token?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invite_token?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
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
      weekly_report_activities: {
        Row: {
          action_taken: string
          created_at: string
          id: string
          outcome_insight: string
          report_id: string
          status: string
        }
        Insert: {
          action_taken: string
          created_at?: string
          id?: string
          outcome_insight: string
          report_id: string
          status: string
        }
        Update: {
          action_taken?: string
          created_at?: string
          id?: string
          outcome_insight?: string
          report_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_report_activities_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_report_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          operator_email: string
          operator_name: string
          sent_at: string
          status: string
          token: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          operator_email: string
          operator_name: string
          sent_at?: string
          status?: string
          token: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          operator_email?: string
          operator_name?: string
          sent_at?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          active_users: string | null
          ai_tools_details: Json | null
          approach_viability: string
          assigned_businesses: string[]
          biggest_blocker: string
          capital_needed_ghs: number | null
          capital_use: string | null
          challenges_risks: string
          costs_ghs: number | null
          created_at: string
          decisions_owned_escalated: string
          delayed_decisions: string | null
          id: string
          key_decisions: string
          key_insight: string
          leadership_role: string
          leads_partnerships: string | null
          next_week_priorities: string
          no_action_reason: string | null
          operator_email: string
          operator_name: string
          personal_execution: string
          problem_change_details: string | null
          problem_changed: boolean
          problem_definition: string
          qualitative_traction: string | null
          revenue_ghs: number | null
          session_id: string
          solution_description: string
          strategy_change_details: string | null
          strategy_changed: boolean
          support_needed: string
          talent_capability_gaps: string
          trade_offs_evaluated: string
          unconstrained_decision: string
          updated_at: string
          used_ai_tools: boolean
          week_ending: string
        }
        Insert: {
          active_users?: string | null
          ai_tools_details?: Json | null
          approach_viability: string
          assigned_businesses?: string[]
          biggest_blocker: string
          capital_needed_ghs?: number | null
          capital_use?: string | null
          challenges_risks: string
          costs_ghs?: number | null
          created_at?: string
          decisions_owned_escalated: string
          delayed_decisions?: string | null
          id?: string
          key_decisions: string
          key_insight: string
          leadership_role: string
          leads_partnerships?: string | null
          next_week_priorities: string
          no_action_reason?: string | null
          operator_email: string
          operator_name: string
          personal_execution: string
          problem_change_details?: string | null
          problem_changed?: boolean
          problem_definition: string
          qualitative_traction?: string | null
          revenue_ghs?: number | null
          session_id: string
          solution_description: string
          strategy_change_details?: string | null
          strategy_changed?: boolean
          support_needed: string
          talent_capability_gaps: string
          trade_offs_evaluated: string
          unconstrained_decision: string
          updated_at?: string
          used_ai_tools?: boolean
          week_ending: string
        }
        Update: {
          active_users?: string | null
          ai_tools_details?: Json | null
          approach_viability?: string
          assigned_businesses?: string[]
          biggest_blocker?: string
          capital_needed_ghs?: number | null
          capital_use?: string | null
          challenges_risks?: string
          costs_ghs?: number | null
          created_at?: string
          decisions_owned_escalated?: string
          delayed_decisions?: string | null
          id?: string
          key_decisions?: string
          key_insight?: string
          leadership_role?: string
          leads_partnerships?: string | null
          next_week_priorities?: string
          no_action_reason?: string | null
          operator_email?: string
          operator_name?: string
          personal_execution?: string
          problem_change_details?: string | null
          problem_changed?: boolean
          problem_definition?: string
          qualitative_traction?: string | null
          revenue_ghs?: number | null
          session_id?: string
          solution_description?: string
          strategy_change_details?: string | null
          strategy_changed?: boolean
          support_needed?: string
          talent_capability_gaps?: string
          trade_offs_evaluated?: string
          unconstrained_decision?: string
          updated_at?: string
          used_ai_tools?: boolean
          week_ending?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "weekly_report_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_goal_progress: { Args: { goal_uuid: string }; Returns: number }
      get_current_team_member_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_team_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      is_task_collaborator: {
        Args: { _task_id: string; _user_id: string }
        Returns: boolean
      }
      is_task_member: {
        Args: { _task_id: string; _user_id: string }
        Returns: boolean
      }
      team_member_has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "team_member"
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
      app_role: ["admin", "user", "team_member"],
    },
  },
} as const
