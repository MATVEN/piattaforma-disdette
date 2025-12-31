export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TipoIntestatario = 'privato' | 'azienda'
export type RichiedenteRuolo = 'legale_rappresentante' | 'delegato'

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      extracted_data: {
        Row: {
          // Existing fields
          created_at: string
          error_message: string | null
          file_path: string
          id: number
          pdf_path: string | null
          raw_json_response: Json | null
          receiver_tax_id: string | null
          status: string
          supplier_contract_number: string | null
          supplier_iban: string | null
          supplier_name: string | null
          supplier_tax_id: string | null
          updated_at: string | null
          user_id: string

          // C23: New B2B fields
          tipo_intestatario: TipoIntestatario
          partita_iva: string | null
          ragione_sociale: string | null
          sede_legale: string | null
          lr_nome: string | null
          lr_cognome: string | null
          lr_codice_fiscale: string | null
          visura_camerale_path: string | null
          delega_firma_path: string | null
          indirizzo_fornitura: string | null
          indirizzo_fatturazione: string | null
          richiedente_ruolo: RichiedenteRuolo | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_path: string
          id?: number
          pdf_path?: string | null
          raw_json_response?: Json | null
          receiver_tax_id?: string | null
          status?: string
          supplier_contract_number?: string | null
          supplier_iban?: string | null
          supplier_name?: string | null
          supplier_tax_id?: string | null
          updated_at?: string | null
          user_id: string

          // C23: New B2B fields
          tipo_intestatario?: TipoIntestatario
          partita_iva?: string | null
          ragione_sociale?: string | null
          sede_legale?: string | null
          lr_nome?: string | null
          lr_cognome?: string | null
          lr_codice_fiscale?: string | null
          visura_camerale_path?: string | null
          delega_firma_path?: string | null
          indirizzo_fornitura?: string | null
          indirizzo_fatturazione?: string | null
          richiedente_ruolo?: RichiedenteRuolo | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_path?: string
          id?: number
          pdf_path?: string | null
          raw_json_response?: Json | null
          receiver_tax_id?: string | null
          status?: string
          supplier_contract_number?: string | null
          supplier_iban?: string | null
          supplier_name?: string | null
          supplier_tax_id?: string | null
          updated_at?: string | null
          user_id?: string

          // C23: New B2B fields
          tipo_intestatario?: TipoIntestatario
          partita_iva?: string | null
          ragione_sociale?: string | null
          sede_legale?: string | null
          lr_nome?: string | null
          lr_cognome?: string | null
          lr_codice_fiscale?: string | null
          visura_camerale_path?: string | null
          delega_firma_path?: string | null
          indirizzo_fornitura?: string | null
          indirizzo_fatturazione?: string | null
          richiedente_ruolo?: RichiedenteRuolo | null
        }
        Relationships: [
          {
            foreignKeyName: "extracted_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      operators: {
        Row: {
          category_id: number | null
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operators_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          cognome: string | null
          created_at: string
          documento_identita_path: string | null
          indirizzo_residenza: string | null
          nome: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cognome?: string | null
          created_at?: string
          documento_identita_path?: string | null
          indirizzo_residenza?: string | null
          nome?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cognome?: string | null
          created_at?: string
          documento_identita_path?: string | null
          indirizzo_residenza?: string | null
          nome?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      service_types: {
        Row: {
          created_at: string
          id: number
          name: string | null
          operator_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
          operator_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
          operator_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_types_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          }
        ]
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

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
