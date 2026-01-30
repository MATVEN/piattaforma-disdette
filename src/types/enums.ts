// src/types/enums.ts
import type { Database } from '@/lib/supabase/database.types'

/* ENUM Types */
export type DisdettaStatus = Database['public']['Enums']['disdetta_status']
export type PaymentStatus = Database['public']['Enums']['payment_status']

/* Costanti */
export const TIPO_INTESTATARIO = {
  PRIVATO: 'privato',
  AZIENDA: 'azienda',
} as const

export type TipoIntestatario = typeof TIPO_INTESTATARIO[keyof typeof TIPO_INTESTATARIO]

export const RICHIEDENTE_RUOLO = {
  LEGALE_RAPPRESENTANTE: 'legale_rappresentante',
  DELEGATO: 'delegato',
} as const

export type RichiedenteRuolo = typeof RICHIEDENTE_RUOLO[keyof typeof RICHIEDENTE_RUOLO]

export const DISDETTA_STATUS = {
  PROCESSING: 'PROCESSING',
  PENDING_REVIEW: 'PENDING_REVIEW',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  SENT: 'SENT',
  FAILED: 'FAILED',
  FOLLOWUP_1: 'FOLLOWUP_1',
  FOLLOWUP_2: 'FOLLOWUP_2',
} as const

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const satisfies Record<string, PaymentStatus>

/* Status Configuration */
export interface StatusConfig {
  key?: DisdettaStatus
  label: string
  description?: string
  icon: string
  color: string
  isTerminal: boolean
}

export const STATUS_CONFIG: Record<DisdettaStatus, StatusConfig> = {
  PROCESSING: {
    key: 'PROCESSING',
    label: 'Caricamento',
    description: 'Documento caricato, OCR in corso',
    icon: 'Upload',
    color: 'blue',
    isTerminal: false,
  },
  PENDING_REVIEW: {
    key: 'PENDING_REVIEW',
    label: 'Revisione',
    description: 'Controlla i dati estratti',
    icon: 'FileCheck',
    color: 'yellow',
    isTerminal: false,
  },
  PENDING_PAYMENT: {
    key: 'PENDING_PAYMENT',
    label: 'Pagamento',
    description: 'In attesa di pagamento',
    icon: 'CreditCard',
    color: 'purple',
    isTerminal: false,
  },
  CONFIRMED: {
    key: 'CONFIRMED',
    label: 'Confermata',
    description: 'Pagamento completato, in coda per invio',
    icon: 'CheckCircle2',
    color: 'primary',
    isTerminal: false,
  },
  SENT: {
    key: 'SENT',
    label: 'Inviata',
    description: 'PEC inviata al fornitore',
    icon: 'Send',
    color: 'green',
    isTerminal: true,
  },
  FOLLOWUP_1: {
    key: 'FOLLOWUP_1',
    label: 'Sollecito 1/2',
    description: 'Primo sollecito inviato',
    icon: 'AlertCircle',
    color: 'orange',
    isTerminal: false,
  },
  FOLLOWUP_2: {
    key: 'FOLLOWUP_2',
    label: 'Sollecito 2/2',
    description: 'Secondo sollecito inviato',
    icon: 'AlertTriangle',
    color: 'red',
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

export const STATUS_ORDER: DisdettaStatus[] = [
  'PENDING_REVIEW',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'SENT',
]

/* Labels */
export const DISDETTA_STATUS_LABELS: Record<DisdettaStatus, string> = {
  PROCESSING: 'Caricamento',
  PENDING_REVIEW: 'In revisione',
  PENDING_PAYMENT: 'Pagamento richiesto',
  CONFIRMED: 'Confermata',
  SENT: 'Inviata',
  FOLLOWUP_1: 'Sollecito 1/2',
  FOLLOWUP_2: 'Sollecito 2/2',
  FAILED: 'Fallita',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'In attesa',
  PROCESSING: 'In elaborazione',
  PAID: 'Pagato',
  FAILED: 'Fallito',
  REFUNDED: 'Rimborsato',
}

/* Colori UI */
export const DISDETTA_STATUS_COLORS: Record<DisdettaStatus, {
  bg: string
  text: string
  badge: string
}> = {
  PROCESSING: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    badge: 'bg-blue-500',
  },
  PENDING_REVIEW: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    badge: 'bg-yellow-500',
  },
  PENDING_PAYMENT: {
    bg: 'bg-secondary-100',
    text: 'text-secondary-800',
    badge: 'bg-secondary-500',
  },
  CONFIRMED: {
    bg: 'bg-primary-100',
    text: 'text-primary-800',
    badge: 'bg-primary-500',
  },
  SENT: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    badge: 'bg-green-500',
  },
  FOLLOWUP_1: {
    bg: 'bg-amber-100',
    text: 'text-orange-800',
    badge: 'bg-orange-500',
  },
  FOLLOWUP_2: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    badge: 'bg-red-500',
  },
  FAILED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    badge: 'bg-red-500',
  },
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, {
  bg: string
  text: string
  badge: string
}> = {
  PENDING: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    badge: 'bg-yellow-500',
  },
  PROCESSING: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    badge: 'bg-blue-500',
  },
  PAID: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    badge: 'bg-green-500',
  },
  FAILED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    badge: 'bg-red-500',
  },
  REFUNDED: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    badge: 'bg-orange-500',
  },
}

