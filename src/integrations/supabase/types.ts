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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      company_settings: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          logo_path: string | null
          org_id: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_path?: string | null
          org_id?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_path?: string | null
          org_id?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      email_attachments: {
        Row: {
          file_name: string | null
          id: string
          message_id: string | null
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          file_name?: string | null
          id?: string
          message_id?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          file_name?: string | null
          id?: string
          message_id?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          from_email: string | null
          id: string
          org_id: string
          owner_id: string
          raw_provider_id: string | null
          received_at: string | null
          subject: string | null
        }
        Insert: {
          from_email?: string | null
          id?: string
          org_id?: string
          owner_id: string
          raw_provider_id?: string | null
          received_at?: string | null
          subject?: string | null
        }
        Update: {
          from_email?: string | null
          id?: string
          org_id?: string
          owner_id?: string
          raw_provider_id?: string | null
          received_at?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          bcc_enabled: boolean | null
          created_at: string | null
          inbound_alias: string
          inbound_token: string
          org_id: string
          owner_id: string
        }
        Insert: {
          bcc_enabled?: boolean | null
          created_at?: string | null
          inbound_alias: string
          inbound_token: string
          org_id?: string
          owner_id: string
        }
        Update: {
          bcc_enabled?: boolean | null
          created_at?: string | null
          inbound_alias?: string
          inbound_token?: string
          org_id?: string
          owner_id?: string
        }
        Relationships: []
      }
      excel_pricing_config: {
        Row: {
          created_at: string
          file_name: string
          height_cell: string
          id: string
          length_cell: string
          org_id: string
          owner_id: string
          price_cell: string
          selected_sheet: string
          storage_path: string
          updated_at: string
          weight_cell: string
          width_cell: string
          workbook_hash: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          height_cell: string
          id?: string
          length_cell: string
          org_id?: string
          owner_id: string
          price_cell: string
          selected_sheet: string
          storage_path: string
          updated_at?: string
          weight_cell: string
          width_cell: string
          workbook_hash?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          height_cell?: string
          id?: string
          length_cell?: string
          org_id?: string
          owner_id?: string
          price_cell?: string
          selected_sheet?: string
          storage_path?: string
          updated_at?: string
          weight_cell?: string
          width_cell?: string
          workbook_hash?: string | null
        }
        Relationships: []
      }
      inbound_messages: {
        Row: {
          attachments: Json | null
          detected_company: string | null
          from_email: string | null
          from_name: string | null
          html_body: string | null
          id: string
          offer_id: string | null
          org_id: string
          received_at: string
          status: string
          subject: string | null
          text_body: string | null
          thread_id: string | null
        }
        Insert: {
          attachments?: Json | null
          detected_company?: string | null
          from_email?: string | null
          from_name?: string | null
          html_body?: string | null
          id?: string
          offer_id?: string | null
          org_id: string
          received_at?: string
          status?: string
          subject?: string | null
          text_body?: string | null
          thread_id?: string | null
        }
        Update: {
          attachments?: Json | null
          detected_company?: string | null
          from_email?: string | null
          from_name?: string | null
          html_body?: string | null
          id?: string
          offer_id?: string | null
          org_id?: string
          received_at?: string
          status?: string
          subject?: string | null
          text_body?: string | null
          thread_id?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string
          original_attachment_id: string
          quote_id: string
          size_bytes: number
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type: string
          original_attachment_id: string
          quote_id: string
          size_bytes: number
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string
          original_attachment_id?: string
          quote_id?: string
          size_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_attachments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          attachment_id: string | null
          behandeling: string | null
          breedte: number | null
          created_at: string
          description: string
          drawing_number: string | null
          file_name: string | null
          gewicht_kg: number | null
          hoogte: number | null
          id: string
          lengte: number | null
          original_attachment_id: string | null
          price: number | null
          quote_id: string
        }
        Insert: {
          attachment_id?: string | null
          behandeling?: string | null
          breedte?: number | null
          created_at?: string
          description: string
          drawing_number?: string | null
          file_name?: string | null
          gewicht_kg?: number | null
          hoogte?: number | null
          id?: string
          lengte?: number | null
          original_attachment_id?: string | null
          price?: number | null
          quote_id: string
        }
        Update: {
          attachment_id?: string | null
          behandeling?: string | null
          breedte?: number | null
          created_at?: string
          description?: string
          drawing_number?: string | null
          file_name?: string | null
          gewicht_kg?: number | null
          hoogte?: number | null
          id?: string
          lengte?: number | null
          original_attachment_id?: string | null
          price?: number | null
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_address: string | null
          client_city: string | null
          client_email: string | null
          client_name: string
          client_postal_code: string | null
          client_reference: string | null
          created_at: string
          id: string
          org_id: string
          owner_id: string
          pdf_file_path: string | null
          quote_number: string
          status: string | null
          terms: string | null
          total_price: number | null
          updated_at: string
          validity_days: number
        }
        Insert: {
          client_address?: string | null
          client_city?: string | null
          client_email?: string | null
          client_name: string
          client_postal_code?: string | null
          client_reference?: string | null
          created_at?: string
          id?: string
          org_id?: string
          owner_id: string
          pdf_file_path?: string | null
          quote_number: string
          status?: string | null
          terms?: string | null
          total_price?: number | null
          updated_at?: string
          validity_days?: number
        }
        Update: {
          client_address?: string | null
          client_city?: string | null
          client_email?: string | null
          client_name?: string
          client_postal_code?: string | null
          client_reference?: string | null
          created_at?: string
          id?: string
          org_id?: string
          owner_id?: string
          pdf_file_path?: string | null
          quote_number?: string
          status?: string | null
          terms?: string | null
          total_price?: number | null
          updated_at?: string
          validity_days?: number
        }
        Relationships: []
      }
      work_instruction_steps: {
        Row: {
          created_at: string
          description: string
          id: string
          image_path: string | null
          instruction_id: string
          step_number: number
          title: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_path?: string | null
          instruction_id: string
          step_number: number
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          instruction_id?: string
          step_number?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_instruction_steps_instruction_id_fkey"
            columns: ["instruction_id"]
            isOneToOne: false
            referencedRelation: "work_instructions"
            referencedColumns: ["id"]
          },
        ]
      }
      work_instructions: {
        Row: {
          created_at: string
          department: string
          description: string | null
          id: string
          instruction_number: string
          org_id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          description?: string | null
          id?: string
          instruction_number: string
          org_id?: string
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          description?: string | null
          id?: string
          instruction_number?: string
          org_id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_instruction_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
