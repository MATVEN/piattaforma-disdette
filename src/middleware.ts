// src/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Funzione helper per l'adattatore cookie (come nelle nostre API)
const createCookieAdapter = (request: NextRequest) => {
  return {
    getAll() {
      return request.cookies.getAll().map((c) => ({
        name: c.name,
        value: c.value,
      }))
    },
    setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
      const response = NextResponse.next()
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })
      // Nelle GET, non possiamo 'settare' i cookie sulla richiesta,
      // ma il client ssr ne ha bisogno. Restituiamo una finta risposta.
      // Questo è un workaround noto per il middleware.
    },
  }
}

// Funzione helper per creare un client Supabase nel middleware
const createSupabaseMiddlewareClient = (request: NextRequest) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: createCookieAdapter(request) }
  )
}

// Lista delle pagine che richiedono il LOGIN
const protectedRoutes = [
  '/dashboard',
  '/profileUser',
  '/new-disdetta',
  '/upload',
  '/review',
]

// Lista delle pagine che richiedono il PROFILO COMPLETO
// (come da nostra logica C9 corretta)
const profileRequiredRoutes = [
  '/new-disdetta',
  '/upload',
  '/review',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Creiamo un client Supabase
  const supabase = createSupabaseMiddlewareClient(request)

  // 2. Recuperiamo l'utente loggato
  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isProfileRequiredRoute = profileRequiredRoutes.some(route => pathname.startsWith(route))

  // --- LOGICA DI PROTEZIONE ---

  // CASO 1: Utente NON loggato che prova ad accedere a una pagina protetta
  if (!user && isProtectedRoute) {
    console.log("C11: Utente non loggato, reindirizzo a /login")
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // CASO 2: Utente LOGGATO che prova ad accedere a una pagina "critica"
  // ma NON ha il profilo completo.
  if (user && isProfileRequiredRoute) {
    // Dobbiamo controllare il profilo
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('nome, cognome, indirizzo_residenza, documento_identita_path') // <-- 1. Seleziona il path
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error("C11: Errore query profilo nel middleware", error.message)
      return NextResponse.next()
    }
    
    // 2. Aggiungi il controllo del documento
    const isProfileComplete = profile &&
                              profile.nome &&
                              profile.cognome &&
                              profile.indirizzo_residenza &&
                              profile.documento_identita_path // <-- 3. Controlla che esista

    if (!isProfileComplete) {
      console.log("C11: Profilo incompleto (mancano dati o documento ID), reindirizzo a /profileUser")
      const url = request.nextUrl.clone()
      url.pathname = '/profileUser'
      return NextResponse.redirect(url)
    }

  }

  // Se nessuno dei casi scatta, l'utente può procedere
  return NextResponse.next()
}

// Configurazione: specifica su quali rotte il middleware deve girare
export const config = {
  matcher: [
    /*
     * Abbina tutte le rotte eccetto:
     * - api (percorsi API)
     * - _next/static (file statici)
     * - _next/image (ottimizzazione immagini)
     * - favicon.ico (file favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}