'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface ExtractedData {
  id: number
  file_path: string
  status: string
  supplier_tax_id: string | null
  receiver_tax_id: string | null
  supplier_iban: string | null
}

export default function ReviewForm() {
  const searchParams = useSearchParams()
  const filePath = searchParams.get('filePath')

  const [data, setData] = useState<ExtractedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!filePath) {
        setError('Percorso file mancante. Impossibile caricare i dati.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/get-extracted-data?filePath=${encodeURIComponent(filePath)}`,
          { credentials: 'include' } // Dice a fetch di inviare i cookie
        )

        // Gestione dell'errore 'Unauthorized'
        if (response.status === 401) {
          throw new Error('Unauthorized')
        }
        
        if (!response.ok) {
          // Gestione dell'errore JSON.parse (se la risposta è ok ma non è JSON)
          let errorData;
          try {
            errorData = await response.json();
          } catch (jsonError) {
             // Se il JSON.parse fallisce (es. risposta vuota da un 500)
            throw new Error(`Errore ${response.status}: Risposta server non valida.`);
          }
          throw new Error(errorData.error || `Errore ${response.status}`)
        }

        const result: ExtractedData = await response.json()
        setData(result)

      } catch (err: unknown) {
        if (err instanceof Error) {
          // Traduciamo l'errore 401 in un messaggio per l'utente
          if (err.message === 'Unauthorized') {
            setError('Sessione scaduta o non valida. Effettua nuovamente il login.')
          } else {
            setError(err.message)
          }
        } else {
          setError('Si è verificato un errore sconosciuto.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filePath])

  // --- Gestione Stati UI ---
  if (loading) {
    return <div>Caricamento dati...</div>
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
        <h3 className="font-bold">Errore</h3>
        <p>{error}</p>
      </div>
    )
  }

  if (!data) {
    return <div>Nessun dato trovato.</div>
  }

  return (
    <form className="space-y-6">
      {/* ... resto del modulo ... */}
       <div>
        <label
          htmlFor="supplier_tax_id"
          className="block text-sm font-medium text-gray-700"
        >
          P.IVA Fornitore (supplier_tax_id)
        </label>
        <input
          type="text"
          id="supplier_tax_id"
          readOnly
          defaultValue={data.supplier_tax_id || ''}
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="receiver_tax_id"
          className="block text-sm font-medium text-gray-700"
        >
          POD / PDR (receiver_tax_id)
        </label>
        <input
          type="text"
          id="receiver_tax_id"
          readOnly
          defaultValue={data.receiver_tax_id || ''}
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="supplier_iban"
          className="block text-sm font-medium text-gray-700"
        >
          IBAN Fornitore (supplier_iban)
        </label>
        <input
          type="text"
          id="supplier_iban"
          readOnly
          defaultValue={data.supplier_iban || ''}
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled // Disabilitato per ora
          className="w-full rounded-md bg-gray-400 px-4 py-2 font-semibold text-white shadow-sm"
        >
          Conferma Dati (Prossimo Step)
        </button>
      </div>
    </form>
  )
}