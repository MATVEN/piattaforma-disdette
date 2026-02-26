import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  sendEmail,
  getDisdettaReadyEmail,
  getPecSentEmail,
  getProcessingErrorEmail,
} from '@/lib/email/emailService'

// ─── Costanti ────────────────────────────────────────────────
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET

// ─── Helper autenticazione ────────────────────────────────────
function verifyInternalSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-internal-secret')
  if (!INTERNAL_SECRET) {
    console.error('[EMAIL] INTERNAL_API_SECRET non configurata!')
    return false
  }
  return secret === INTERNAL_SECRET
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Autenticazione: accetta solo chiamate con il secret interno ──
    if (!verifyInternalSecret(request)) {
      console.warn('[EMAIL] ⛔ Accesso non autorizzato - secret mancante o errato')
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // ── 2. Feature flag: disabilita email in sviluppo ──
    const isDev = process.env.NODE_ENV === 'development' || !process.env.VERCEL_URL
    if (isDev) {
      console.log('[EMAIL] ⏭️  Skipped (development mode)')
      return NextResponse.json({
        success: true,
        message: 'Email notifications disabled in development',
        dev_mode: true
      })
    }

    // ── 3. Parse body ──
    const { disdettaId, type } = await request.json()

    if (!disdettaId || !type) {
      return NextResponse.json(
        { error: 'Missing disdettaId or type' },
        { status: 400 }
      )
    }

    // ── 4. Fetch dati con service role ──
    const supabaseAdmin = createServiceRoleClient()

    const { data: disdetta, error: fetchError } = await supabaseAdmin
      .from('disdette')
      .select('id, user_id, supplier_name, error_message')  // ← solo campi necessari, non select('*')
      .eq('id', disdettaId)
      .single()

    if (fetchError || !disdetta) {
      console.error('[EMAIL] Disdetta fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Disdetta not found' },  // ← rimosso debug: fetchError dalla risposta pubblica
        { status: 404 }
      )
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nome')
      .eq('user_id', disdetta.user_id)
      .single()

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(disdetta.user_id)
    const userEmail = authUser.user?.email

    if (!userEmail) {
      console.error('[EMAIL] User email not found for user_id:', disdetta.user_id)
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    // ── 5. Prepara e invia email ──
    const userName = profile?.nome || 'Utente'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    let emailData: { subject: string; html: string } | null = null

    switch (type) {
      case 'ready':
        emailData = getDisdettaReadyEmail({
          userName,
          supplierName: disdetta.supplier_name || 'il fornitore',
          disdettaId: disdetta.id,
          reviewUrl: `${baseUrl}/review?id=${disdetta.id}`,
        })
        break
      case 'sent':
        emailData = getPecSentEmail({
          userName,
          supplierName: disdetta.supplier_name || 'il fornitore',
          disdettaId: disdetta.id,
          dashboardUrl: `${baseUrl}/dashboard`,
        })
        break
      case 'error':
        emailData = getProcessingErrorEmail({
          userName,
          supplierName: disdetta.supplier_name,
          disdettaId: disdetta.id,
          errorMessage: disdetta.error_message,
          uploadUrl: `${baseUrl}/new-disdetta`,
        })
        break
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    const result = await sendEmail({
      to: userEmail,
      subject: emailData.subject,
      html: emailData.html,
    })

    if (!result.success) {
      console.error('[EMAIL] Failed to send:', result.error)
      return NextResponse.json(
        { error: 'Failed to send email' },  // ← non esporre result.error al client
        { status: 500 }
      )
    }

    console.log(`[EMAIL] ✅ ${type} → ${userEmail}`)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      type,
      disdettaId,
    })

  } catch (error) {
    console.error('[EMAIL] Internal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}