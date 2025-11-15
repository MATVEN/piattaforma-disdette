// src/app/api/get-extracted-data/route.ts

import { NextResponse, type NextRequest } from 'next/server'
import { cookies as nextCookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { z } from 'zod'
import { getExtractedDataSchema } from '@/domain/schemas'

type BasicCookie = { name: string; value: string }
type CookieStoreType = Awaited<ReturnType<typeof nextCookies>>

// --- Adattatore Cookie ---
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

export async function GET(request: NextRequest) {
  const cookieStore = await nextCookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: createCookieAdapter(cookieStore) }
  )

  // 1. Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validazione query
  let filePath: string
  try {
    const filePathRaw = request.nextUrl.searchParams.get('filePath')
    const parsed = getExtractedDataSchema.parse({ filePath: filePathRaw })
    filePath = parsed.filePath
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Payload non valido', details: err.format() },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, error: 'Parametri query non validi' }, { status: 400 })
  }

  // 3. Query
  try {
    const { data, error } = await supabase
      .from('extracted_data')
      .select('id, file_path, status, supplier_tax_id, receiver_tax_id, supplier_iban, raw_json_response, created_at, updated_at, error_message')
      .eq('file_path', filePath)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Data not found or access denied' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, data }, { status: 200 })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Errore sconosciuto'
    console.error('[get-extracted-data][GET] error:', msg, { userId: user.id })
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}