// src/app/api/get-my-disdette/route.ts

import { NextResponse, type NextRequest } from 'next/server'
import { cookies as nextCookies } from 'next/headers'
import {
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr'

export const dynamic = 'force-dynamic'

// Definiamo il tipo per l'oggetto cookie (come prima)
type CookieStoreType = Awaited<ReturnType<typeof nextCookies>>

const createCookieAdapter = (cookieStore: CookieStoreType) => {
  return {
    getAll() {
      return cookieStore.getAll().map((c: { name: string; value: string }) => ({
        name: c.name,
        value: c.value,
      }))
    },
    setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      } catch (error) {
        // Ignora errori
      }
    },
  }
}

// Gestiamo le richieste GET
export async function GET(request: NextRequest) {
  
  const cookieStore = await nextCookies()
  const cookieAdapter = createCookieAdapter(cookieStore)

  // 1. Client e Autenticazione (Come C6)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Query al Database (La vera modifica)
  try {
    
    // Selezioniamo TUTTI i record dell'utente, ordinati dal più nuovo
    const { data, error } = await supabase
      .from('extracted_data')
      .select('*') // Prendi tutte le colonne
      .eq('user_id', user.id) // SOLO quelle di questo utente (RLS fa già questo, ma è una sicurezza in più)
      .order('created_at', { ascending: false }) // Ordina: le più nuove prima

    if (error) {
      throw error // Lancia l'errore se la query fallisce
    }

    // 3. Successo
    return NextResponse.json(data, { status: 200 })

  } catch (error: unknown) {
    let errorMessage = 'Errore sconosciuto'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Errore in get-my-disdette (route.ts):', errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}