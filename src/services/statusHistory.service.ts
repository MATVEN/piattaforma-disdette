// src/services/statusHistory.service.ts
import type { StatusHistoryRepository } from '@/repositories/statusHistory.repository'
import type { DisdettaRepository } from '@/repositories/disdetta.repository'
import type { 
  StatusTimelineData, 
  DisdettaStatus, 
  StatusHistoryEntry 
} from '@/types/statusHistory'
import { NotFoundError, ForbiddenError } from '@/lib/errors/AppError'

export class StatusHistoryService {
  constructor(
    private historyRepo: StatusHistoryRepository,
    private disdettaRepo: DisdettaRepository,
    private userId: string
  ) {}

    /**
    * Get complete status timeline for a disdetta
    * Verifies ownership and returns history + estimated completion
    */
    async getStatusTimeline(disdettaId: number): Promise<StatusTimelineData> {
        // 1. Get disdetta and verify ownership
        const disdetta = await this.disdettaRepo.getById(disdettaId, this.userId)
        
        if (!disdetta) {
            throw new NotFoundError('Disdetta', disdettaId)
        }

        if (disdetta.user_id !== this.userId) {
            throw new ForbiddenError('Non hai accesso a questa disdetta')
        }

        // 2. Get status history
        const history = await this.historyRepo.getHistoryByDisdettaId(disdettaId)

        // 3. Calculate estimated completion
        const estimatedCompletion = this.calculateEstimatedCompletion(
            disdetta.status as DisdettaStatus,
            history
        )

        // 4. Build response
        return {
            currentStatus: disdetta.status as DisdettaStatus,
            history,
            estimatedCompletion,
        }
    }

  /**
   * Calculate estimated completion time based on current status
   */
  private calculateEstimatedCompletion(
    currentStatus: DisdettaStatus,
    history: StatusHistoryEntry[]
  ): string | null {
    // Terminal states don't have estimated completion
    const terminalStates: DisdettaStatus[] = ['SENT', 'TEST_SENT', 'FAILED']
    if (terminalStates.includes(currentStatus)) {
      return null
    }

    // Get last history entry timestamp
    const lastEntry = history[history.length - 1]
    if (!lastEntry) return null

    const lastTimestamp = new Date(lastEntry.timestamp)

    // Estimated durations for each state (in minutes)
    const estimations: Partial<Record<DisdettaStatus, number>> = {
      PROCESSING: 5,       // OCR takes ~2-5 min
      PENDING_REVIEW: 0,   // Waiting for user (indefinite)
      CONFIRMED: 10,       // PEC generation + send ~5-10 min
    }

    const estimatedMinutes = estimations[currentStatus]

    // No estimation available
    if (!estimatedMinutes || estimatedMinutes === 0) return null

    // Calculate estimated completion
    const estimatedCompletion = new Date(
      lastTimestamp.getTime() + estimatedMinutes * 60000
    )

    // If estimated time is in the past, return null
    if (estimatedCompletion < new Date()) return null

    return estimatedCompletion.toISOString()
  }
}