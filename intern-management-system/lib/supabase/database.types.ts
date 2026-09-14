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
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          email: string
          end_date: string | null
          full_name: string
          id: string
          internship_status: Database['public']['Enums']['internship_status']
          major: string | null
          mentor_id: string | null
          report_interval_days: number | null
          role: Database['public']['Enums']['user_role']
          start_date: string | null
          university: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          end_date?: string | null
          full_name: string
          id: string
          internship_status?: Database['public']['Enums']['internship_status']
          major?: string | null
          mentor_id?: string | null
          report_interval_days?: number | null
          role?: Database['public']['Enums']['user_role']
          start_date?: string | null
          university?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          end_date?: string | null
          full_name?: string
          id?: string
          internship_status?: Database['public']['Enums']['internship_status']
          major?: string | null
          mentor_id?: string | null
          report_interval_days?: number | null
          role?: Database['public']['Enums']['user_role']
          start_date?: string | null
          university?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_mentor_id_fkey'
            columns: ['mentor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          accepted_at: string | null
          assignee_id: string
          category: string | null
          completed_at: string | null
          completion_status: Database['public']['Enums']['task_completion_status'] | null
          created_at: string
          creator_id: string
          deadline: string | null
          description: string | null
          feedback: string | null
          id: string
          parent_task_id: string | null
          priority: Database['public']['Enums']['task_priority']
          status: Database['public']['Enums']['task_status']
          submitted_at: string | null
          submission_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assignee_id: string
          category?: string | null
          completed_at?: string | null
          completion_status?: Database['public']['Enums']['task_completion_status'] | null
          created_at?: string
          creator_id: string
          deadline?: string | null
          description?: string | null
          feedback?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: Database['public']['Enums']['task_priority']
          status?: Database['public']['Enums']['task_status']
          submitted_at?: string | null
          submission_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assignee_id?: string
          category?: string | null
          completed_at?: string | null
          completion_status?: Database['public']['Enums']['task_completion_status'] | null
          created_at?: string
          creator_id?: string
          deadline?: string | null
          description?: string | null
          feedback?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: Database['public']['Enums']['task_priority']
          status?: Database['public']['Enums']['task_status']
          submitted_at?: string | null
          submission_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_parent_task_id_fkey'
            columns: ['parent_task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      periodic_reports: {
        Row: {
          attachment_url: string | null
          content: string | null
          created_at: string
          due_date: string | null
          id: string
          intern_id: string
          mentor_feedback: string | null
          period_number: number | null
          status: string
          submitted_at: string | null
          task_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          intern_id: string
          mentor_feedback?: string | null
          period_number?: number | null
          status?: string
          submitted_at?: string | null
          task_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          intern_id?: string
          mentor_feedback?: string | null
          period_number?: number | null
          status?: string
          submitted_at?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'periodic_reports_intern_id_fkey'
            columns: ['intern_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'periodic_reports_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          id: string
          intern_id: string
          status: string
          total_hours: number | null
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          intern_id: string
          status?: string
          total_hours?: number | null
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          intern_id?: string
          status?: string
          total_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_intern_id_fkey'
            columns: ['intern_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          intern_id: string
          mentor_id: string
          reason: string
          reviewed_at: string | null
          start_date: string
          status: Database['public']['Enums']['request_status']
          type: Database['public']['Enums']['request_type']
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          intern_id: string
          mentor_id: string
          reason: string
          reviewed_at?: string | null
          start_date: string
          status?: Database['public']['Enums']['request_status']
          type: Database['public']['Enums']['request_type']
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          intern_id?: string
          mentor_id?: string
          reason?: string
          reviewed_at?: string | null
          start_date?: string
          status?: Database['public']['Enums']['request_status']
          type?: Database['public']['Enums']['request_type']
        }
        Relationships: [
          {
            foreignKeyName: 'leave_requests_intern_id_fkey'
            columns: ['intern_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_mentor_id_fkey'
            columns: ['mentor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      evaluations: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          intern_id: string
          mentor_id: string
          scores_json: Json
          type_period: Database['public']['Enums']['evaluation_period']
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          intern_id: string
          mentor_id: string
          scores_json?: Json
          type_period: Database['public']['Enums']['evaluation_period']
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          intern_id?: string
          mentor_id?: string
          scores_json?: Json
          type_period?: Database['public']['Enums']['evaluation_period']
        }
        Relationships: [
          {
            foreignKeyName: 'evaluations_intern_id_fkey'
            columns: ['intern_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'evaluations_mentor_id_fkey'
            columns: ['mentor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      final_evaluations: {
        Row: {
          created_at: string
          general_feedback: string | null
          grade: string | null
          id: string
          intern_id: string
          mentor_id: string
          overall_score: number | null
          recommendation: Database['public']['Enums']['final_recommendation']
          skill_score: number | null
          work_attitude_score: number | null
        }
        Insert: {
          created_at?: string
          general_feedback?: string | null
          grade?: string | null
          id?: string
          intern_id: string
          mentor_id: string
          overall_score?: number | null
          recommendation: Database['public']['Enums']['final_recommendation']
          skill_score?: number | null
          work_attitude_score?: number | null
        }
        Update: {
          created_at?: string
          general_feedback?: string | null
          grade?: string | null
          id?: string
          intern_id?: string
          mentor_id?: string
          overall_score?: number | null
          recommendation?: Database['public']['Enums']['final_recommendation']
          skill_score?: number | null
          work_attitude_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'final_evaluations_intern_id_fkey'
            columns: ['intern_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'final_evaluations_mentor_id_fkey'
            columns: ['mentor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database['public']['Enums']['user_role']
      }
      ensure_periodic_reports: {
        Args: {
          p_intern_id: string
        }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_mentor_of: {
        Args: { target_intern_id: string }
        Returns: boolean
      }
    }
    Enums: {
      evaluation_period: 'midterm' | 'final'
      final_recommendation: 'pass' | 'fail' | 'offer_job'
      internship_status: 'active' | 'completed_internship'
      request_status: 'pending' | 'approved' | 'rejected'
      request_type: 'leave' | 'wfh'
      task_completion_status: 'on_time' | 'late'
      task_priority: 'low' | 'medium' | 'high'
      task_status: 'pending_acceptance' | 'in_progress' | 'under_review' | 'completed' | 'rejected'
      user_role: 'admin' | 'mentor' | 'intern'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never