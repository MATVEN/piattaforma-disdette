/**
 * Supabase Server Client Factory
 * Centralizza la creazione del client server-side con gestione cookies
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Crea un client Supabase per uso server-side (API Routes, Server Components)
 * Gestisce automaticamente i cookies per l'autenticazione
 */
export async function createServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Cookie setting può fallire in middleware o route handlers
            // Questo è OK, il token sarà comunque validato
            console.warn('Failed to set cookies:', error);
          }
        },
      },
    }
  );
}

/**
 * Crea un client Supabase con SERVICE_ROLE_KEY
 * ⚠️ USARE CON CAUTELA: bypassa RLS!
 * Usare solo per operazioni admin o dopo aver verificato manualmente i permessi
 */
export function createServiceRoleClient(): SupabaseClient {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY non configurata');
  }

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

/**
 * Type helper per il database
 * Può essere esteso con i tipi generati da Supabase CLI
 */
export type Database = {
  public: {
    Tables: {
      extracted_data: {
        Row: {
          id: number;
          created_at: string;
          user_id: string;
          file_path: string;
          status: string;
          supplier_tax_id: string | null;
          receiver_tax_id: string | null;
          supplier_iban: string | null;
          raw_json_response: any;
          pdf_path: string | null;
          updated_at: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          user_id: string;
          file_path: string;
          status?: string;
          supplier_tax_id?: string | null;
          receiver_tax_id?: string | null;
          supplier_iban?: string | null;
          raw_json_response?: any;
          pdf_path?: string | null;
          updated_at?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          user_id?: string;
          file_path?: string;
          status?: string;
          supplier_tax_id?: string | null;
          receiver_tax_id?: string | null;
          supplier_iban?: string | null;
          raw_json_response?: any;
          pdf_path?: string | null;
          updated_at?: string | null;
          error_message?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          nome: string | null;
          cognome: string | null;
          indirizzo_residenza: string | null;
          documento_identita_path: string | null;
        };
      };
      // Altri tipi di tabelle possono essere aggiunti qui
    };
  };
};