// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // ✅ Skip middleware per new-disdetta - ha già protezione client-side
  if (pathname.startsWith('/new-disdetta')) {
    console.log('⏩ Skipping middleware for /new-disdetta (client-side protection)')
    return NextResponse.next()
  }
  
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Liste route protette (SENZA new-disdetta)
  const protectedRoutes = ['/dashboard', '/profileUser', '/upload', '/review']
  const profileRequiredRoutes = ['/upload', '/review']

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isProfileRequiredRoute = profileRequiredRoutes.some((route) => pathname.startsWith(route))

  // CASO 1: No user + protected route → redirect login
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // CASO 2: User logged + profile required → check completeness
  if (user && isProfileRequiredRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, cognome, indirizzo_residenza')
      .eq('user_id', user.id)
      .maybeSingle()

    const isProfileComplete =
      profile && profile.nome && profile.cognome && profile.indirizzo_residenza

    if (!isProfileComplete) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/profileUser'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}