/* Helper Functions */
export function getStatusConfig(status: DisdettaStatus): StatusConfig {
  const config = STATUS_CONFIG[status]

  // ✅ Fallback + debug log
  if (!config) {
    console.error(`Missing config for status: ${status}`, {
      availableStatuses: Object.keys(STATUS_CONFIG)
    })
    return STATUS_CONFIG.PROCESSING
  }
  return config
}

export function getStatusIndex(status: DisdettaStatus): number {
  const index = STATUS_ORDER.indexOf(status)
  return index === -1 ? -1 : index
}

/**
* Get dynamic note for status based on followup state
*/
export function getStatusNote(
  status: DisdettaStatus,
  sentTimestamp?: string | null,
  followup1Timestamp?: string | null
): string | null {
  if (!sentTimestamp) return null
  const now = new Date()
  switch (status) {
    case DISDETTA_STATUS.SENT: {
      const sentDate = new Date(sentTimestamp)
      const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.max(0, 14 - daysSinceSent)
      if (daysRemaining > 0) {
        return `Tra ${daysRemaining} giorni potrai inviare un sollecito in caso di mancato riscontro dal fornitore.`
      } else {
        return 'Puoi inviare un sollecito in caso di mancato riscontro dal fornitore.'
      }
    }
    case DISDETTA_STATUS.FOLLOWUP_1: {
      if (!followup1Timestamp) return null
      const followup1Date = new Date(followup1Timestamp)
      const daysSinceFollowup = Math.floor((now.getTime() - followup1Date.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.max(0, 15 - daysSinceFollowup)
      if (daysRemaining > 0) {
        return `Primo sollecito inviato. Hai un secondo sollecito disponibile tra ${daysRemaining} giorni.`
      } else {
        return 'Primo sollecito inviato. Hai un secondo sollecito disponibile ora.'
      }
    }
    case DISDETTA_STATUS.FOLLOWUP_2: {
      return 'Secondo sollecito inviato. Limite raggiunto. Per ulteriore assistenza contatta il supporto.'
    }
    default: return null
  }
}

export function isStatusCompleted(
  currentStatus: DisdettaStatus,
  targetStatus: DisdettaStatus
): boolean {
  if (currentStatus === 'FAILED' || targetStatus === 'FAILED') return false

  if (currentStatus === 'FOLLOWUP_1' || currentStatus === 'FOLLOWUP_2') {
    return true  // Tutti gli step sono completati
  }
  
  const currentIndex = getStatusIndex(currentStatus)
  const targetIndex = getStatusIndex(targetStatus)
  if (currentIndex === -1 || targetIndex === -1) return false
  return currentIndex >= targetIndex
}

export function getStatusProgress(status: DisdettaStatus): number {
  const progressMap: Record<DisdettaStatus, number> = {
    PROCESSING: 20,
    PENDING_REVIEW: 40,
    PENDING_PAYMENT: 60,
    CONFIRMED: 70,
    SENT: 100,
    FOLLOWUP_1: 100,
    FOLLOWUP_2: 100,
    FAILED: 0,
  }

  return progressMap[status] || 0
}

export function isFinalStatus(status: DisdettaStatus): boolean {
  return STATUS_CONFIG[status].isTerminal
}

export function isPaymentComplete(status: PaymentStatus | null): boolean {
  return status === PAYMENT_STATUS.PAID
}

export function getValidNextStatuses(currentStatus: DisdettaStatus): DisdettaStatus[] {
  switch (currentStatus) {
    case DISDETTA_STATUS.PROCESSING:
      return [DISDETTA_STATUS.PENDING_REVIEW, DISDETTA_STATUS.FAILED]
    case DISDETTA_STATUS.PENDING_REVIEW:
      return [DISDETTA_STATUS.PENDING_PAYMENT, DISDETTA_STATUS.FAILED]
    case DISDETTA_STATUS.PENDING_PAYMENT:
      return [DISDETTA_STATUS.CONFIRMED, DISDETTA_STATUS.FAILED]
    case DISDETTA_STATUS.CONFIRMED:
      return [DISDETTA_STATUS.SENT, DISDETTA_STATUS.FAILED]
    case DISDETTA_STATUS.SENT:
      return [DISDETTA_STATUS.FOLLOWUP_1]
    case DISDETTA_STATUS.FOLLOWUP_1:
      return [DISDETTA_STATUS.FOLLOWUP_2]
    case DISDETTA_STATUS.FOLLOWUP_2:
    case DISDETTA_STATUS.FAILED:
      return []
    default:
      return []
  }
}

/* Format Helpers */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined || seconds <= 0) return '-'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    return `${mins}m`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (mins === 0) return `${hours}h`
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