'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation' // Importiamo useRouter

// 1. Definiamo i tipi
interface ExtractedData {
  id: number // Ci servirà l'ID per l'aggiornamento
  file_path: string
  status: string
  supplier_tax_id: string | null
  receiver_tax_id: string | null
  supplier_iban: string | null
}

// Definiamo un tipo per i dati del modulo (separato)
interface FormData {
  supplier_tax_id: string
  receiver_tax_id: string
  supplier_iban: string
}

export default function ReviewForm() {
  // Hook
  const router = useRouter() // Per reindirizzare dopo il successo
  const searchParams = useSearchParams()
  const filePath = searchParams.get('filePath')

  // 2. Stati multipli
  const [data, setData] = useState<ExtractedData | null>(null) // Dati originali dal DB
  const [formData, setFormData] = useState<FormData>({ // Dati modificabili nel modulo
    supplier_tax_id: '',
    receiver_tax_id: '',
    supplier_iban: '',
  })
  const [loading, setLoading] = useState(true) // Caricamento iniziale
  const [isSubmitting, setIsSubmitting] = useState(false) // Caricamento del salvataggio
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 3. Caricamento Dati (Come C5)
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
          { credentials: 'include' }
        )
        if (!response.ok) {
          if (response.status === 401) throw new Error('Sessione scaduta. Effettua il login.')
          throw new Error(`Errore ${response.status} nel caricare i dati.`)
        }
        const result: ExtractedData = await response.json()
        setData(result)
        // --- NOVITÀ C6 ---
        // Popoliamo il nostro modulo 'formData' con i dati caricati
        setFormData({
          supplier_tax_id: result.supplier_tax_id || '',
          receiver_tax_id: result.receiver_tax_id || '',
          supplier_iban: result.supplier_iban || '',
        })
        // --- FINE NOVITÀ ---
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message)
        else setError('Si è verificato un errore sconosciuto.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [filePath])

  // 4. Gestore Modifiche (NOVITÀ C6)
  // Questa funzione aggiorna 'formData' ogni volta che l'utente digita
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  // 5. Gestore Invio (NOVITÀ C6)
  // Questa funzione viene chiamata quando l'utente clicca "Conferma"
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault() // Impedisce il ricaricamento della pagina
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    if (!data) {
      setError('Dati originali non trovati. Impossibile salvare.')
      setIsSubmitting(false)
      return
    }

    try {
      // Chiameremo la nostra *nuova* API C6
      const response = await fetch('/api/confirm-data', {
        method: 'PATCH', // Usiamo PATCH per aggiornare
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Invia i cookie di sessione
        body: JSON.stringify({
          id: data.id, // L'ID del record da aggiornare
          ...formData, // I nuovi dati modificati
        }),
      })

      if (!response.ok) {
        if (response.status === 401) throw new Error('Sessione scaduta. Effettua il login.')
        const errData = await response.json()
        throw new Error(errData.error || 'Errore durante il salvataggio.')
      }

      setSuccess('Dati confermati e salvati con successo!')
      
      // Reindirizziamo l'utente alla dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('Si è verificato un errore sconosciuto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Gestione Stati UI ---
  if (loading) {
    return <div>Caricamento dati...</div>
  }

  // Errore grave (diverso da errore di invio)
  if (error && !data) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
        <h3 className="font-bold">Errore</h3>
        <p>{error}</p>
      </div>
    )
  }

  // --- Modulo di Revisione (MODIFICATO C6) ---
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          name="supplier_tax_id" // 'name' deve corrispondere alla chiave in 'formData'
          value={formData.supplier_tax_id} // 'value' lo collega allo stato
          onChange={handleFormChange} // 'onChange' lo rende modificabile
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
          name="receiver_tax_id"
          value={formData.receiver_tax_id}
          onChange={handleFormChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
          name="supplier_iban"
          value={formData.supplier_iban}
          onChange={handleFormChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting} // Disabilitato *solo* durante il salvataggio
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Salvataggio...' : 'Conferma e Salva Dati'}
        </button>
      </div>
      
      {/* Messaggi di feedback per l'invio */}
      {success && (
        <p className="mt-4 rounded-md bg-green-100 p-3 text-center text-sm text-green-700">
          {success}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  )
}