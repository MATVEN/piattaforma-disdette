// src/components/ReviewForm.tsx (C17 - Modern Form Styling)

'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reviewFormSchema, type ReviewFormData } from '@/domain/schemas'
import { motion, AnimatePresence } from 'framer-motion'
import { showSuccess, showError, showPromise } from '@/lib/toast'
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Building2,
  Hash,
  CreditCard,
  FileCheck
} from 'lucide-react'

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const safeJson = async <T,>(res: Response): Promise<T | undefined> => {
  try { return (await res.json()) as T } catch { return undefined }
}

// UI stato
function StatusDisplay({ message, isError, isProcessing }: { 
  message: string
  isError: boolean
  isProcessing?: boolean 
}) {
  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-danger-200 bg-danger-50 p-6"
      >
        <div className="flex items-start space-x-3">
          <XCircle className="h-6 w-6 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-danger-900">Errore</h3>
            <p className="text-sm text-danger-700 mt-1">{message}</p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      {isProcessing ? (
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
      ) : (
        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      )}
      <p className="text-lg text-gray-700">{message}</p>
    </div>
  )
}

export default function ReviewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [data, setData] = useState<ExtractedData | null>(null)
  const [currentStatus, setCurrentStatus] = useState<'LOADING' | 'PROCESSING' | 'FAILED' | 'SUCCESS'>('LOADING')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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

  useEffect(() => () => { if (redirectRef.current) clearTimeout(redirectRef.current) }, [])

  // Caricamento + polling
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
    if (!data) {
      showError('Dati originali non trovati. Impossibile salvare.')
      return
    }

    try {
      const normalized = {
        supplier_tax_id: formData.supplier_tax_id?.trim() || '',
        receiver_tax_id: formData.receiver_tax_id?.trim()?.toUpperCase() || '',
        supplier_iban: formData.supplier_iban?.replace(/\s+/g, '')?.toUpperCase() || '',
      }

      // 1) Conferma dati
      const confirmResponse = await fetch('/api/confirm-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: data.id, ...normalized }),
      })

      if (confirmResponse.status === 401) {
        showError('Sessione scaduta. Effettua nuovamente il login.')
        router.replace('/login')
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
      const pecResponse = await fetch('/api/send-pec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: confirmedData.id }),
      })

      if (pecResponse.status === 401) {
        showError('Sessione scaduta. Effettua nuovamente il login.')
        router.replace('/login')
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

      showSuccess('PEC inviata con successo! Verrai reindirizzato alla dashboard.')
      redirectRef.current = window.setTimeout(() => { router.push('/dashboard') }, 2000)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto.'
      showError(errorMsg)
    }
  }

  // RENDER
  if (currentStatus === 'LOADING') return <StatusDisplay message="Caricamento dati..." isError={false} />
  if (currentStatus === 'PROCESSING') return <StatusDisplay message="Il tuo documento è in elaborazione..." isError={false} isProcessing />
  if (currentStatus === 'FAILED') return <StatusDisplay message={errorMessage || 'Errore sconosciuto'} isError={true} />

  // SUCCESS - Form
  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-6"
    >
      {/* supplier_tax_id */}
      <FormField
        label="P.IVA Fornitore"
        icon={<Building2 className="h-5 w-5" />}
        error={errors.supplier_tax_id?.message}
      >
        <input
          type="text"
          id="supplier_tax_id"
          inputMode="numeric"
          autoComplete="off"
          {...register('supplier_tax_id')}
          className={`w-full form-input ${errors.supplier_tax_id ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
        />
      </FormField>

      {/* receiver_tax_id */}
      <FormField
        label="POD / PDR"
        icon={<Hash className="h-5 w-5" />}
        error={errors.receiver_tax_id?.message}
      >
        <input
          type="text"
          id="receiver_tax_id"
          autoComplete="off"
          {...register('receiver_tax_id')}
          className={`w-full form-input ${errors.receiver_tax_id ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
        />
      </FormField>

      {/* supplier_iban */}
      <FormField
        label="IBAN Fornitore"
        icon={<CreditCard className="h-5 w-5" />}
        error={errors.supplier_iban?.message}
        optional
      >
        <input
          type="text"
          id="supplier_iban"
          autoComplete="off"
          spellCheck={false}
          {...register('supplier_iban')}
          className={`w-full form-input ${errors.supplier_iban ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
        />
      </FormField>

      {/* delega checkbox */}
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6">
        <div className="flex items-start space-x-3">
          <input
            id="delegaCheckbox"
            type="checkbox"
            {...register('delegaCheckbox')}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
          <div className="flex-1">
            <label htmlFor="delegaCheckbox" className="flex items-center space-x-2 font-medium text-gray-900 cursor-pointer">
              <FileCheck className="h-5 w-5 text-primary-600" />
              <span>Delega e Autorizzazione</span>
            </label>
            <p className="text-sm text-gray-600 mt-1">
              Confermo i dati e conferisco delega formale a Disdette per inviare la PEC a mio nome.
            </p>
            {errors.delegaCheckbox && (
              <p className="mt-2 text-sm text-danger-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.delegaCheckbox.message}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isSubmitting || currentStatus !== 'SUCCESS'}
        className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-primary px-6 py-4 text-base font-semibold text-white shadow-glass transition-all hover:shadow-glass-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Operazione in corso...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5" />
            <span>Conferma e Invia PEC</span>
          </>
        )}
      </motion.button>
    </motion.form>
  )
}

// === Helper Component ===
function FormField({
  label,
  icon,
  error,
  optional,
  children,
}: {
  label: string
  icon: React.ReactNode
  error?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
        <span className="text-primary-600">{icon}</span>
        <span>{label}</span>
        {optional && <span className="text-gray-400 text-xs font-normal">(opzionale)</span>}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-danger-600 flex items-center space-x-1"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </motion.p>
      )}
    </div>
  )
}