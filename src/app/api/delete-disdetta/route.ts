import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { AuthService } from '@/services/auth.service'
import { DisdettaService } from '@/services/disdetta.service'
import { DisdettaRepository } from '@/repositories/disdetta.repository'
import { handleApiError } from '@/lib/errors/AppError'
import { revalidatePath } from 'next/cache'

export async function DELETE(request: NextRequest) {
  try {
    // ✅ Prima verifica autenticazione con client normale
    const supabase = await createServerClient()
    const user = await AuthService.getCurrentUser(supabase)

    const { id } = await request.json()

    // ✅ Verifica ownership con client normale
    const { data: disdetta, error: checkError } = await supabase
      .from('disdette')
      .select('id, user_id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !disdetta) {
      return NextResponse.json(
        { error: 'Disdetta non trovata' },
        { status: 404 }
      )
    }

    // ✅ Non può eliminare se già inviata
    if (disdetta.status === 'SENT') {
      return NextResponse.json(
        { error: 'Impossibile eliminare disdetta già inviata' },
        { status: 400 }
      )
    }

    // ✅ Usa SERVICE ROLE per bypassare RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { error: deleteError } = await supabaseAdmin
      .from('disdette')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError)
      throw deleteError
    }

    revalidatePath('/dashboard')
    revalidatePath('/api/get-my-disdette')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ DELETE API error:', error)
    return handleApiError(error)
  }
}