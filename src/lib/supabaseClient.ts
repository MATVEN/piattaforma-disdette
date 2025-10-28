import { createClient } from '@supabase/supabase-js'

// Recupera le variabili d'ambiente che abbiamo appena impostato
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Crea ed esporta il client Supabase
// Questo 'supabase' è l'oggetto che useremo per tutto:
// per il login, per le query al db, ecc.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)