// src/repositories/statusHistory.repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { StatusHistoryEntry } from '@/types/statusHistory'

export class StatusHistoryRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get status history for a specific disdetta
   */
  async getHistoryByDisdettaId(disdettaId: number): Promise<StatusHistoryEntry[]> {
    const { data, error } = await this.supabase
      .from('status_history')
      .select('*')
      .eq('disdetta_id', disdettaId)
      .order('timestamp', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch status history: ${error.message}`)
    }

    return data as StatusHistoryEntry[]
  }

  /**
   * Get latest status entry for a disdetta
   */
  async getLatestStatus(disdettaId: number): Promise<StatusHistoryEntry | null> {
    const { data, error } = await this.supabase
      .from('status_history')
      .select('*')
      .eq('disdetta_id', disdettaId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // Not found is OK
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch latest status: ${error.message}`)
    }

    return data as StatusHistoryEntry
  }
}