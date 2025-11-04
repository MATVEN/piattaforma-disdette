'use client' // Componente Client Obbligatorio!

import { useEffect, useState } from 'react'
import Link from 'next/link' // Per rendere cliccabili le righe

// Definiamo il tipo per i dati (è un array di questo)
interface DisdettaData {
  id: number
  created_at: string
  file_path: string
  status: 'PENDING_REVIEW' | 'CONFIRMED' | string // Aggiungiamo 'string' per flessibilità
  supplier_tax_id: string | null
  receiver_tax_id: string | null
  supplier_iban: string | null
}

export default function DashboardList() {
  // Stati per i dati, caricamento e errori
  const [disdette, setDisdette] = useState<DisdettaData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDisdette() {
      try {
        setLoading(true)
        setError(null)

        // Chiamiamo la nostra NUOVA API C7
        const response = await fetch('/api/get-my-disdette', {
          credentials: 'include', // FONDAMENTALE per inviare i cookie
        })

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Sessione scaduta o non valida. Effettua nuovamente il login.')
          }
          throw new Error(`Errore ${response.status} nel caricare i dati.`)
        }

        const data: DisdettaData[] = await response.json()
        setDisdette(data)
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message)
        else setError('Si è verificato un errore sconosciuto.')
      } finally {
        setLoading(false)
      }
    }

    fetchDisdette()
  }, []) // Esegui solo una volta al caricamento

  // --- Gestione Stati UI ---

  // Questo stato di caricamento viene gestito da Suspense,
  // ma lo teniamo per sicurezza.
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
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
        <h3 className="font-semibold text-gray-800">Nessuna disdetta trovata</h3>
        <p className="text-gray-600">
          Non hai ancora avviato nessuna pratica.
        </p>
      </div>
    )
  }

  // --- Render della Lista ---
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {disdette.map((item) => (
          <li key={item.id} className="mb-4">
            {/* L'intero blocco è un link */}
            <Link
              href={`/review?filePath=${encodeURIComponent(item.file_path)}`}
              className="group block rounded-lg border bg-white p-4 shadow-sm transition-all hover:border-indigo-500 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="truncate text-sm font-medium text-indigo-600">
                    {/* Estraiamo solo il nome del file dal path completo */}
                    {item.file_path.split('/').pop() || item.file_path}
                  </p>
                  <p className="text-sm text-gray-500">
                    Caricato il: {new Date(item.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
                {/* Badge per lo stato */}
                <StatusBadge status={item.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Componente helper per mostrare un "badge" colorato per lo stato
function StatusBadge({ status }: { status: string }) {
  if (status === 'CONFIRMED') {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
        Confermato
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

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      {status}
    </span>
  )
}