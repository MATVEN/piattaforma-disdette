// src/lib/supabaseClient.ts

import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { // <-- OGGETTO OPZIONI AGGIUNTO
    auth: {
      // Come da audit: sessioni stabili e refresh automatico
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true 
    }
  }
)