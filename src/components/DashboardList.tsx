// src/components/DashboardList.tsx

'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import InfiniteScrollTrigger from '@/components/InfiniteScrollTrigger'
import { motion, AnimatePresence } from 'framer-motion'
import { showSuccess, showError } from '@/lib/toast'
import { StatusTimeline } from '@/components/StatusTimeline'
import { StatusTimelineExpanded } from '@/components/StatusTimelineExpanded'
import type { StatusTimelineData } from '@/types/statusHistory'
import {
  FileText,
  Calendar,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

// --- Tipi ---
interface DisdettaData {
  id: number
  created_at: string
  file_path: string
  status: 'PROCESSING' | 'PENDING_REVIEW' | 'CONFIRMED' | 'SENT' | 'TEST_SENT' | 'FAILED' | string 
  supplier_tax_id: string | null
  receiver_tax_id: string | null
  supplier_iban: string | null
}

export default function DashboardList() {
  // Stato per l'invio PEC
  const [sendingState, setSendingState] = useState<Record<number, boolean>>({})

  // Stato per timeline expansion e history data
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [historyData, setHistoryData] = useState<Record<number, StatusTimelineData>>({})
  const [loadingHistory, setLoadingHistory] = useState<Record<number, boolean>>({})

  // --- FUNZIONE FETCH per l'infinite scroll ---
  const fetchDisdette = useCallback(async (page: number, pageSize: number) => {
    const response = await fetch(
      `/api/get-my-disdette?page=${page}&pageSize=${pageSize}`,
      { credentials: 'include' }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sessione scaduta o non valida. Effettua nuovamente il login.')
      }
      throw new Error(`Errore ${response.status} nel caricare i dati.`)
    }

    const result = await response.json()
    return {
      data: result.data || [],
      count: result.count || 0,
      hasMore: result.hasMore || false,
    }
  }, [])

  // --- USO DELL'HOOK INFINITE SCROLL ---
  const {
    items: disdette,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    totalCount,
    loadMore,
    refresh,
  } = useInfiniteScroll<DisdettaData>({
    fetchFunction: fetchDisdette,
    pageSize: 10,
  })

  // --- FUNZIONE INVIO PEC ---
  const handleSendPec = async (disdettaId: number) => {
    setSendingState((prev) => ({ ...prev, [disdettaId]: true }))

    try {
      const response = await fetch('/api/send-pec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: disdettaId }),
      })

      const resData = await response.json()

      if (!response.ok) {
        throw new Error(resData.error || 'Invio fallito')
      }

      // Success toast
      showSuccess('PEC inviata con successo! 🎉')

      // Ricarica la lista per mostrare il nuovo stato
      refresh()

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto.'
      showError(errorMsg)
    } finally {
      setSendingState((prev) => ({ ...prev, [disdettaId]: false }))
    }
  }

  // --- FUNZIONE FETCH HISTORY ---
  const fetchHistory = async (disdettaId: number) => {
    // Skip if already loaded
    if (historyData[disdettaId]) return

    setLoadingHistory(prev => ({ ...prev, [disdettaId]: true }))

    try {
      const response = await fetch(`/api/get-status-history?id=${disdettaId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }

      const data: StatusTimelineData = await response.json()
      setHistoryData(prev => ({ ...prev, [disdettaId]: data }))
    } catch (error) {
      console.error('Error fetching history:', error)
      showError('Impossibile caricare la cronologia')
    } finally {
      setLoadingHistory(prev => ({ ...prev, [disdettaId]: false }))
    }
  }

  // --- FUNZIONE TOGGLE EXPAND ---
  const toggleExpand = (disdettaId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(disdettaId)) {
        newSet.delete(disdettaId)
      } else {
        newSet.add(disdettaId)
        // Fetch history when expanding
        fetchHistory(disdettaId)
      }
      return newSet
    })
  }

  // Carica la prima pagina al mount
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- GESTIONE STATI UI ---
  
  // Loading iniziale
  if (isLoading) {
    return <SkeletonList />
  }

  // Errore
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-danger-200 bg-danger-50 p-6"
      >
        <div className="flex items-start space-x-3">
          <XCircle className="h-6 w-6 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-danger-900">Errore</h3>
            <p className="text-sm text-danger-700 mt-1">{error}</p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Empty state
  if (disdette.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna disdetta</h3>
        <p className="text-gray-600 mb-6">
          Non hai ancora avviato nessuna pratica di disdetta.
        </p>
        <Link
          href="/new-disdetta"
          className="inline-flex items-center space-x-2 rounded-lg bg-gradient-primary px-6 py-3 text-sm font-medium text-white shadow-glass transition-all hover:shadow-glass-hover hover:scale-105"
        >
          <Sparkles className="h-4 w-4" />
          <span>Crea la tua prima disdetta</span>
        </Link>
      </motion.div>
    )
  }

  // --- RENDER LISTA CON INFINITE SCROLL ---
  return (
    <div id="disdette-list" className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header con conteggio */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="h-10 w-1 bg-gradient-primary rounded-full" />
          <div>
            <p className="text-sm text-gray-500">Le tue pratiche</p>
            <p className="font-semibold text-gray-900">
              <span className="text-primary-600">{disdette.length}</span> di{' '}
              <span className="text-gray-600">{totalCount}</span>
            </p>
          </div>
        </div>
        {hasMore && (
          <p className="text-xs text-gray-500 hidden sm:flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Scorri per caricarne altre</span>
          </p>
        )}
      </motion.div>

      {/* Lista disdette */}
      <div className="flex flex-col gap-4 w-full max-w-full">
        {disdette.map((item) => {
          const isSending = sendingState[item.id] || false

          return (
            <DisdettaCard
              key={item.id}
              item={item}
              isSending={isSending}
              onSend={() => handleSendPec(item.id)}
              expanded={expandedCards.has(item.id)}
              onToggleExpand={() => toggleExpand(item.id)}
              historyData={historyData[item.id]}
              loadingHistory={loadingHistory[item.id] || false}
            />
          )
        })}
      </div>

      {/* Infinite Scroll Trigger */}
      <InfiniteScrollTrigger
        onLoadMore={loadMore}
        enabled={hasMore}
        isLoading={isLoadingMore}
      >
        {isLoadingMore ? (
          <div className="flex flex-col items-center space-y-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-sm text-gray-600">Caricamento...</p>
          </div>
        ) : null}
      </InfiniteScrollTrigger>

      {/* Fine lista */}
      {!hasMore && disdette.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8 text-center"
        >
          <div className="inline-flex items-center space-x-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Hai visualizzato tutte le tue disdette</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// === DISDETTA CARD COMPONENT ===
function DisdettaCard({
  item,
  isSending,
  onSend,
  expanded,
  onToggleExpand,
  historyData,
  loadingHistory,
}: {
  item: DisdettaData
  isSending: boolean
  onSend: () => void
  expanded: boolean
  onToggleExpand: () => void
  historyData: StatusTimelineData | undefined
  loadingHistory: boolean
}) {
  const fileName = item.file_path.split('/').pop() || 'Documento'
  const date = new Date(item.created_at).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="group relative w-full max-w-full rounded-xl border border-gray-200 bg-white shadow-card transition-all hover:shadow-card-hover hover:border-primary-200 overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />

      <div className="p-3 sm:p-5 w-full max-w-full">
        {/* Layout mobile: stack verticale, desktop: orizzontale */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 w-full max-w-full">
          {/* Left side - Info */}
          <Link href={`/review?id=${item.id}`} className="flex-1 min-w-0 max-w-full">
            <div className="flex items-start gap-2 min-w-0 max-w-full overflow-hidden">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>

              <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                <h3 className="font-semibold text-gray-900 break-words sm:truncate group-hover:text-primary-600 transition-colors max-w-full">
                  {fileName}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 overflow-hidden">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{date}</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Right side - Status & Action */}
          <div className="flex-shrink-0 w-full sm:w-auto max-w-full">
            <StatusBadgeAndAction
              status={item.status}
              isSending={isSending}
              onSend={onSend}
            />
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="px-3 sm:px-5 pb-3 sm:pb-5">
        {/* Compact Timeline (always visible) */}
        <StatusTimeline
          currentStatus={item.status as any}
          history={historyData?.history || []}
          compact
        />

        {/* Expand/Collapse Button */}
        <button
          onClick={onToggleExpand}
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              <span>Nascondi dettagli</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              <span>Mostra cronologia completa</span>
            </>
          )}
        </button>

        {/* Expanded Detail View */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    <span className="ml-2 text-sm text-gray-600">Caricamento cronologia...</span>
                  </div>
                ) : historyData ? (
                  <StatusTimelineExpanded timeline={historyData} />
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nessuna cronologia disponibile
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// === SKELETON LOADING ===
function SkeletonList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-100" />
              </div>
            </div>
            <div className="h-8 w-24 rounded-full bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

// === STATUS BADGE COMPONENT ===
function StatusBadgeAndAction({
  status,
  isSending,
  onSend,
}: {
  status: string
  isSending: boolean
  onSend: () => void
}) {
  // Stili condivisi per evitare overflow
  const badgeClass = "flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap w-full sm:w-auto max-w-full";
  const buttonClass = "flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap w-full sm:w-auto max-w-full";

  // ✅ Sending state
  if (isSending) {
    return (
      <div className={`${badgeClass} bg-primary-50 text-primary-700`}>
        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
        <span className="hidden sm:inline">Invio in corso...</span>
      </div>
    )
  }

  // ✅ FAILED - RETRY BUTTON (NEW!)
  if (status === 'FAILED') {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
        {/* Error Badge */}
        <div className={`${badgeClass} bg-danger-50 text-danger-700`}>
          <XCircle className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">Errore invio</span>
        </div>
        
        {/* Retry Button */}
        <button
          onClick={onSend}
          className={`${buttonClass} bg-gradient-primary text-white shadow-glass transition-all hover:shadow-glass-hover hover:scale-105 active:scale-95`}
          title="Riprova invio PEC"
        >
          <Send className="h-4 w-4 flex-shrink-0" />
          <span>Riprova</span>
        </button>
      </div>
    )
  }

  // ✅ CONFIRMED - IN SENDING (intermediate state)
  if (status === 'CONFIRMED') {
    return (
      <div className={`${badgeClass} bg-indigo-50 text-indigo-700`}>
        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
        <span>In invio...</span>
      </div>
    )
  }
  
  // ✅ SENT - SUCCESS BADGE
  if (status === 'SENT' || status === 'TEST_SENT') {
    return (
      <div className={`${badgeClass} bg-success-50 text-success-700`}>
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        <span className="hidden sm:inline">
          {status === 'TEST_SENT' ? 'Test inviata' : 'PEC inviata'}
        </span>
      </div>
    )
  }

  // ✅ PENDING_REVIEW - WARNING BADGE
  if (status === 'PENDING_REVIEW') {
    return (
      <div className={`${badgeClass} bg-warning-50 text-warning-700`}>
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span className="hidden sm:inline">In revisione</span>
      </div>
    )
  }

  // ✅ PROCESSING - LOADING BADGE
  if (status === 'PROCESSING') {
    return (
      <div className={`${badgeClass} bg-primary-50 text-primary-700`}>
        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
        <span className="hidden sm:inline">Elaborazione...</span>
      </div>
    )
  }

  // ✅ UNKNOWN STATUS - FALLBACK
  return (
    <div className={`${badgeClass} bg-gray-100 text-gray-600`}>
      <span className="truncate max-w-[120px]">{status}</span>
    </div>
  )
}