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
  key: DisdettaStatus
  label: string
  description: string
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
  return STATUS_CONFIG[status]
}

export function getStatusIndex(status: DisdettaStatus): number {
  const index = STATUS_ORDER.indexOf(status)
  return index === -1 ? -1 : index
}

export function isStatusCompleted(
  currentStatus: DisdettaStatus,
  targetStatus: DisdettaStatus
): boolean {
  if (currentStatus === 'FAILED' || targetStatus === 'FAILED') return false
  
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