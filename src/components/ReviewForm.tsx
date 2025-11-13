'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// Tipi (invariati)
interface ExtractedData {
  id: number
  file_path: string
  status: string
  supplier_tax_id: string | null
  receiver_tax_id: string | null
  supplier_iban: string | null
}
interface FormData {
  supplier_tax_id: string
  receiver_tax_id: string
  supplier_iban: string
}
// Tipo per la risposta API
type ApiResponse = {
  success: boolean;
  data: ExtractedData;
  error?: string;
  details?: unknown;
}

export default function ReviewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filePath = searchParams.get('filePath')

  const [data, setData] = useState<ExtractedData | null>(null)
  const [formData, setFormData] = useState<FormData>({
    supplier_tax_id: '',
    receiver_tax_id: '',
    supplier_iban: '',
  })
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // --- Caricamento Dati (con 'catch' corretto) ---
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
        
        const result: ApiResponse = await response.json()

        if (!response.ok) {
          if (response.status === 401) throw new Error('Sessione scaduta. Effettua il login.')
          throw new Error(result.error || `Errore ${response.status}`) 
        }

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Dati non trovati nella risposta API.')
        }

        const extractedData: ExtractedData = result.data
        setData(extractedData)
        
        setFormData({
          supplier_tax_id: extractedData.supplier_tax_id || '',
          receiver_tax_id: extractedData.receiver_tax_id || '',
          supplier_iban: extractedData.supplier_iban || '',
        })

      } catch (err: unknown) { // Corretto
        if (err instanceof Error) setError(err.message)
        else setError('Si è verificato un errore sconosciuto.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [filePath])

  // --- Gestore Modifiche (Invariato) ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  // --- Gestore Invio (con 'catch' corretto) ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    if (!data) {
      setError('Dati originali non trovati. Impossibile salvare.')
      setIsSubmitting(false)
      return
    }

    try {
      // FASE 1: Conferma
      setSuccess('Salvataggio e conferma dati...')
      const confirmResponse = await fetch('/api/confirm-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: data.id,
          ...formData,
        }),
      })

      if (!confirmResponse.ok) {
         const errData = await confirmResponse.json()
         throw new Error(errData.error || 'Errore durante il salvataggio dei dati.')
      }
      
      const responseData: ApiResponse = await confirmResponse.json();
      if (!responseData.success || !responseData.data) {
        throw new Error("L'API ha restituito un errore imprevisto durante la conferma.")
      }
      const confirmedData: ExtractedData = responseData.data;
      setSuccess('Dati confermati! Avvio invio PEC...')

      // FASE 2: Innesco PEC
      const pecResponse = await fetch('/api/send-pec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: confirmedData.id,
        }),
      })

      if (!pecResponse.ok) {
        const errData = await pecResponse.json()
        throw new Error(errData.error || 'Errore during l\'avvio dell\'invio PEC.')
      }

      setSuccess('Invio PEC avviato con successo! Sarai reindirizzato.')
      
      setTimeout(() => {
        router.push('/dashboard') 
      }, 2000)

    } catch (err: unknown) { // Corretto
      if (err instanceof Error) setError(err.message)
      else setError('Si è verificato un errore sconosciuto.')
      setIsSubmitting(false) 
    }
  }

  // --- Render (Invariato) ---
  if (loading) return <div>Caricamento dati...</div>
  if (error && !data) {
     return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
        <h3 className="font-bold">Errore</h3>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ... (Campi input: P.IVA, POD, IBAN - invariati) ... */}
      <div>
        <label htmlFor="supplier_tax_id" className="block text-sm font-medium text-gray-700">
          P.IVA Fornitore (supplier_tax_id)
        </label>
        <input
          type="text" id="supplier_tax_id" name="supplier_tax_id"
          value={formData.supplier_tax_id}
          onChange={handleFormChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="receiver_tax_id" className="block text-sm font-medium text-gray-700">
          POD / PDR (receiver_tax_id)
        </label>
        <input
          type="text" id="receiver_tax_id" name="receiver_tax_id"
          value={formData.receiver_tax_id}
          onChange={handleFormChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="supplier_iban" className="block text-sm font-medium text-gray-700">
          IBAN Fornitore (supplier_iban)
        </label>
        <input
          type="text" id="supplier_iban" name="supplier_iban"
          value={formData.supplier_iban}
          onChange={handleFormChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Operazione in corso...' : 'Conferma e Invia PEC'}
        </button>
      </div>
      
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