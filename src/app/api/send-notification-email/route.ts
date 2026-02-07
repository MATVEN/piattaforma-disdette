import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import {
  sendEmail,
  getDisdettaReadyEmail,
  getPecSentEmail,
  getProcessingErrorEmail,
} from '@/lib/email/emailService'

export async function POST(request: NextRequest) {
  try {

    // Feature flag: disable emails in development
    const isDev = process.env.NODE_ENV === 'development' || !process.env.VERCEL_URL
    if (isDev) {
      console.log('[EMAIL] ⏭️  Skipped (development mode)')
      return NextResponse.json({
        success: true,
        message: 'Email notifications disabled in development',
        dev_mode: true
      })
    }

    const supabase = await createServerClient()
    const supabaseAdmin = createServiceRoleClient()

    // Get authenticated user (if called from client) or verify internal call
    const { data: { user } } = await supabase.auth.getUser()

    // Get notification data from request
    const { disdettaId, type } = await request.json()

    if (!disdettaId || !type) {
      return NextResponse.json(
        { error: 'Missing disdettaId or type' },
        { status: 400 }
      )
    }
    
    // Fetch disdetta data (no join for testing)
    const { data: disdetta, error: fetchError } = await supabaseAdmin
      .from('disdette')
      .select('*')
      .eq('id', disdettaId)
      .single()

    if (fetchError || !disdetta) {
      console.error('[EMAIL] Disdetta fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Disdetta not found', debug: fetchError },
        { status: 404 }
      )
    }

    // Get profile separately
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nome, cognome')
      .eq('user_id', disdetta.user_id)
      .single()

    // Get user email using service role client
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(disdetta.user_id)
    const userEmail = authUser.user?.email

    if (!userEmail) {
      console.error('[EMAIL] User email not found for user_id:', disdetta.user_id)
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      )
    }

    // Prepare email based on type
    let emailData: { subject: string; html: string } | null = null
    const userName = profile?.nome || 'Utente'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

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
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    // Send email
    const result = await sendEmail({
      to: userEmail,
      subject: emailData.subject,
      html: emailData.html,
    })

    if (!result.success) {
      console.error('Failed to send email:', result.error)
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }

    console.log(`Email sent successfully: ${type} notification to ${userEmail}`)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      type,
      disdettaId,
    })
  } catch (error) {
    console.error('Send notification email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}