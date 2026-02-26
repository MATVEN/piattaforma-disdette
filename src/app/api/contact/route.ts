import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

//  Rate Limiter in-memory
// Limite: 5 richieste per IP ogni 10 minuti
// Nota: in-memory funziona per istanza Vercel. Per rate limiting distribuito
// su più istanze usare Upstash Redis + @upstash/ratelimit.
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minuti

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

function getClientIp(request: NextRequest): string {
  // Vercel popola x-forwarded-for, fallback a 'unknown'
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  // Finestra scaduta o prima richiesta → reset
  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS
    rateLimitMap.set(ip, { count: 1, resetAt })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt }
  }

  // Finestra attiva → incrementa
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt }
}

//  Validazione campi──
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME_LENGTH = 100
const MAX_SUBJECT_LENGTH = 200

//  Handler
export async function POST(request: NextRequest) {
  try {

    // 1. Rate limiting 
    const ip = getClientIp(request)
    const { allowed, remaining, resetAt } = checkRateLimit(ip)

    if (!allowed) {
      const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000)
      console.warn(`[Contact] ⛔ Rate limit superato - IP: ${ip}`)
      return NextResponse.json(
        { error: 'Troppe richieste. Riprova tra qualche minuto.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
          }
        }
      )
    }

    // 2. Parse body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 })
    }

    const { name, email, subject, message } = body as Record<string, unknown>

    // 3. Validazione campi 
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      )
    }

    if (typeof name !== 'string' || typeof email !== 'string' ||
        typeof subject !== 'string' || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Formato campi non valido' },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Email non valida' }, { status: 400 })
    }

    if (name.trim().length < 2 || name.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Il nome deve essere tra 2 e ${MAX_NAME_LENGTH} caratteri` },
        { status: 400 }
      )
    }

    if (subject.trim().length < 2 || subject.trim().length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json(
        { error: `L'oggetto deve essere tra 2 e ${MAX_SUBJECT_LENGTH} caratteri` },
        { status: 400 }
      )
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Il messaggio deve contenere almeno 10 caratteri' },
        { status: 400 }
      )
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Il messaggio non può superare i 1000 caratteri' },
        { status: 400 }
      )
    }

    // 4. Salvataggio DB 
    const supabase = await createServerClient()

    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        status: 'new'
      })

    if (insertError) {
      console.error('[Contact] Database error:', insertError)
      return NextResponse.json(
        { error: 'Errore durante il salvataggio del messaggio' },
        { status: 500 }
      )
    }

    // 5. Risposta con headers rate limit 
    return NextResponse.json(
      { success: true, message: 'Messaggio inviato con successo' },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        }
      }
    )

  } catch (error) {
    console.error('[Contact] Internal error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}