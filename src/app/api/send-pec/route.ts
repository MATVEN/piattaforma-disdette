// src/app/api/send-pec/route.ts

import { NextResponse, type NextRequest } from 'next/server'
import { cookies as nextCookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { z } from 'zod'
import { parseSendPec } from '@/domain/schemas'

type BasicCookie = { name: string; value: string }
type CookieStoreType = Awaited<ReturnType<typeof nextCookies>>

// --- 1. ADATTATORE COOKIE CORRETTO (SENZA 'workRes') ---
const createCookieAdapter = (cookieStore: CookieStoreType) => ({
  getAll() {
    const all = cookieStore.getAll()
    return all.map((c: BasicCookie) => ({ name: c.name, value: c.value }))
  },
  setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
    try {
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options)
      })
    } catch (error) {
      // Ignora errori read-only (necessario per auth.getUser())
    }
  },
})

export async function POST(request: NextRequest) {
  const cookieStore = await nextCookies()

  // 1) Supabase SSR (ora usa l'adapter corretto)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: createCookieAdapter(cookieStore) }
  )

  // 2) Auth 
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // 3) Body validation 
  let body: ReturnType<typeof parseSendPec>
  try {
    body = parseSendPec(await request.json())
  } catch (e) {
    const details = e instanceof z.ZodError ? e.format() : undefined
    const message = e instanceof Error ? e.message : 'Body non valido'
    return NextResponse.json({ success: false, error: message, details }, { status: 400 })
  }

  const { id: disdettaId, test_mode } = body

  // 4) Guard: stato record 
  try {
    const { data: row, error: selErr } = await supabase
      .from('extracted_data')
      .select('id,status,user_id')
      .eq('id', disdettaId)
      .eq('user_id', user.id) // ownership + RLS
      .single()

    if (selErr || !row) {
      return NextResponse.json(
        { success: false, error: 'Disdetta non trovata o accesso negato' },
        { status: 404 }
      )
    }

    if (row.status === 'SENT' || row.status === 'TEST_SENT') {
      return NextResponse.json(
        { success: false, error: `Disdetta già inviata (stato: ${row.status})` },
        { status: 409 } // 409 = Conflict
      )
    }

    if (row.status !== 'CONFIRMED') {
      return NextResponse.json(
        { success: false, error: `Impossibile inviare: lo stato è ${row.status}` },
        { status: 409 } // conflict / precondition failed
      )
    }

    // 5) Invoke Edge Function
    const { error: invokeError } = await supabase.functions.invoke('send-pec-disdetta', {
      body: { id: disdettaId, ...(test_mode ? { test_mode: true } : {}) },
    })

    if (invokeError) {
      throw new Error(`Errore invocazione funzione: ${invokeError.message}`)
    }

    // --- 6. RISPOSTA ---
    return NextResponse.json(
      { success: true, message: 'Invio PEC avviato' },
      { status: 202 }
    )

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
    console.error('[send-pec][POST] error:', msg, { disdettaId, userId: user.id })
    // --- 6. RISPOSTA ---
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}