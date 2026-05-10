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
      health_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string | null
          created_at: string
          doctor: string | null
          duration: string | null
          end_time: string | null
          id: string
          notes: string | null
          purpose: string | null
          room: string | null
          service: string | null
          staff_id: string | null
          start_time: string | null
          status: string
          student_email: string | null
          student_id: string
          student_phone: string | null
          symptoms: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time?: string | null
          created_at?: string
          doctor?: string | null
          duration?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          room?: string | null
          service?: string | null
          staff_id?: string | null
          start_time?: string | null
          status?: string
          student_email?: string | null
          student_id: string
          student_phone?: string | null
          symptoms?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string | null
          created_at?: string
          doctor?: string | null
          duration?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          room?: string | null
          service?: string | null
          staff_id?: string | null
          start_time?: string | null
          status?: string
          student_email?: string | null
          student_id?: string
          student_phone?: string | null
          symptoms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "health_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      health_queue_tickets: {
        Row: {
          appointment_id: string
          checked_in_at: string | null
          created_at: string | null
          estimated_wait_minutes: number | null
          expires_at: string
          id: string
          queue_position: number
          status: string
          ticket_code: string
          updated_at: string | null
        }
        Insert: {
          appointment_id: string
          checked_in_at?: string | null
          created_at?: string | null
          estimated_wait_minutes?: number | null
          expires_at: string
          id?: string
          queue_position: number
          status?: string
          ticket_code: string
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string
          checked_in_at?: string | null
          created_at?: string | null
          estimated_wait_minutes?: number | null
          expires_at?: string
          id?: string
          queue_position?: number
          status?: string
          ticket_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_queue_tickets_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "health_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      health_staff: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          photo_url: string | null
          price_label: string | null
          rating: number | null
          role: string
          specialty_label: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          photo_url?: string | null
          price_label?: string | null
          rating?: number | null
          role: string
          specialty_label: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          photo_url?: string | null
          price_label?: string | null
          rating?: number | null
          role?: string
          specialty_label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      health_staff_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          staff_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          staff_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          staff_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "health_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      health_vital_signs: {
        Row: {
          appointment_id: string
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string | null
          heart_rate: number | null
          height: number | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          recorded_at: string | null
          recorded_by: string
          temperature: number | null
          ticket_id: string
          weight: number | null
        }
        Insert: {
          appointment_id: string
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          recorded_at?: string | null
          recorded_by: string
          temperature?: number | null
          ticket_id: string
          weight?: number | null
        }
        Update: {
          appointment_id?: string
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          recorded_at?: string | null
          recorded_by?: string
          temperature?: number | null
          ticket_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_vital_signs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "health_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_vital_signs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "health_queue_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          program: string
          student_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string
          id: string
          last_name?: string
          program?: string
          student_id?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          program?: string
          student_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_old_tickets: { Args: never; Returns: number }
      generate_ticket_code: { Args: never; Returns: string }
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