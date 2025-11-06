// src/app/api/send-pec/route.ts

import { NextResponse, type NextRequest } from 'next/server'
import { cookies as nextCookies } from 'next/headers'
import {
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr'

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

// Gestiamo le richieste POST
export async function POST(request: NextRequest) {
  
  const cookieStore = await nextCookies()
  const cookieAdapter = createCookieAdapter(cookieStore)

  // 1. Client e Autenticazione
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Lettura del corpo (Body)
  let body: { id: number };
  try {
    body = await request.json()
  } catch (_error) {
    return NextResponse.json({ error: 'JSON Body non valido' }, { status: 400 })
  }

  const { id: disdettaId } = body
  if (!disdettaId) {
    return NextResponse.json({ error: 'ID della disdetta mancante' }, { status: 400 })
  }

  // 3. Verifica di Sicurezza
  try {
    const { data: disdetta, error: selectError } = await supabase
      .from('extracted_data')
      .select('status')
      .eq('id', disdettaId)
      .eq('user_id', user.id)
      .single()

    if (selectError) {
      return NextResponse.json({ error: 'Disdetta non trovata o accesso negato' }, { status: 404 })
    }

    if (disdetta.status !== 'CONFIRMED') {
      return NextResponse.json({ error: `Impossibile inviare: lo stato è ${disdetta.status}` }, { status: 400 })
    }

    // 4. Invocazione della Edge Function
    const { error: invokeError } = await supabase.functions.invoke(
      'send-pec-disdetta',
      { body: { id: disdettaId } }
    )

    if (invokeError) {
      throw new Error(`Errore nell'invocazione della funzione: ${invokeError.message}`)
    }

    // 5. Successo
    return NextResponse.json({ message: 'Invio PEC avviato con successo' }, { status: 202 })

  } catch (error: unknown) {
    let errorMessage = 'Errore sconosciuto'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Errore in send-pec (route.ts):', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}