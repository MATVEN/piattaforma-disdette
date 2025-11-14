'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
// --- 1. IMPORT C13 ---
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reviewFormSchema, type ReviewFormData } from '@/domain/schemas'

// Tipi
interface ExtractedData {
  id: number
  file_path: string
  status: string
  supplier_tax_id: string | null
  receiver_tax_id: string | null
  supplier_iban: string | null
}
type ApiResponse = {
  success: boolean;
  data: ExtractedData;
  error?: string;
}

export default function ReviewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filePath = searchParams.get('filePath')

  // --- 2. STATI RIDOTTI (C13) ---
  // Manteniamo 'data' per l'ID e 'loading' per il fetch iniziale
  const [data, setData] = useState<ExtractedData | null>(null)
  const [loading, setLoading] = useState(true)
  // Stati per errori/successo dell'API
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiSuccess, setApiSuccess] = useState<string | null>(null)

  // --- 3. SETUP REACT-HOOK-FORM (C13) ---
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }, // Gestisce stato e errori Zod
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema), // Collega Zod
    defaultValues: {
      supplier_tax_id: '',
      receiver_tax_id: '',
      supplier_iban: '',
      delegaCheckbox: false,
    }
  })

  // --- Caricamento Dati (Aggiornato C13) ---
  useEffect(() => {
    async function fetchData() {
      if (!filePath) {
        setApiError('Percorso file mancante. Impossibile caricare i dati.')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setApiError(null)
        const response = await fetch(
          `/api/get-extracted-data?filePath=${encodeURIComponent(filePath)}`,
          { credentials: 'include' }
        )
        
        const result: ApiResponse = await response.json()
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error || `Errore ${response.status}`) 
        }

        const extractedData: ExtractedData = result.data
        setData(extractedData) // Salviamo i dati originali (ci serve l'ID)
        
        // Popoliamo il form RHF con i dati caricati
        reset({
          supplier_tax_id: extractedData.supplier_tax_id || '',
          receiver_tax_id: extractedData.receiver_tax_id || '',
          supplier_iban: extractedData.supplier_iban || '',
          delegaCheckbox: false, // Il checkbox parte sempre da 'false'
        })

      } catch (err: unknown) {
        if (err instanceof Error) setApiError(err.message)
        else setApiError('Si è verificato un errore sconosciuto.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [filePath, reset])

  // --- 4. GESTORE INVIO (Aggiornato C13) ---
  // RHF garantisce che 'formData' sia valido (secondo 'reviewFormSchema')
  const onSubmit: SubmitHandler<ReviewFormData> = async (formData) => {
    setApiError(null)
    setApiSuccess(null)

    if (!data) {
      setApiError('Dati originali non trovati. Impossibile salvare.')
      return
    }

    try {
      // --- FASE 1: Conferma Dati (C6) ---
      setApiSuccess('Salvataggio e conferma dati...')
      
      const confirmPayload = {
        id: data.id,
        supplier_tax_id: formData.supplier_tax_id,
        receiver_tax_id: formData.receiver_tax_id,
        supplier_iban: formData.supplier_iban,
      }

      const confirmResponse = await fetch('/api/confirm-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(confirmPayload),
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
      setApiSuccess('Dati confermati! Avvio invio PEC...')

      // --- FASE 2: Innesco Invio PEC (C8) ---
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
        throw new Error(errData.error || 'Errore durante l\'avvio dell\'invio PEC.')
      }

      setApiSuccess('Invio PEC avviato con successo! Sarai reindirizzato.')
      
      setTimeout(() => {
        router.push('/dashboard') 
      }, 2000)

    } catch (err: unknown) {
      if (err instanceof Error) setApiError(err.message)
      else setApiError('Si è verificato un errore sconosciuto.')
    }
  }

  // --- Render ---
  if (loading) return <div>Caricamento dati...</div>
  if (apiError && !data) {
     return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
        <h3 className="font-bold">Errore</h3>
        <p>{apiError}</p>
      </div>
    )
  }

  // --- 5. RENDER FORM (Aggiornato C13) ---
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campi input (ora usano RHF e Zod) */}
      <div>
        <label htmlFor="supplier_tax_id" className="block text-sm font-medium text-gray-700">
          P.IVA Fornitore (supplier_tax_id)
        </label>
        <input
          type="text" id="supplier_tax_id"
          {...register("supplier_tax_id")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="receiver_tax_id" className="block text-sm font-medium text-gray-700">
          POD / PDR (receiver_tax_id)
        </label>
        <input
          type="text" id="receiver_tax_id"
          {...register("receiver_tax_id")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="supplier_iban" className="block text-sm font-medium text-gray-700">
          IBAN Fornitore (supplier_iban)
        </label>
        <input
          type="text" id="supplier_iban"
          {...register("supplier_iban")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      
      {/* --- NUOVO CHECKBOX DELEGA (C13) --- */}
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            id="delegaCheckbox"
            type="checkbox"
            {...register("delegaCheckbox")}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
        </div>
        <div className="ml-3 text-sm leading-6">
          <label htmlFor="delegaCheckbox" className="font-medium text-gray-900">
            Delega e Autorizzazione
          </label>
          <p className="text-gray-500">
            Cliccando, confermo i dati e conferisco delega formale a
            [Nome Piattaforma] per inviare la PEC a mio nome.
          </p>
          {/* Mostra errore Zod per il checkbox */}
          {errors.delegaCheckbox && (
            <p className="mt-1 text-sm text-red-600">
              {errors.delegaCheckbox.message}
            </p>
          )}
        </div>
      </div>
      
      {/* --- Pulsante (ora usa 'isSubmitting' di RHF) --- */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Operazione in corso...' : 'Conferma e Invia PEC'}
        </button>
      </div>
      
      {/* Messaggi di feedback API */}
      {apiSuccess && (
        <p className="mt-4 rounded-md bg-green-100 p-3 text-center text-sm text-green-700">
          {apiSuccess}
        </p>
      )}
      {apiError && (
        <p className="mt-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
          {apiError}
        </p>
      )}
    </form>
  )
}