// src/app/api/confirm-data/route.ts

import { NextResponse, type NextRequest } from 'next/server'
import { cookies as nextCookies } from 'next/headers'
import {
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr'

// Definiamo il tipo per l'oggetto cookie (come abbiamo fatto per l'API GET)
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
        // Ignora errori (es. cookie read-only)
      }
    },
  }
}

// Questa volta gestiamo le richieste PATCH (o POST, ma PATCH è più corretto per "aggiorna")
export async function PATCH(request: NextRequest) {
  
  const cookieStore = await nextCookies()
  const cookieAdapter = createCookieAdapter(cookieStore)

  // 1. Client e Autenticazione (Come C5)
  // Usiamo la ANON KEY per permettere al client di identificare
  // l'utente tramite i cookie e rinfrescare il token se necessario.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Lettura del corpo (Body) della richiesta
  // Questi sono i dati che il ReviewForm ha inviato
  let body: {
    id: number;
    supplier_tax_id: string;
    receiver_tax_id: string;
    supplier_iban: string;
  };

  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'JSON Body non valido' }, { status: 400 })
  }

  const { id, supplier_tax_id, receiver_tax_id, supplier_iban } = body

  if (!id) {
    return NextResponse.json({ error: 'ID del record mancante' }, { status: 400 })
  }

  // 3. Aggiornamento sicuro dei dati (Query)
  try {
    const { data, error } = await supabase
      .from('extracted_data')
      .update({
        supplier_tax_id: supplier_tax_id,
        receiver_tax_id: receiver_tax_id,
        supplier_iban: supplier_iban,
        status: 'CONFIRMED' // --- Aggiorniamo lo stato! ---
      })
      .eq('id', id) // Aggiorna solo questo record
      .eq('user_id', user.id) // E SOLO se l'utente è il proprietario (Sicurezza RLS!)
      .select() // Restituisce i dati aggiornati
      .single() // Ci aspettiamo un solo risultato

    if (error) {
      // Se 'PGRST116', la RLS ha bloccato l'update (l'utente non è proprietario)
      if (error.code === 'PGRST116') {
         return NextResponse.json({ error: 'Record non trovato o accesso negato' }, { status: 404 })
      }
      throw error
    }

    // 4. Successo
    return NextResponse.json(data, { status: 200 })

  } catch (error: unknown) {
    let errorMessage = 'Errore sconosciuto'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Errore in confirm-data (route.ts):', errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}