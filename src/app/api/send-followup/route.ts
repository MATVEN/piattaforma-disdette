import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const maxDuration = 30

const DISDETTA_STATUS = {
    SENT: 'SENT',
} as const

interface RequestBody {
    id: number
}

function isRequestBody(x: unknown): x is RequestBody {
    if (typeof x !== 'object' || x === null) return false
    const rec = x as Record<string, unknown>
    return typeof rec.id === 'number'
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient()
        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
        }
        
        // Parse body
        let body: unknown
        try { 
            body = await request.json() 
        } catch { 
            return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 })
        }
        
        if (!isRequestBody(body)) {
            return NextResponse.json({ error: "Parametro 'id' mancante o non numerico" }, { status: 400 })
        }
        
        const disdettaId = body.id
        console.log(`[Send Followup] User ${user.id} requesting followup for disdetta ${disdettaId}`)
        
        // Fetch disdetta
        const { data: disdetta, error: disdettaError } = await supabase
            .from('disdette')
            .select('id, user_id, status, created_at, followup_1_sent_at, followup_2_sent_at, followup_count')
            .eq('id', disdettaId)
            .eq('user_id', user.id)
            .single()
        
        if (disdettaError || !disdetta) {
            console.error('[Send Followup] Disdetta not found:', disdettaError?.message)
            return NextResponse.json({ error: 'Disdetta non trovata' }, { status: 404 })
        }
        
        // Validate status
        if (disdetta.status !== DISDETTA_STATUS.SENT) {
            return NextResponse.json({ 
                error: `Impossibile inviare sollecito: stato attuale è ${disdetta.status} (richiesto SENT)` 
            }, { status: 400 })
        }

        // Validate followup limit (max 2)
        const followupCount = disdetta.followup_count || 0
        if (followupCount >= 2) {
            return NextResponse.json({
                error: 'Limite massimo solleciti raggiunto (2/2). Contatta il supporto per assistenza.',
                followup_count: followupCount
            }, { status: 400 })
        }
        console.log(`[Send Followup] Current followup count: ${followupCount}/2`)
        
        // Get reference timestamp based on current status
        let referenceStatus: string
        let requiredDays: number
        if (disdetta.status === 'SENT') {
            referenceStatus = 'SENT'
            requiredDays = 14
        } else if (disdetta.status === 'FOLLOWUP_1') {
            referenceStatus = 'FOLLOWUP_1'
            requiredDays = 15
        } else {
            return NextResponse.json({
                error: `Stato non valido per sollecito: ${disdetta.status}`
            }, { status: 400 })
        }

        const { data: historyData } = await supabase
            .from('disdetta_status_history')
            .select('timestamp')
            .eq('disdetta_id', disdettaId)
            .eq('status', referenceStatus)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single()
        
        if (!historyData?.timestamp) {
            return NextResponse.json({ 
                error: 'Impossibile determinare data invio originale' 
            }, { status: 400 })
        }
        
        // Validate required days passed
        const referenceDate = new Date(historyData.timestamp)
        const now = new Date()
        const daysSinceReference = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysSinceReference < requiredDays) {
            return NextResponse.json({
                error: `Sollecito disponibile tra ${requiredDays - daysSinceReference} giorni`,
                days_remaining: requiredDays - daysSinceReference
            }, { status: 400 })
        }
        
        console.log(`[Send Followup] Validation passed, calling Edge Function`)
        
        // Call Edge Function
        const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-pec-disdetta`
        // Get session token from Supabase client
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Sessione non valida' }, { status: 401 })
        }

        console.log(`[Send Followup] Calling Edge Function at ${edgeFunctionUrl}`)

        const edgeResponse = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify({
                id: disdettaId,
                type: 'followup'
            }),
        })
        
        const edgeData = await edgeResponse.json()
        
        if (!edgeResponse.ok) {
            console.error('[Send Followup] Edge Function error:', edgeData)
                return NextResponse.json({ 
                error: edgeData.error || 'Errore invio sollecito' 
            }, { status: edgeResponse.status })
        }
        
        console.log(`[Send Followup] Success for disdetta ${disdettaId}`)
        
        return NextResponse.json({
            success: true,
            message: 'Sollecito inviato con successo',
            followup_count: (disdetta.followup_count || 0) + 1,
            sent_at: new Date().toISOString()
        })
    
    } catch (error) {
        console.error('[Send Followup] Error:', error)
        return NextResponse.json({ 
            error: 'Errore durante l\'invio del sollecito' 
        }, { status: 500 })
    }
}