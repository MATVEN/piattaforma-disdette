// src/app/api/get-status-history/route.ts
/**
 * API Route: GET /api/get-status-history
 * Recupera la cronologia completa degli stati per una disdetta
 * 
 * Query Parameters:
 * - id: ID della disdetta (required)
 * 
 * Response:
 * {
 *   currentStatus: DisdettaStatus,
 *   history: StatusHistoryEntry[],
 *   estimatedCompletion: string | null
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { AuthService } from '@/services/auth.service'
import { StatusHistoryService } from '@/services/statusHistory.service'
import { StatusHistoryRepository } from '@/repositories/statusHistory.repository'
import { DisdettaRepository } from '@/repositories/disdetta.repository'
import { handleApiError } from '@/lib/errors/AppError'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 1. Setup client e autenticazione
    const supabase = await createServerClient()
    const user = await AuthService.getCurrentUser(supabase)

    // 2. Parse parametro ID
    const { searchParams } = new URL(request.url)
    const disdettaId = searchParams.get('id')

    if (!disdettaId) {
      return NextResponse.json(
        { error: 'Missing disdetta ID parameter' },
        { status: 400 }
      )
    }

    const id = parseInt(disdettaId, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid disdetta ID' },
        { status: 400 }
      )
    }

    // 3. Business logic delegata al service
    const historyRepository = new StatusHistoryRepository(supabase)
    const disdettaRepository = new DisdettaRepository(supabase)
    const service = new StatusHistoryService(
      historyRepository,
      disdettaRepository,
      user.id
    )

    const timeline = await service.getStatusTimeline(id)

    // 4. Response
    return NextResponse.json(timeline)
  } catch (error) {
    return handleApiError(error)
  }
}