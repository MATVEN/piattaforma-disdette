// hooks/useReviewForm.ts
//
// Manages form setup, data fetching, and status polling for ReviewForm
// Handles OCR status states: LOADING → PROCESSING → PENDING_REVIEW → SUCCESS

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reviewFormSchema, type ReviewFormData } from '@/domain/schemas'

interface ExtractedData {
  id: number
  file_path: string
  status: 'PROCESSING' | 'PENDING_REVIEW' | 'CONFIRMED' | 'SENT' | 'TEST_SENT' | 'FAILED' | string
  supplier_tax_id: string | null
  receiver_tax_id: string | null
  supplier_contract_number: string | null
  supplier_iban: string | null
  error_message: string | null
}

const safeJson = async <T,>(res: Response): Promise<T | undefined> => {
  try {
    return (await res.json()) as T
  } catch {
    return undefined
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface UseReviewFormReturn {
  form: UseFormReturn<ReviewFormData>
  tipoIntestatario: 'privato' | 'azienda'
  setTipoIntestatario: (value: 'privato' | 'azienda') => void
  loading: boolean
  currentStatus: 'LOADING' | 'PROCESSING' | 'FAILED' | 'SUCCESS'
  errorMessage: string | null
  data: ExtractedData | null
}

export function useReviewForm(): UseReviewFormReturn {
  const searchParams = useSearchParams()
  const id = parseInt(searchParams.get('id') || '0')

  const [data, setData] = useState<ExtractedData | null>(null)
  const [currentStatus, setCurrentStatus] = useState<'LOADING' | 'PROCESSING' | 'FAILED' | 'SUCCESS'>('LOADING')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [tipoIntestatario, setTipoIntestatario] = useState<'privato' | 'azienda'>('privato')

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      tipo_intestatario: 'privato' as const,
      supplier_tax_id: '',
      supplier_contract_number: '',
      supplier_iban: '',
      delegaCheckbox: false,
      // B2C defaults (privato)
      nome: '',
      cognome: '',
      codice_fiscale: '',
      indirizzo_residenza: '',
    } as any,
  })

  const { reset } = form

  // Data fetching + polling
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

    const onVisibility = () => {
      visible = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibility)

    const fetchOnce = async () => {
      try {
        const res = await fetch(`/api/get-extracted-data?id=${id}`, {
          credentials: 'include',
          signal: ac.signal,
          headers: { Accept: 'application/json' },
        })

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
            setErrorMessage(
              `Elaborazione fallita: ${extracted.error_message || 'Errore sconosciuto.'}`
            )
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
            // C23: Map extracted data to B2C form (default)
            reset({
              tipo_intestatario: 'privato' as const,
              supplier_tax_id: extracted.supplier_tax_id || '',
              supplier_contract_number: extracted.supplier_contract_number || '',
              supplier_iban: extracted.supplier_iban || '',
              delegaCheckbox: false,
              // B2C: receiver_tax_id maps to codice_fiscale for privato
              codice_fiscale: extracted.receiver_tax_id || '',
              nome: '',
              cognome: '',
              indirizzo_residenza: '',
            })
            setCurrentStatus('SUCCESS')
            return

          default:
            throw new Error(`Stato sconosciuto ricevuto: ${extracted.status}`)
        }
      } catch (err) {
        if (ac.signal.aborted) return
        const msg =
          err instanceof Error
            ? err.message
            : 'Si è verificato un errore sconosciuto.'
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

  return {
    form,
    tipoIntestatario,
    setTipoIntestatario,
    loading: currentStatus === 'LOADING' || currentStatus === 'PROCESSING',
    currentStatus,
    errorMessage,
    data,
  }
}
