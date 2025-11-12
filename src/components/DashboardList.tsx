// src/app/components/DashboardList.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Definiamo il tipo per i dati
interface DisdettaData {
  id: number
  created_at: string
  file_path: string
  // Aggiungiamo i nuovi stati dall'audit C11/C12
  status: 'PENDING_REVIEW' | 'CONFIRMED' | 'SENT' | 'TEST_SENT' | 'FAILED' | string 
  supplier_tax_id: string | null // Questi non sono usati qui, ma il tipo è corretto
  receiver_tax_id: string | null
  supplier_iban: string | null
}

export default function DashboardList() {
  const [disdette, setDisdette] = useState<DisdettaData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // --- STATO PER L'INVIO (NOVITÀ C8/C12) ---
  // Usiamo una Mappa per tracciare lo stato di invio per *ogni* riga
  const [sendingState, setSendingState] = useState<Record<number, boolean>>({})

  // --- Funzione di Fetch (invariata, ma la useremo di nuovo) ---
  const fetchDisdette = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/get-my-disdetta', {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessione scaduta o non valida. Effettua nuovamente il login.')
        }
        // Usiamo l'API 'least-privilege' (C11), quindi il tipo di 'data' è corretto
        throw new Error(`Errore ${response.status} nel caricare i dati.`)
      }

      // L'API ora restituisce solo i campi che ci servono (C11)
      const data: DisdettaData[] = await response.json()
      setDisdette(data)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('Si è verificato un errore sconosciuto.')
    } finally {
      setLoading(false)
    }
  }
  
  // --- useEffect (invariato) ---
  useEffect(() => {
    fetchDisdette()
  }, []) // Esegui solo una volta al caricamento

  
  // --- FUNZIONE DI INVIO (NOVITÀ C8/C12) ---
  const handleSendPec = async (disdettaId: number) => {
    // 1. Blocca il pulsante per questo ID
    setSendingState((prev) => ({ ...prev, [disdettaId]: true }))
    setError(null) // Resetta errori vecchi

    try {
      // 2. Chiamiamo l'API 'send-pec' (C8)
      const response = await fetch('/api/send-pec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: disdettaId }),
      })

      const resData = await response.json() // Leggiamo la risposta

      if (!response.ok) {
        // Usiamo il messaggio di errore sicuro dell'API (es. "Stato non valido")
        throw new Error(resData.error || 'Invio fallito')
      }

      // 3. Successo! Aggiorniamo la lista per mostrare il nuovo stato
      alert('Invio PEC (simulato) avviato con successo!')
      
      // Ricarichiamo la lista per mostrare il nuovo stato 'TEST_SENT'
      // (lo facciamo subito invece di aspettare)
      fetchDisdette()

    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('Si è verificato un errore sconosciuto.')
    } finally {
      // 4. Sblocca il pulsante (non più necessario se la lista si ricarica)
      setSendingState((prev) => ({ ...prev, [disdettaId]: false }))
    }
  }

  // --- Gestione Stati UI (invariato) ---
  if (loading) {
    return null // Suspense mostrerà lo scheletro
  }
  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
        <h3 className="font-bold">Errore</h3>
        <p>{error}</p>
      </div>
    )
  }
  if (disdette.length === 0) {
    // ... (stato 'empty' invariato) ...
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
        <h3 className="font-semibold text-gray-800">Nessuna disdetta trovata</h3>
        <p className="text-gray-600">
          Non hai ancora avviato nessuna pratica.
        </p>
      </div>
    )
  }

  // --- Render della Lista (MODIFICATO C12) ---
  return (
    <div className="flow-root">
      <ul role="list" className="space-y-4"> {/* Aggiunto space-y per coerenza */}
        {disdette.map((item) => {
          // Controlliamo lo stato di invio per questo specifico item
          const isSending = sendingState[item.id] || false
          
          return (
            <li key={item.id} className="rounded-lg border bg-white p-4 shadow-sm">
              {/* Il layout ora usa Flexbox per separare Link e Azione */}
              <div className="flex items-center justify-between space-x-4">
                
                {/* 1. Area Link (per info) */}
                <Link
                  href={`/review?filePath=${encodeURIComponent(item.file_path)}`}
                  className="group flex-1 truncate" // flex-1 = occupa lo spazio
                >
                  <p className="truncate text-sm font-medium text-indigo-600 group-hover:underline">
                    {item.file_path.split('/').pop() || item.file_path}
                  </p>
                  <p className="text-sm text-gray-500">
                    Caricato il: {new Date(item.created_at).toLocaleDateString('it-IT')}
                  </p>
                </Link>

                {/* 2. Area Azione/Stato (flex-shrink-0 = non restringere) */}
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
    </div>
  )
}

// --- NUOVO Componente helper (C12) ---
// Questo sostituisce il vecchio 'StatusBadge'
function StatusBadgeAndAction({
  status,
  isSending,
  onSend,
}: {
  status: string
  isSending: boolean
  onSend: () => void
}) {
  // Caso 1: Invio in corso
  if (isSending) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        Invio in corso...
      </span>
    )
  }

  // Caso 2: Pronto per l'invio (Bottone)
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
  
  // Caso 3: Inviato (Test o Reale)
  if (status === 'SENT' || status === 'TEST_SENT') {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        {status === 'TEST_SENT' ? 'Inviato (Test)' : 'Inviato'}
      </span>
    )
  }

  // Caso 4: In revisione
  if (status === 'PENDING_REVIEW') {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
        In Revisione
      </span>
    )
  }
  
  // Caso 5: Fallito (dall'audit C11)
  if (status === 'FAILED') {
     return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        Fallito
      </span>
    )
  }

  // Caso 6: Altro stato (fallback)
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      {status}
    </span>
  )
}