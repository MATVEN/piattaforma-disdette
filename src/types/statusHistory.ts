// src/types/statusHistory.ts
// Type definitions for status tracking system

export type DisdettaStatus = 
  | 'PROCESSING'      // Upload → OCR in corso
  | 'PENDING_REVIEW'  // OCR completato → Attende user
  | 'CONFIRMED'       // User ha confermato → Pronta per PEC
  | 'SENT'            // PEC inviata con successo
  | 'TEST_SENT'       // PEC test inviata
  | 'FAILED'          // Errore in qualche fase

export interface StatusHistoryEntry {
  id: number
  disdetta_id: number
  status: DisdettaStatus
  timestamp: string // ISO 8601
  duration_seconds: number | null
  metadata: Record<string, any>
  created_by: string
}

export interface StatusTimelineData {
  currentStatus: DisdettaStatus
  history: StatusHistoryEntry[]
  estimatedCompletion?: string | null
}

// Status configuration with display info
export interface StatusConfig {
  key: DisdettaStatus
  label: string
  description: string
  icon: string // Emoji or icon name
  color: string // Tailwind color
  isTerminal: boolean // True se è uno stato finale
}

// All possible statuses in order
export const STATUS_ORDER: DisdettaStatus[] = [
    'PROCESSING',      // Step 1: Upload & OCR
    'PENDING_REVIEW',  // Step 2: User review
    'SENT',            // Step 3: PEC sent (includes CONFIRMED as intermediate state)
    // CONFIRMED is not shown as separate step, but as progress towards SENT
    // TEST_SENT is treated as SENT
    // FAILED is not in order (can happen at any time)
]

// Status display configuration
export const STATUS_CONFIG: Record<DisdettaStatus, StatusConfig> = {
    PROCESSING: {
        key: 'PROCESSING',
        label: 'Caricamento',
        description: 'Documento caricato ed elaborazione avviata',
        icon: 'Upload',
        color: 'blue',
        isTerminal: false,
    },
    PENDING_REVIEW: {
        key: 'PENDING_REVIEW',
        label: 'Revisione',
        description: 'Controlla e conferma i dati estratti',
        icon: 'FileCheck',
        color: 'yellow',
        isTerminal: false,
    },
    CONFIRMED: {
        key: 'CONFIRMED',
        label: 'In Invio',
        description: 'Generazione e invio PEC in corso',
        icon: 'Loader2', // Spinner icon
        color: 'blue',
        isTerminal: false,
    },
    SENT: {
        key: 'SENT',
        label: 'Inviata',
        description: 'PEC inviata con successo al fornitore',
        icon: 'Send',
        color: 'green',
        isTerminal: true,
    },
    TEST_SENT: {
        key: 'TEST_SENT',
        label: 'Inviata (Test)',
        description: 'PEC di test inviata correttamente',
        icon: 'Send',
        color: 'green',
        isTerminal: true,
    },
    FAILED: {
        key: 'FAILED',
        label: 'Errore',
        description: 'Si è verificato un problema',
        icon: 'XCircle',
        color: 'red',
        isTerminal: true,
    },
}

// Helper functions
export function getStatusConfig(status: DisdettaStatus): StatusConfig {
    return STATUS_CONFIG[status]
}

export function getStatusIndex(status: DisdettaStatus): number {
    const index = STATUS_ORDER.indexOf(status)
    return index === -1 ? -1 : index
}

export function isStatusCompleted(currentStatus: DisdettaStatus, targetStatus: DisdettaStatus): boolean {
    // Special case: FAILED is terminal but not "completed"
    if (currentStatus === 'FAILED') return false
    if (targetStatus === 'FAILED') return false
    
    // Special case: TEST_SENT is treated as SENT
    const effectiveCurrentStatus = currentStatus === 'TEST_SENT' ? 'SENT' : currentStatus
    const effectiveTargetStatus = targetStatus === 'TEST_SENT' ? 'SENT' : targetStatus
    
    // Special case: CONFIRMED is intermediate state before SENT
    // For timeline: CONFIRMED means "in progress" towards SENT
    // So PENDING_REVIEW is completed, but SENT is not yet
    if (effectiveCurrentStatus === 'CONFIRMED') {
        if (effectiveTargetStatus === 'SENT') return false // SENT not completed yet
        if (effectiveTargetStatus === 'PENDING_REVIEW') return true // Previous steps completed
        if (effectiveTargetStatus === 'PROCESSING') return true // Previous steps completed
    }
    
    // If checking against SENT while we're at CONFIRMED, it's in progress (not completed)
    if (currentStatus === 'CONFIRMED' && targetStatus === 'SENT') return false
    
    // Normal progression check
    const currentIndex = getStatusIndex(effectiveCurrentStatus)
    const targetIndex = getStatusIndex(effectiveTargetStatus)
    
    // If either status not in order, can't compare
    if (currentIndex === -1 || targetIndex === -1) return false
    
    return currentIndex >= targetIndex
}

export function formatDuration(seconds: number | null): string {
  // Null or undefined
  if (seconds === null || seconds === undefined) return '-'
  
  // Zero or negative (shouldn't happen, but handle it)
  if (seconds <= 0) return '-'
  
  // Less than 1 minute
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  // Less than 1 hour
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    return `${mins}m`
  }
  
  // Hours and minutes
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  
  if (mins === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${mins}m`
}

export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function getRelativeTime(timestamp: string): string {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Ora'
    if (diffMins < 60) return `${diffMins} min fa`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h fa`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}g fa`
}