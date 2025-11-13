// src/app/api/confirm-data/route.ts

import { NextResponse, type NextRequest } from 'next/server'
import { cookies as nextCookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { parseConfirmData } from '@/domain/schemas'
import { z } from 'zod'

type BasicCookie = { name: string; value: string }
type CookieStoreType = Awaited<ReturnType<typeof nextCookies>>

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
    } catch (error) { /* Ignora errori read-only */ }
  },
})

type UpdateRow = {
  supplier_tax_id?: string | null
  receiver_tax_id?: string | null
  supplier_iban?: string | null
  status?: 'CONFIRMED'
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await nextCookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: createCookieAdapter(cookieStore) }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: ReturnType<typeof parseConfirmData>
  let parsedId: number | null = null // Per il logging degli errori

  try {
    const rawBody = await request.json()
    // 1. Usiamo 'strict: false'
    body = parseConfirmData(rawBody, /* strict */ false)
    parsedId = body.id // Salviamo l'ID per il logging
    
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
       return NextResponse.json(
        { success: false, error: 'Payload non valido', details: e.format() },
        { status: 400 }
      )
    }
    const message = e instanceof Error ? e.message : 'Body non valido'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }

  const { id, supplier_tax_id, receiver_tax_id, supplier_iban } = body

  // Logica "Smart Update"
  const updatePayload: UpdateRow = {}
  const setIfPresent = <K extends keyof UpdateRow>(key: K, value: unknown) => {
    if (value === undefined) return
    if (value === null) { updatePayload[key] = null as UpdateRow[K]; return }
    if (typeof value === 'string') { updatePayload[key] = value as UpdateRow[K] }
  }
  setIfPresent('supplier_tax_id', supplier_tax_id)
  setIfPresent('receiver_tax_id', receiver_tax_id)
  setIfPresent('supplier_iban',   supplier_iban)

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Nessun campo fornito per l’aggiornamento' },
      { status: 400 }
    )
  }
  updatePayload.status = 'CONFIRMED'

  try {
    const { data, error } = await supabase
      .from('extracted_data')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, supplier_tax_id, receiver_tax_id, supplier_iban, status, updated_at')
      .single()

    if (error) {
      throw error // Lancia l'errore PostgREST al blocco catch
    }

    return NextResponse.json({ success: true, data }, { status: 200 })

  } catch (error: unknown) {
    // --- 2. BLOCCO CATCH  ---
    let errorMessage = 'Errore sconosciuto durante l\'aggiornamento del database.'
    
    // Controlliamo se è un oggetto errore di Supabase (PostgrestError)
    if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as { message: string }).message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    console.error('[confirm-data][PATCH] ERRORE DATABASE:', errorMessage, {
      id: parsedId, // Usa l'ID salvato
      userId: user.id,
      errorObject: JSON.stringify(error) // Logga l'intero oggetto errore
    });

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}