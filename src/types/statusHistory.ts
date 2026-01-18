// src/types/statusHistory.ts

import type { DisdettaStatus } from './enums'

/** Entry nella tabella disdetta_status_history */
export interface StatusHistoryEntry {
  id: number
  disdetta_id: number
  status: DisdettaStatus  // Importato da enums.ts
  timestamp: string       // ISO 8601
  duration_seconds: number | null
  metadata: Record<string, any> | null
  created_by: string
}

/** Dati per timeline UI */
export interface StatusTimelineData {
  currentStatus: DisdettaStatus  // Importato da enums.ts
  history: StatusHistoryEntry[]
  estimatedCompletion?: string | null
}