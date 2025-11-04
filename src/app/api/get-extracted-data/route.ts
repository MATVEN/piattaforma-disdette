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
    
    // Implementiamo 'setAll' in modo sicuro.
    // L'auth.getUser() POTREBBE aver bisogno di rinfrescare il token (scrivere cookie).
    setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      } catch (error) {
        // Ignora gli errori se i cookie sono read-only
        // (es. durante il pre-rendering statico o se la richiesta è già terminata)
      }
    },
  }
}

export async function GET(request: NextRequest) {
  
  const cookieStore = await nextCookies()
  const cookieAdapter = createCookieAdapter(cookieStore)

  // Usiamo UN SOLO client. Usiamo la ANON KEY.
  // Sarà questo client a leggere i cookie e a identificare l'utente.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // <-- CHIAVE CORRETTA
    { cookies: cookieAdapter }
  )

  // 1. Ottenere l'utente (ora funzionerà)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    // Se fallisce ancora, l'utente NON è loggato
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Ottenere il parametro
  const filePath = request.nextUrl.searchParams.get('filePath')
  if (!filePath) {
    return NextResponse.json(
      { error: 'filePath parameter is required' },
      { status: 400 }
    )
  }

  try {
    // 3. Eseguire la query (con lo stesso client)
    // Dato che il client usa la ANON KEY, la RLS sarà rispettata.
    const { data, error } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('file_path', filePath)
      .eq('user_id', user.id) // Sicurezza aggiuntiva
      .single()

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Data not found or access denied' },
          { status: 404 }
        )
      }
      throw error
    }

    // 4. Restituire i dati
    return NextResponse.json(data, { status: 200 })
    
  } catch (error) {
    console.error('Errore query in get-extracted-data:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}