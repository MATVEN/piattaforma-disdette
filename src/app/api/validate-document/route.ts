import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// ─── Whitelist bucket e MIME consentiti ───────────────────────
const ALLOWED_BUCKETS = ['documenti_utente'] as const
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/tiff']

interface ValidationResult {
  is_valid: boolean
  reason: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { file_path, bucket } = await req.json()

    if (!file_path || !bucket) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
    }

    // ── SECURITY: Whitelist bucket ────────────────────────────
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      console.warn(`[Validate Doc] ⛔ Bucket non autorizzato: "${bucket}" - user: ${user.id}`)
      return NextResponse.json({ error: 'Bucket non autorizzato' }, { status: 403 })
    }

    // ── SECURITY: Path traversal prevention ──────────────────
    // 1. Nessun path traversal (../)
    // 2. Il path deve iniziare con l'user_id dell'utente autenticato
    // 3. Nessun path assoluto
    if (
      file_path.includes('..') ||
      file_path.startsWith('/') ||
      !file_path.startsWith(`${user.id}/`)
    ) {
      console.warn(`[Validate Doc] ⛔ Path non autorizzato: "${file_path}" - user: ${user.id}`)
      return NextResponse.json({ error: 'Accesso al file non autorizzato' }, { status: 403 })
    }

    // Download file
    const { data: fileBlob, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(file_path)

    if (downloadError || !fileBlob) {
      return NextResponse.json({ error: 'File non trovato' }, { status: 404 })
    }

    // ── SECURITY: Valida MIME type prima di passarlo a Claude ─
    const mimeType = fileBlob.type || 'application/octet-stream'
    if (!ALLOWED_MIME.includes(mimeType)) {
      console.warn(`[Validate Doc] ⛔ MIME non consentito: "${mimeType}" - user: ${user.id}`)
      return NextResponse.json({ error: 'Tipo file non supportato' }, { status: 400 })
    }

    // Convert to base64
    const arrayBuffer = await fileBlob.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Call Claude Haiku for validation
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: [
            {
              type: mimeType === 'application/pdf' ? 'document' : 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64
              }
            },
            {
              type: 'text',
              text: `
                Analizza questo documento e verifica:
                1. È un documento di servizio (bolletta, fattura utenze)?
                2. Il testo è leggibile (non sfocato, non troppo scuro)?
                3. L'immagine è di qualità sufficiente per l'elaborazione?

                Rispondi SOLO con un JSON valido nel seguente formato (senza markdown):
                {
                  "is_valid": true o false,
                  "reason": "breve spiegazione (max 50 caratteri)"
                }

                Esempi di documenti NON validi:
                - Screenshot di chat/email
                - Foto sfocate o illeggibili
                - Immagini troppo scure
                - Documenti non relativi a utenze/servizi`
            }
          ]
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('[Validate Doc] Claude error:', errorText)
      return NextResponse.json({ error: 'Errore validazione' }, { status: 500 })
    }

    const claudeData = await claudeResponse.json()
    const textContent = claudeData.content?.find((c: { type: string }) => c.type === 'text')?.text

    if (!textContent) {
      return NextResponse.json({ error: 'Risposta Claude vuota' }, { status: 500 })
    }

    const cleanText = textContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    let validation: ValidationResult
    try {
      validation = JSON.parse(cleanText)
    } catch {
      console.error('[Validate Doc] Parse error, raw:', cleanText)
      return NextResponse.json({ error: 'Formato risposta non valido' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      is_valid: validation.is_valid,
      reason: validation.reason
    })

  } catch (error) {
    console.error('[Validate Doc] Error:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}