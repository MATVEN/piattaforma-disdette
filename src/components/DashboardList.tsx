// src/components/DashboardList.tsx

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import InfiniteScrollTrigger from '@/components/InfiniteScrollTrigger'

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
  const [sendError, setSendError] = useState<string | null>(null)

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
    setSendError(null)

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

      alert('Invio PEC (simulato) avviato con successo!')
      
      // Ricarica la lista per mostrare il nuovo stato
      refresh()

    } catch (err: unknown) {
      if (err instanceof Error) setSendError(err.message)
      else setSendError('Si è verificato un errore sconosciuto.')
    } finally {
      setSendingState((prev) => ({ ...prev, [disdettaId]: false }))
    }
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
      <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
        <h3 className="font-bold">Errore</h3>
        <p>{error}</p>
      </div>
    )
  }

  // Empty state
  if (disdette.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
        <h3 className="font-semibold text-gray-800">Nessuna disdetta trovata</h3>
        <p className="text-gray-600">
          Non hai ancora avviato nessuna pratica.
        </p>
      </div>
    )
  }

  // --- RENDER LISTA CON INFINITE SCROLL ---
  return (
    <div className="space-y-4">
      {/* Header con conteggio */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          Visualizzati <span className="font-medium">{disdette.length}</span> di{' '}
          <span className="font-medium">{totalCount}</span>
        </p>
        {hasMore && (
          <p className="text-xs text-gray-500">Scorri per caricarne altre</p>
        )}
      </div>

      {/* Errore invio PEC */}
      {sendError && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {sendError}
        </div>
      )}

      {/* Lista disdette */}
      <ul role="list" className="space-y-4">
        {disdette.map((item) => {
          const isSending = sendingState[item.id] || false
          
          return (
            <li key={item.id} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between space-x-4">
                
                {/* Area Link */}
                <Link
                  href={`/review?id=${item.id}`}
                  className="group flex-1 truncate"
                >
                  <p className="truncate text-sm font-medium text-indigo-600 group-hover:underline">
                    {item.file_path.split('/').pop() || item.file_path}
                  </p>
                  <p className="text-sm text-gray-500">
                    Caricato il: {new Date(item.created_at).toLocaleDateString('it-IT')}
                  </p>
                </Link>

                {/* Area Azione/Stato */}
                <div className="flex-shrink-0">
                  <StatusBadgeAndAction
                    status={item.status}
                    isSending={isSending}
                    onSend={() => handleSendPec(item.id)}
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Infinite Scroll Trigger */}
      <InfiniteScrollTrigger
        onLoadMore={loadMore}
        enabled={hasMore}
        isLoading={isLoadingMore}
      >
        {isLoadingMore ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
            <p className="text-sm text-gray-600">Caricamento...</p>
          </div>
        ) : null}
      </InfiniteScrollTrigger>

      {/* Fine lista */}
      {!hasMore && disdette.length > 0 && (
        <div className="py-8 text-center text-sm text-gray-500">
          🎉 Hai visualizzato tutte le tue disdette
        </div>
      )}
    </div>
  )
}

// --- SKELETON LOADING ---
function SkeletonList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
            <div className="h-8 w-24 rounded-full bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

// --- STATUS BADGE COMPONENT ---
function StatusBadgeAndAction({
  status,
  isSending,
  onSend,
}: {
  status: string
  isSending: boolean
  onSend: () => void
}) {
  if (isSending) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        Invio in corso...
      </span>
    )
  }

  if (status === 'CONFIRMED') {
    return (
      <button
        onClick={onSend}
        className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
      >
        Invia Disdetta
      </button>
    )
  }
  
  if (status === 'SENT' || status === 'TEST_SENT') {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        {status === 'TEST_SENT' ? 'Inviato (Test)' : 'Inviato'}
      </span>
    )
  }

  if (status === 'PENDING_REVIEW') {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
        In Revisione
      </span>
    )
  }
  
  if (status === 'FAILED') {
     return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        Fallito
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      {status}
    </span>
  )
}