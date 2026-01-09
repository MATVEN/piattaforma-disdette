import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Delete database records (cascade will handle related records)
    // Status history will be deleted automatically via foreign key cascade
    await supabase
      .from('disdette')
      .delete()
      .eq('user_id', user.id)

    await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.id)

    // Delete auth user
    // Note: This requires service role or the user calling deleteUser on themselves
    // The user can delete their own account via the client
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
      user.id
    )

    if (deleteUserError) {
      console.error('Auth deletion error:', deleteUserError)
      // If admin delete fails, try regular user deletion
      // This will work if RLS allows users to delete themselves
      const { error: fallbackError } = await supabase.rpc('delete_user')

      if (fallbackError) {
        return NextResponse.json(
          { error: 'Errore durante l\'eliminazione dell\'account' },
          { status: 500 }
        )
      }
    }

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
