import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

    // Fetch all user data
    const [profileResult, disdette, statusHistory] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),

      supabase
        .from('extracted_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      supabase
        .from('status_history')
        .select('*')
        .eq('user_id', user.id)
        .order('changed_at', { ascending: false })
    ])

    // Build export object
    const exportData = {
      export_date: new Date().toISOString(),
      export_format: 'JSON',
      gdpr_compliant: true,

      account: {
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
      },

      profile: profileResult.data || null,

      disdette: {
        total_count: disdette.data?.length || 0,
        items: disdette.data || [],
      },

      status_history: {
        total_count: statusHistory.data?.length || 0,
        items: statusHistory.data || [],
      },

      storage_files: {
        documento_identita: profileResult.data?.documento_identita_path || null,
        bollette_caricate: disdette.data?.map(d => d.file_path).filter(Boolean) || [],
      },

      metadata: {
        total_disdette: disdette.data?.length || 0,
        disdette_by_status: disdette.data?.reduce((acc: any, d: any) => {
          acc[d.status] = (acc[d.status] || 0) + 1
          return acc
        }, {}) || {},
      }
    }

    // Return as JSON file
    return new NextResponse(
      JSON.stringify(exportData, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="DisEasy-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      }
    )

  } catch (error) {
    console.error('Export data error:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'esportazione' },
      { status: 500 }
    )
  }
}
