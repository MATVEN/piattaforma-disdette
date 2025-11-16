'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reviewFormSchema, type ReviewFormData } from '@/domain/schemas'

// --- Tipi ---
interface ExtractedData {
  id: number
  file_path: string
  status: 'PROCESSING' | 'PENDING_REVIEW' | 'CONFIRMED' | 'SENT' | 'TEST_SENT' | 'FAILED' | string
  supplier_tax_id: string | null
  receiver_tax_id: string | null
  supplier_iban: string | null
  error_message: string | null
}
type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

// Helper
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const safeJson = async <T,>(res: Response): Promise<T | undefined> => {
  try { return (await res.json()) as T } catch { return undefined }
}

// UI stato
function StatusDisplay({ message, isError }: { message: string; isError: boolean }) {
  if (isError) {
    return (
      <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
        <h3 className="font-bold">Errore</h3>
        <p>{message}</p>
      </div>
    )
  }
  return <div className="p-8 text-center text-lg text-gray-700">{message}</div>
}

export default function ReviewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [data, setData] = useState<ExtractedData | null>(null)
  const [currentStatus, setCurrentStatus] = useState<'LOADING' | 'PROCESSING' | 'FAILED' | 'SUCCESS'>('LOADING')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [apiSuccess, setApiSuccess] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const redirectRef = useRef<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      supplier_tax_id: '',
      receiver_tax_id: '',
      supplier_iban: '',
      delegaCheckbox: false,
    },
  })

  // Cleanup redirect timeout
  useEffect(() => () => { if (redirectRef.current) clearTimeout(redirectRef.current) }, [])

  // Caricamento + polling robusto
  useEffect(() => {
    if (!id) {
      setErrorMessage('ID mancante. Impossibile caricare i dati.')
      setCurrentStatus('FAILED')
      return
    }

    let attempts = 0
    const maxAttempts = 20
    const ac = new AbortController()
    let visible = true

    const onVisibility = () => { visible = document.visibilityState === 'visible' }
    document.addEventListener('visibilitychange', onVisibility)

    const fetchOnce = async () => {
      try {
        const res = await fetch(
          `/api/get-extracted-data?id=${id}`,
          { credentials: 'include', signal: ac.signal, headers: { Accept: 'application/json' } }
        )

        if (!res.ok) {
          const errorData = await safeJson<{ error: string }>(res)
          throw new Error(errorData?.error || `Errore ${res.status}`)
        }

        const extracted = await safeJson<ExtractedData>(res)

        if (!extracted) {
          throw new Error('Dati non validi ricevuti dal server')
        }

        switch (extracted.status) {
          case 'FAILED':
            setErrorMessage(`Elaborazione fallita: ${extracted.error_message || 'Errore sconosciuto.'}`)
            setCurrentStatus('FAILED')
            return

          case 'PROCESSING':
            setCurrentStatus('PROCESSING')
            attempts++
            if (attempts < maxAttempts && visible) {
              await sleep(3000)
              return fetchOnce()
            } else {
              setErrorMessage('Tempo di elaborazione superato. Riprova più tardi.')
              setCurrentStatus('FAILED')
              return
            }

          case 'PENDING_REVIEW':
          case 'CONFIRMED':
          case 'SENT':
          case 'TEST_SENT':
            setData(extracted)
            reset({
              supplier_tax_id: extracted.supplier_tax_id || '',
              receiver_tax_id: extracted.receiver_tax_id || '',
              supplier_iban: extracted.supplier_iban || '',
              delegaCheckbox: false,
            })
            setCurrentStatus('SUCCESS')
            return

          default:
            throw new Error(`Stato sconosciuto ricevuto: ${extracted.status}`)
        }
      } catch (err) {
        if (ac.signal.aborted) return
        const msg = err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto.'
        setErrorMessage(msg)
        setCurrentStatus('FAILED')
      }
    }

    fetchOnce()
    return () => {
      ac.abort()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [id, reset])

  // Invio
  const onSubmit: SubmitHandler<ReviewFormData> = async (formData) => {
    setApiError(null)
    setApiSuccess(null)

    if (!data) {
      setApiError('Dati originali non trovati. Impossibile salvare.')
      return
    }

    try {
      // Normalizzazione input
      const normalized = {
        supplier_tax_id: formData.supplier_tax_id?.trim() || '',
        receiver_tax_id: formData.receiver_tax_id?.trim()?.toUpperCase() || '',
        supplier_iban: formData.supplier_iban?.replace(/\s+/g, '')?.toUpperCase() || '',
      }

      // 1) Conferma dati
      setApiSuccess('Salvataggio e conferma dati...')
      const confirmResponse = await fetch('/api/confirm-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: data.id, ...normalized }),
      })

      if (confirmResponse.status === 401) {
        setApiError('Sessione scaduta. Accedi di nuovo.')
        router.replace('/login')
        return
      }
      if (confirmResponse.status === 403) {
        setApiError('Accesso negato.')
        return
      }

      if (!confirmResponse.ok) {
        const errorData = await safeJson<{ error: string }>(confirmResponse)
        throw new Error(errorData?.error || 'Errore durante il salvataggio dei dati.')
      }

      const confirmedData = await safeJson<ExtractedData>(confirmResponse)
      if (!confirmedData) {
        throw new Error('Dati confermati non validi')
      }

      // 2) Avvio invio PEC
      setApiSuccess('Dati confermati! Avvio invio PEC...')
      const pecResponse = await fetch('/api/send-pec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: confirmedData.id }),
      })

      if (pecResponse.status === 401) {
        setApiError('Sessione scaduta. Accedi di nuovo.')
        router.replace('/login')
        return
      }
      if (pecResponse.status === 403) {
        setApiError('Accesso negato.')
        return
      }

      if (!pecResponse.ok) {
        const errorData = await safeJson<{ error: string }>(pecResponse)
        throw new Error(errorData?.error || "Errore durante l'avvio dell'invio PEC.")
      }

      const pecResult = await safeJson<{ success: boolean, message: string, pdfPath?: string }>(pecResponse)
      if (!pecResult?.success) {
        throw new Error("Errore durante l'avvio dell'invio PEC.")
      }

      setApiSuccess('Invio PEC avviato con successo! Sarai reindirizzato.')
      redirectRef.current = window.setTimeout(() => { router.push('/dashboard') }, 2000)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto.')
    }
  }

  // RENDER
  if (currentStatus === 'LOADING') return <StatusDisplay message="Caricamento dati..." isError={false} />
  if (currentStatus === 'PROCESSING') return <StatusDisplay message="Il tuo documento è in elaborazione... (Controllo tra 3s)" isError={false} />
  if (currentStatus === 'FAILED') return <StatusDisplay message={errorMessage || 'Errore sconosciuto'} isError={true} />

  // SUCCESS
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* supplier_tax_id */}
      <div>
        <label htmlFor="supplier_tax_id" className="block text-sm font-medium text-gray-700">
          P.IVA Fornitore (supplier_tax_id)
        </label>
        <input
          type="text"
          id="supplier_tax_id"
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={!!errors.supplier_tax_id}
          {...register('supplier_tax_id')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.supplier_tax_id && (
          <p className="mt-1 text-sm text-red-600">{errors.supplier_tax_id.message}</p>
        )}
      </div>

      {/* receiver_tax_id */}
      <div>
        <label htmlFor="receiver_tax_id" className="block text-sm font-medium text-gray-700">
          POD / PDR (receiver_tax_id)
        </label>
        <input
          type="text"
          id="receiver_tax_id"
          autoComplete="off"
          aria-invalid={!!errors.receiver_tax_id}
          {...register('receiver_tax_id')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.receiver_tax_id && (
          <p className="mt-1 text-sm text-red-600">{errors.receiver_tax_id.message}</p>
        )}
      </div>

      {/* supplier_iban */}
      <div>
        <label htmlFor="supplier_iban" className="block text-sm font-medium text-gray-700">
          IBAN Fornitore (supplier_iban)
        </label>
        <input
          type="text"
          id="supplier_iban"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!errors.supplier_iban}
          {...register('supplier_iban')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.supplier_iban && (
          <p className="mt-1 text-sm text-red-600">{errors.supplier_iban.message}</p>
        )}
      </div>

      {/* delega */}
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            id="delegaCheckbox"
            type="checkbox"
            {...register('delegaCheckbox')}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
        </div>
        <div className="ml-3 text-sm leading-6">
          <label htmlFor="delegaCheckbox" className="font-medium text-gray-900">
            Delega e Autorizzazione
          </label>
          <p className="text-gray-500">
            Cliccando, confermo i dati e conferisco delega formale a [Nome Piattaforma] per inviare la PEC a mio nome.
          </p>
          {errors.delegaCheckbox && (
            <p className="mt-1 text-sm text-red-600">{errors.delegaCheckbox.message}</p>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || currentStatus !== 'SUCCESS'}
          className="flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Operazione in corso...' : 'Conferma e Invia PEC'}
        </button>
      </div>

      {/* Feedback */}
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
