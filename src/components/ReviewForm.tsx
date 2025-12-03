// src/components/ReviewForm.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reviewFormSchema, type ReviewFormData } from '@/domain/schemas'
import { motion, AnimatePresence } from 'framer-motion'
import { showSuccess, showError } from '@/lib/toast'
import toast from 'react-hot-toast'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  CreditCard,
  FileCheck,
  Users,
  User,
  MapPin,
  Home,
  FileText,
  UserCheck,
  Info
} from 'lucide-react'
import { FileUploadField } from '@/components/FileUploadField'
import { ALLOWED_ID_DOCUMENT_TYPES, ALLOWED_BUSINESS_DOCUMENT_TYPES } from '@/domain/schemas'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

// --- Tipi ---
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
  const id = parseInt(searchParams.get('id') || '0')

  const [data, setData] = useState<ExtractedData | null>(null)
  const [currentStatus, setCurrentStatus] = useState<'LOADING' | 'PROCESSING' | 'FAILED' | 'SUCCESS'>('LOADING')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const redirectRef = useRef<number | null>(null)

  // C21: Duplicate detection state  
  const [duplicateError, setDuplicateError] = useState<{
    message: string
    duplicateId: number
    createdAt: string
    status: string
    contractNumber: string
  } | null>(null)

  const [isBypassSubmitting, setIsBypassSubmitting] = useState(false)

  // C23: B2B support state
  const [tipoIntestatario, setTipoIntestatario] = useState<'privato' | 'azienda'>('privato')
  const [indirizzoFatturazioneUguale, setIndirizzoFatturazioneUguale] = useState(true)
  const [documentoLR, setDocumentoLR] = useState<File | null>(null)
  const [visuraCamerale, setVisuraCamerale] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [delegaFirma, setDelegaFirma] = useState<File | null>(null)

  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
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

  const watchRichiedenteRuolo = watch('richiedente_ruolo')

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
  const onSubmit = async (data: ReviewFormData) => {
    try {
      setLoading(true)

      // Validate user exists
      if (!user) {
        toast.error('Utente non autenticato')
        setLoading(false)
        return
      }

      // ===== CRITICAL FIX: Map receiver_tax_id from codice_fiscale =====
      let receiver_tax_id: string | null = null
      
      if (data.tipo_intestatario === 'privato') {
        // B2C: receiver_tax_id = codice_fiscale dell'intestatario
        receiver_tax_id = data.codice_fiscale || null

      } else if (data.tipo_intestatario === 'azienda') {
        // B2B: receiver_tax_id = codice_fiscale del Legale Rappresentante
        receiver_tax_id = data.lr_codice_fiscale || null
      }

      // Validate receiver_tax_id
      if (!receiver_tax_id) {
        toast.error('Codice Fiscale obbligatorio per procedere')
        setLoading(false)
        return
      }

      // Validate supplier_tax_id
      if (!data.supplier_tax_id) {
        toast.error('Partita IVA fornitore obbligatoria')
        setLoading(false)
        return
      }

      let visuraPath: string | null = null
      let delegaPath: string | null = null
      let documentoPath: string | null = null

      // Upload files if B2B
      if (data.tipo_intestatario === 'azienda') {
        // Validate required files
        if (!visuraCamerale) {
          toast.error('Visura Camerale obbligatoria per aziende')
          setLoading(false)
          return
        }

        if (!documentoLR) {
          toast.error('Documento Legale Rappresentante obbligatorio')
          setLoading(false)
          return
        }

        if (data.richiedente_ruolo === 'delegato' && !delegaFirma) {
          toast.error('Delega obbligatoria per delegati')
          setLoading(false)
          return
        }

        // Upload Visura Camerale
        const visuraFilePath = `${user.id}/${Date.now()}_visura.pdf`
        const { error: visuraError } = await supabase.storage
          .from('documenti-identita')
          .upload(visuraFilePath, visuraCamerale, { upsert: true })
        
        if (visuraError) {
          toast.error(`Errore upload Visura: ${visuraError.message}`)
          setLoading(false)
          return
        }
        visuraPath = visuraFilePath

        // Upload Documento LR
        const docFilePath = `${user.id}/${Date.now()}_documento_lr.pdf`
        const { error: docError } = await supabase.storage
          .from('documenti-identita')
          .upload(docFilePath, documentoLR, { upsert: true })
        
        if (docError) {
          toast.error(`Errore upload Documento: ${docError.message}`)
          setLoading(false)
          return
        }
        documentoPath = docFilePath

        // Upload Delega (if delegato)
        if (data.richiedente_ruolo === 'delegato' && delegaFirma) {
          const delegaFilePath = `${user.id}/${Date.now()}_delega.pdf`
          const { error: delegaError } = await supabase.storage
            .from('documenti-identita')
            .upload(delegaFilePath, delegaFirma, { upsert: true })
          
          if (delegaError) {
            toast.error(`Errore upload Delega: ${delegaError.message}`)
            setLoading(false)
            return
          }
          delegaPath = delegaFilePath
        }
      }

      // ===== Prepare data for API =====
      const updateData = {
        id,
        ...data,
        receiver_tax_id, // ← CRITICAL: Map from CF
        visura_camerale_path: visuraPath,
        delega_firma_path: delegaPath,
      }

      // ===== STEP 1: Conferma Dati =====
      const response = await fetch('/api/confirm-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore conferma dati')
      }

      toast.success('Dati confermati!')

      // ===== STEP 2: Invio PEC (Automatico) =====
      const pecResponse = await fetch('/api/send-pec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!pecResponse.ok) {
        const pecError = await pecResponse.json()
        throw new Error(pecError.error || 'Errore invio PEC')
      }

      toast.success('PEC inviata con successo! Reindirizzamento...')

      // ===== Redirect to Dashboard =====
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('❌ Errore submission:', error)
      toast.error(error instanceof Error ? error.message : 'Errore durante il salvataggio')
    } finally {
      setLoading(false)
    }
  }

  // C21: Funzione per procedere bypassando il duplicate check
  const handleBypassDuplicate = async () => {
    if (!data || !duplicateError || isBypassSubmitting) return

    const formData = getValues()
    if (!formData.delegaCheckbox) {
      showError('Devi accettare la delega prima di procedere.')
      return
    }

    setIsBypassSubmitting(true)

    try {
      // C23: Build normalized data based on tipo_intestatario
      const normalized: any = {
        supplier_tax_id: formData.supplier_tax_id?.trim() || '',
        supplier_contract_number: formData.supplier_contract_number?.trim() || '',
        supplier_iban: formData.supplier_iban?.replace(/\s+/g, '')?.toUpperCase() || '',
        tipo_intestatario: formData.tipo_intestatario,
      }

      // Add conditional fields (same logic as onSubmit)
      if (formData.tipo_intestatario === 'privato') {
        normalized.nome = formData.nome?.trim() || ''
        normalized.cognome = formData.cognome?.trim() || ''
        normalized.codice_fiscale = formData.codice_fiscale?.trim()?.toUpperCase() || ''
        normalized.indirizzo_residenza = formData.indirizzo_residenza?.trim() || ''
      } else if (formData.tipo_intestatario === 'azienda') {
        normalized.ragione_sociale = formData.ragione_sociale?.trim() || ''
        normalized.partita_iva = formData.partita_iva?.trim() || ''
        normalized.sede_legale = formData.sede_legale?.trim() || ''
        normalized.lr_nome = formData.lr_nome?.trim() || ''
        normalized.lr_cognome = formData.lr_cognome?.trim() || ''
        normalized.lr_codice_fiscale = formData.lr_codice_fiscale?.trim()?.toUpperCase() || ''
        normalized.indirizzo_fornitura = formData.indirizzo_fornitura?.trim() || ''
        normalized.indirizzo_fatturazione = formData.indirizzo_fatturazione?.trim() || ''
        normalized.richiedente_ruolo = formData.richiedente_ruolo
        // Note: File paths already uploaded in onSubmit, reuse them here if needed
      }

      // Conferma con bypass
      const confirmResponse = await fetch('/api/confirm-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          id: data.id, 
          ...normalized, 
          bypassDuplicateCheck: true
        }),
      })

      if (!confirmResponse.ok) {
        const errorData = await safeJson<{ error: string }>(confirmResponse)
        throw new Error(errorData?.error || 'Errore durante il bypass.')
      }

      const confirmedData = await safeJson<ExtractedData>(confirmResponse)
      if (!confirmedData) throw new Error('Dati confermati non validi')

      // Continua con invio PEC
      const pecResponse = await fetch('/api/send-pec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: confirmedData.id }),
      })

      if (!pecResponse.ok) {
        const errorData = await safeJson<{ error: string }>(pecResponse)
        throw new Error(errorData?.error || "Errore durante l'avvio dell'invio PEC.")
      }

      const pecResult = await safeJson<{ success: boolean }>(pecResponse)
      if (!pecResult?.success) {
        throw new Error("Errore durante l'avvio dell'invio PEC.")
      }

      setDuplicateError(null)
      setIsBypassSubmitting(false)
      
      showSuccess('PEC inviata con successo! Verrai reindirizzato alla dashboard.')
      
      redirectRef.current = window.setTimeout(() => router.push('/dashboard'), 2000)
      
    } catch (err: unknown) {
      setIsBypassSubmitting(false)
      const errorMsg = err instanceof Error ? err.message : 'Errore sconosciuto durante il bypass.'
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
      {/* C23: Tipo Intestatario Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo intestatario contratto *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setTipoIntestatario('privato')
              setValue('tipo_intestatario', 'privato')
            }}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
              tipoIntestatario === 'privato'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">Privato</div>
              <div className="text-xs opacity-75">Persona fisica</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipoIntestatario('azienda')
              setValue('tipo_intestatario', 'azienda')
            }}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
              tipoIntestatario === 'azienda'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">Azienda</div>
              <div className="text-xs opacity-75">Società / P.IVA</div>
            </div>
          </button>
        </div>
      </div>

      <input 
        type="hidden" 
        {...register('tipo_intestatario')} 
        value={tipoIntestatario}
      />

      {/* Common supplier fields - ICONE INTERNE */}

      {/* P.IVA Fornitore */}
      <div>
        <label htmlFor="supplier_tax_id" className="block text-sm font-medium text-gray-700 mb-2">
          P.IVA Fornitore *
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="supplier_tax_id"
            inputMode="numeric"
            maxLength={11}
            autoComplete="off"
            placeholder="es. 15844561009"
            {...register('supplier_tax_id')}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">11 cifre numeriche</p>
        {errors.supplier_tax_id && (
          <p className="mt-1 text-sm text-red-600">{errors.supplier_tax_id.message}</p>
        )}
      </div>

      {/* POD / PDR / Codice Cliente */}
      <div>
        <label htmlFor="supplier_contract_number" className="block text-sm font-medium text-gray-700 mb-2">
          POD / PDR / Codice Cliente
          <span className="ml-1 text-xs text-gray-500 font-normal">(opzionale)</span>
        </label>
        <div className="relative">
          <FileCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="supplier_contract_number"
            autoComplete="off"
            placeholder="es. IT001E12345678 o 10205464"
            {...register('supplier_contract_number')}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          <strong>Energia:</strong> POD (IT...) o PDR (14 cifre) · <strong>Telefonia:</strong> Codice Cliente (8-10 cifre)
        </p>
        {errors.supplier_contract_number && (
          <p className="mt-1 text-sm text-red-600">{errors.supplier_contract_number.message}</p>
        )}
      </div>

      {/* IBAN Fornitore */}
      <div className="md:col-span-2">
        <label htmlFor="supplier_iban" className="block text-sm font-medium text-gray-700 mb-2">
          IBAN Fornitore
          <span className="ml-1 text-xs text-gray-500 font-normal">(opzionale)</span>
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="supplier_iban"
            maxLength={27}
            autoComplete="off"
            spellCheck={false}
            placeholder="es. IT60X0542811101000000123456"
            {...register('supplier_iban')}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">27 caratteri (IT + 25 caratteri)</p>
        {errors.supplier_iban && (
          <p className="mt-1 text-sm text-red-600">{errors.supplier_iban.message}</p>
        )}
      </div>

      {/* C23: Conditional B2C Fields */}
      {tipoIntestatario === 'privato' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-gray-100 pt-6">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Dati Intestatario Privato
            </h3>
          </div>

          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="nome"
                {...register('nome')}
                placeholder="Mario"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              />
            </div>
            {(errors as any).nome && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).nome.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="cognome" className="block text-sm font-medium text-gray-700 mb-2">
              Cognome *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="cognome"
                {...register('cognome')}
                placeholder="Rossi"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              />
            </div>
            {(errors as any).cognome && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).cognome.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700 mb-2">
              Codice Fiscale *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="codice_fiscale"
                {...register('codice_fiscale')}
                placeholder="RSSMRA80A01H501U"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none uppercase"
                maxLength={16}
              />
            </div>
            {(errors as any).codice_fiscale && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).codice_fiscale.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="indirizzo_residenza" className="block text-sm font-medium text-gray-700 mb-2">
              Indirizzo di Residenza *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="indirizzo_residenza"
                {...register('indirizzo_residenza')}
                placeholder="Via Roma 123, 00100 Roma"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              />
            </div>
            {(errors as any).indirizzo_residenza && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).indirizzo_residenza.message}</p>
            )}
          </div>
        </div>
      )}

      {/* C23: Conditional B2B Fields */}
      {tipoIntestatario === 'azienda' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-gray-100 pt-6">
          {/* Sezione Dati Azienda */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary-600" />
              Dati Azienda
            </h3>
          </div>

          <div>
            <label htmlFor="ragione_sociale" className="block text-sm font-medium text-gray-700 mb-2">
              Ragione Sociale *
            </label>
            <input
              type="text"
              id="ragione_sociale"
              {...register('ragione_sociale')}
              placeholder="Rossi S.R.L."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
            {(errors as any).ragione_sociale && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).ragione_sociale.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="partita_iva" className="block text-sm font-medium text-gray-700 mb-2">
              Partita IVA *
            </label>
            <input
              type="text"
              id="partita_iva"
              {...register('partita_iva')}
              placeholder="12345678901"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              maxLength={11}
            />
            {(errors as any).partita_iva && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).partita_iva.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="sede_legale" className="block text-sm font-medium text-gray-700 mb-2">
              Sede Legale *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="sede_legale"
                {...register('sede_legale')}
                onChange={(e) => {
                  // Se checkbox checked, copia automaticamente
                  if (indirizzoFatturazioneUguale) {
                    setValue('indirizzo_fatturazione', e.target.value)
                    console.log('✅ Indirizzo fatturazione aggiornato:', e.target.value)
                  }
                }}
                placeholder="Via Milano 10, 20100 Milano"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              />
            </div>
            {(errors as any).sede_legale && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).sede_legale.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="indirizzo_fornitura" className="block text-sm font-medium text-gray-700 mb-2">
              Indirizzo Fornitura *
              <span className="ml-2 text-xs text-gray-500">(dove si trova il contatore/linea)</span>
            </label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="indirizzo_fornitura"
                {...register('indirizzo_fornitura')}
                placeholder="Via Torino 5, 20100 Milano"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              />
            </div>
            {(errors as any).indirizzo_fornitura && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).indirizzo_fornitura.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={indirizzoFatturazioneUguale}
                onChange={(e) => {
                  const isChecked = e.target.checked
                  setIndirizzoFatturazioneUguale(isChecked)
                  
                  if (isChecked) {
                    // Copia sede_legale in indirizzo_fatturazione
                    const sedeLegale = getValues('sede_legale')
                    setValue('indirizzo_fatturazione', sedeLegale || '')
                    console.log('✅ Indirizzo fatturazione copiato da sede legale:', sedeLegale)
                  } else {
                    // Svuota il campo se unchecked
                    setValue('indirizzo_fatturazione', '')
                  }
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Indirizzo fatturazione uguale a sede legale
              </span>
            </label>
          </div>

          {!indirizzoFatturazioneUguale && (
            <div className="md:col-span-2">
              <label htmlFor="indirizzo_fatturazione" className="block text-sm font-medium text-gray-700 mb-2">
                Indirizzo Fatturazione *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="indirizzo_fatturazione"
                  {...register('indirizzo_fatturazione')}
                  placeholder="Via Venezia 20, 20100 Milano"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
              </div>
              {(errors as any).indirizzo_fatturazione && (
                <p className="mt-1 text-sm text-red-600">{(errors as any).indirizzo_fatturazione.message}</p>
              )}
            </div>
          )}

          {/* Sezione Legale Rappresentante */}
          <div className="md:col-span-2 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary-600" />
              Legale Rappresentante
            </h3>
          </div>

          <div>
            <label htmlFor="lr_nome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Legale Rappresentante *
            </label>
            <input
              type="text"
              id="lr_nome"
              {...register('lr_nome')}
              placeholder="Mario"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
            {(errors as any).lr_nome && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).lr_nome.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lr_cognome" className="block text-sm font-medium text-gray-700 mb-2">
              Cognome Legale Rappresentante *
            </label>
            <input
              type="text"
              id="lr_cognome"
              {...register('lr_cognome')}
              placeholder="Rossi"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
            {(errors as any).lr_cognome && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).lr_cognome.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="lr_codice_fiscale" className="block text-sm font-medium text-gray-700 mb-2">
              Codice Fiscale Legale Rappresentante *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="lr_codice_fiscale"
                {...register('lr_codice_fiscale')}
                placeholder="RSSMRA80A01H501U"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none uppercase"
                maxLength={16}
              />
            </div>
            {(errors as any).lr_codice_fiscale && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).lr_codice_fiscale.message}</p>
            )}
          </div>

          {/* Ruolo Richiedente */}
          <div className="md:col-span-2 mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chi sta effettuando questa richiesta? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-indigo-300 cursor-pointer">
                <input
                  type="radio"
                  {...register('richiedente_ruolo')}
                  value="legale_rappresentante"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Legale Rappresentante</div>
                  <div className="text-xs text-gray-500">Sono il titolare dei poteri</div>
                </div>
              </label>

              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-indigo-300 cursor-pointer">
                <input
                  type="radio"
                  {...register('richiedente_ruolo')}
                  value="delegato"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Delegato</div>
                  <div className="text-xs text-gray-500">Agisco per delega</div>
                </div>
              </label>
            </div>
            {(errors as any).richiedente_ruolo && (
              <p className="mt-1 text-sm text-red-600">{(errors as any).richiedente_ruolo.message}</p>
            )}
          </div>

          {/* Documenti B2B */}
          <div className="md:col-span-2 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              Documenti Richiesti
            </h3>
          </div>

          <div className="md:col-span-2">
            <FileUploadField
              label="Documento Identità Legale Rappresentante"
              accept={ALLOWED_ID_DOCUMENT_TYPES.join(',')}
              onChange={(file) => setDocumentoLR(file)}
              currentFile={documentoLR}
              helpText="PDF, PNG o JPG - Max 5MB"
              required
            />
          </div>

          <div className="md:col-span-2">
            <FileUploadField
              label="Visura Camerale (recente)"
              accept={ALLOWED_BUSINESS_DOCUMENT_TYPES.join(',')}
              onChange={(file) => setVisuraCamerale(file)}
              currentFile={visuraCamerale}
              helpText="PDF - Max 5MB - Necessaria per provare i poteri di firma (max 30 giorni)"
              required
            />
          </div>

          {watchRichiedenteRuolo === 'delegato' && (
            <>
              {/* Info Box Esplicativo */}
              <div className="md:col-span-2 bg-blue-50/80 backdrop-blur-xl rounded-xl border border-blue-100 p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">📄 Due deleghe necessarie per i delegati</p>
                    <p className="text-blue-700">
                      1. <strong>Delega aziendale interna</strong> (carica qui sotto): Documento firmato dal Legale Rappresentante che ti conferisce i poteri di agire per l'azienda.
                    </p>
                    <p className="text-blue-700 mt-1">
                      2. <strong>Delega alla piattaforma</strong> (checkbox a fine form): Autorizzi DisdettaFacile ad inviare la PEC per tuo conto.
                    </p>
                  </div>
                </div>
              </div>

              {/* Campo Upload Delega */}
              <div className="md:col-span-2">
                <FileUploadField
                  label="Delega Firmata dal Legale Rappresentante"
                  accept={ALLOWED_BUSINESS_DOCUMENT_TYPES.join(',')}
                  onChange={(file) => setDelegaFirma(file)}
                  currentFile={delegaFirma}
                  helpText="PDF firmato dal Legale Rappresentante - Max 5MB"
                  required
                />
              </div>
            </>
          )}

          {/* Info Card B2B */}
          <div className="md:col-span-2 mt-4 bg-blue-50/80 backdrop-blur-xl rounded-xl border border-blue-100 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">📋 Documenti Obbligatori per Aziende</p>
                <p className="text-blue-700">
                  Per le disdette aziendali è necessaria la Visura Camerale (massimo 30 giorni)
                  per provare i poteri di firma del Legale Rappresentante.
                  Se non sei il LR, serve anche una delega firmata.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <span>Delega e Autorizzazione alla Piattaforma *</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Autorizzo DisdettaFacile ad agire come mio mandatario nell'invio della PEC di disdetta
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
        disabled={loading || currentStatus !== 'SUCCESS'}
        className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-primary px-6 py-4 text-base font-semibold text-white shadow-glass transition-all hover:shadow-glass-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
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

      {/* DEBUG: Mostra errori validation */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-semibold text-red-900 mb-2">⚠️ Errori Validation:</p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <strong>{field}:</strong> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* C21: Duplicate Detection Modal */}
      <AnimatePresence>
        {duplicateError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDuplicateError(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-yellow-200 bg-white p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="mb-4 flex items-start space-x-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    Disdetta Duplicata Rilevata
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Hai già una disdetta attiva per questo contratto
                  </p>
                </div>
              </div>

              {/* Dettagli */}
              <div className="mb-6 space-y-3 rounded-xl bg-yellow-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Contratto:</span>
                  <span className="font-mono text-gray-900">{duplicateError.contractNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">ID Disdetta:</span>
                  <span className="font-mono text-gray-900">#{duplicateError.duplicateId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Stato:</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {duplicateError.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Creata il:</span>
                  <span className="text-gray-900">
                    {new Date(duplicateError.createdAt).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Messaggio */}
              <p className="mb-6 text-sm leading-relaxed text-gray-700">
                <strong>Attenzione:</strong> Procedendo, creerai una <strong>seconda disdetta</strong> per lo stesso contratto. 
                Questo potrebbe causare problemi con il fornitore. Sei sicuro?
              </p>

              {/* Bottoni */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDuplicateError(null)}
                  className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Annulla
                </motion.button>
                <motion.button
                  whileHover={!isBypassSubmitting ? { scale: 1.02 } : {}}
                  whileTap={!isBypassSubmitting ? { scale: 0.98 } : {}}
                  onClick={handleBypassDuplicate}
                  disabled={isBypassSubmitting}
                  className="flex-1 rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isBypassSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Invio in corso...</span>
                    </>
                  ) : (
                    <span>Procedi Comunque</span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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