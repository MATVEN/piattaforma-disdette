import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Get password from request
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password richiesta' },
        { status: 400 }
      )
    }

    // Rate limiting: max 5 attempts per 15 minutes per IP
    const ip = getClientIp(request)
    const { allowed, resetAt } = checkRateLimit(
      `delete-account:${ip}`,
      5,
      15 * 60 * 1000
    )

    if (!allowed) {
      const retryAfterSeconds = resetAt ? Math.ceil((resetAt - Date.now()) / 1000) : 900
      return NextResponse.json(
        { error: 'Troppi tentativi. Riprova più tardi.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'Password errata' },
        { status: 401 }
      )
    }

    // Delete storage files
    try {
      // Delete identity document
      const { data: profile } = await supabase
        .from('profiles')
        .select('documento_identita_path')
        .eq('user_id', user.id)
        .single()

      if (profile?.documento_identita_path) {
        await supabase.storage
          .from('documenti-identita')
          .remove([profile.documento_identita_path])
      }

      // Delete uploaded bills
      const { data: disdette } = await supabase
        .from('disdette')
        .select('file_path')
        .eq('user_id', user.id)

      if (disdette && disdette.length > 0) {
        const filePaths = disdette
          .map(d => d.file_path)
          .filter(Boolean)

        if (filePaths.length > 0) {
          await supabase.storage
            .from('documenti_utente')
            .remove(filePaths)
        }
      }
    } catch (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with deletion even if storage fails
    }

    // Delete auth user — requires service role client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteUserError) {
      return NextResponse.json(
        { error: 'Errore eliminazione account' },
        { status: 500 }
      )
    }
    console.log('✅ Auth user deleted successfully')

    // Sign out
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: 'Account eliminato con successo'
    })

  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione' },
      { status: 500 }
    )
  }
}