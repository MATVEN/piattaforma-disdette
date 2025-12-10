// hooks/useFormSubmission.ts
//
// Handles form submission logic:
// 1. CRITICAL: receiver_tax_id mapping (B2C: codice_fiscale, B2B: lr_codice_fiscale)
// 2. File uploads for B2B (Visura, Documento LR, Delega)
// 3. API calls: confirm-data → send-pec
// 4. Success redirect to dashboard
// 5. Enhanced error handling with user-friendly messages (C23 Day 4)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UseFormReturn } from 'react-hook-form'
import { type ReviewFormData } from '@/domain/schemas'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { type SubmissionProgress } from '../components/ProgressModal'
import { logger } from '@/lib/logger'

// ===== ERROR HANDLING HELPERS (C23 Day 4 - Phase 1) =====

/**
 * Convert technical errors to user-friendly Italian messages
 */
const getErrorMessage = (error: unknown, context?: string): string => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()

    // Network errors
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
      return 'Errore di connessione. Verifica la tua connessione internet e riprova.'
    }

    // Validation errors
    if (msg.includes('validation') || msg.includes('required') || msg.includes('obbligatorio')) {
      return 'Alcuni campi obbligatori sono mancanti. Controlla il form e riprova.'
    }

    // File upload errors
    if (msg.includes('upload') || msg.includes('storage')) {
      return `Errore durante il caricamento ${context ? `di ${context}` : 'dei file'}. Verifica che siano PDF validi e riprova.`
    }

    // PDF generation errors
    if (msg.includes('pdf')) {
      return 'Errore durante la generazione della lettera. Contatta il supporto se il problema persiste.'
    }

    // PEC errors
    if (msg.includes('pec') || msg.includes('email') || msg.includes('invio')) {
      return "Errore durante l'invio della PEC. I tuoi dati sono stati salvati, puoi ritentare dalla Dashboard."
    }

    // Authentication errors
    if (msg.includes('auth') || msg.includes('session') || msg.includes('unauthorized')) {
      return 'Sessione scaduta. Effettua nuovamente il login.'
    }

    // Return original message if no match
    return error.message
  }

  return 'Si è verificato un errore imprevisto. Riprova o contatta il supporto.'
}

// Interfaccia per return type
interface SubmissionResult {
  success: boolean
  isDuplicate?: boolean
  duplicateData?: {
    duplicateId: number
    createdAt: string
    status: string
    contractNumber?: string
  }
}

interface UseFormSubmissionProps {
  files: {
    documentoLR: File | null
    visuraCamerale: File | null
    delegaFirma: File | null
  }
  uploadControls?: {
    startUpload: {
      startDocumentoLRUpload: () => void
      startVisuraCameraleUpload: () => void
      startDelegaFirmaUpload: () => void
    }
    setUploadProgress: {
      setDocumentoLRProgress: (progress: number) => void
      setVisuraCameraleProgress: (progress: number) => void
      setDelegaFirmaProgress: (progress: number) => void
    }
    completeUpload: {
      completeDocumentoLRUpload: () => void
      completeVisuraCameraleUpload: () => void
      completeDelegaFirmaUpload: () => void
    }
  }
}

export interface UseFormSubmissionReturn {
  onSubmit: (data: ReviewFormData, bypassDuplicate?: boolean) => Promise<SubmissionResult> 
  loading: boolean
  progress: SubmissionProgress
}

export function useFormSubmission({ 
  files, 
  uploadControls,
}: UseFormSubmissionProps): UseFormSubmissionReturn {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<SubmissionProgress>({
    step: 'idle',
    message: '',
    progress: 0,
  })

  // ✅ NEW: Helper to simulate upload progress
  const simulateFileProgress = (
    startFn: () => void,
    progressFn: (p: number) => void,
    completeFn: () => void,
    durationMs: number = 1500
  ) => {
    if (!uploadControls) return Promise.resolve()

    return new Promise<void>((resolve) => {
      startFn()
      
      let progress = 0
      const steps = 10
      const interval = durationMs / steps

      const timer = setInterval(() => {
        progress += 10
        progressFn(progress)

        if (progress >= 100) {
          clearInterval(timer)
          completeFn()
          resolve()
        }
      }, interval)
    })
  }

  const onSubmit = async (data: ReviewFormData, bypassDuplicate = false): Promise<SubmissionResult> => {
    try {
      setLoading(true)
      setProgress({ step: 'validating', message: 'Validazione dati...', progress: 5 })

      // ===== STEP 0: Authentication Check =====
      if (!user) {
        toast.error('🔒 Sessione scaduta. Effettua nuovamente il login per continuare.', { 
          duration: 7000,
          id: 'session-expired'
        })
        setLoading(false)
        setProgress({ step: 'idle', message: '', progress: 0 })
        router.push('/login')
        return { success: false }
      }

      // Verify session is still valid
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('🔒 Sessione scaduta. Effettua nuovamente il login per continuare.', { 
          duration: 7000,
          id: 'session-expired-verify'
        })
        setLoading(false)
        setProgress({ step: 'idle', message: '', progress: 0 })
        router.push('/login')
        return { success: false }
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

      // ===== STEP 1: Validate Required Fields =====
      if (!receiver_tax_id) {
        toast.error('⚠️ Codice Fiscale obbligatorio per procedere', { 
          duration: 6000,
          id: 'cf-required' // Previene duplicati
        })
        setLoading(false)
        return { success: false }
      }

      if (!data.supplier_tax_id) {
        toast.error('⚠️ Partita IVA fornitore obbligatoria per procedere', { 
          duration: 6000,
          id: 'piva-required'
        })
        setLoading(false)
        return { success: false }
      }

      let visuraPath: string | null = null
      let delegaPath: string | null = null
      let documentoPath: string | null = null

      // ===== STEP 2: File Validation & Upload (B2B only) =====
      if (data.tipo_intestatario === 'azienda') {
        setProgress({ step: 'uploading', message: 'Caricamento documenti...', progress: 20 })

        // Validate required files exist
        if (!files.visuraCamerale) {
          toast.error('📄 Visura Camerale obbligatoria per aziende. Carica il documento per procedere.', { 
            duration: 6000,
            id: 'visura-required'
          })
          setLoading(false)
          setProgress({ step: 'idle', message: '', progress: 0 })
          return { success: false }
        }

        if (!files.documentoLR) {
          toast.error("📄 Documento d'identità del Legale Rappresentante obbligatorio. Carica il documento per procedere.", { 
            duration: 6000,
            id: 'documento-lr-required'
          })
          setLoading(false)
          setProgress({ step: 'idle', message: '', progress: 0 })
          return { success: false }
        }

        if (data.richiedente_ruolo === 'delegato' && !files.delegaFirma) {
          toast.error('📄 Delega firmata obbligatoria per delegati. Carica il documento per procedere.', { 
            duration: 6000,
            id: 'delega-required'
          })
          setLoading(false)
          setProgress({ step: 'idle', message: '', progress: 0 })
          return { success: false }
        }

        // Upload Visura Camerale
        setProgress({ step: 'uploading', message: 'Caricamento Visura Camerale...', progress: 25 })
        try {
          const visuraFilePath = `${user.id}/${Date.now()}_visura.pdf`
          
          // ✅ Start fake progress
          const progressPromise = uploadControls ? simulateFileProgress(
            uploadControls.startUpload.startVisuraCameraleUpload,
            uploadControls.setUploadProgress.setVisuraCameraleProgress,
            uploadControls.completeUpload.completeVisuraCameraleUpload,
            1500 // 1.5 seconds
          ) : Promise.resolve()
          
          // Upload file (parallel with progress animation)
          const { error: visuraError } = await supabase.storage
            .from('documenti-identita')
            .upload(visuraFilePath, files.visuraCamerale, { upsert: true })

          // Wait for progress animation to complete
          await progressPromise

          if (visuraError) throw visuraError
          visuraPath = visuraFilePath
        } catch (error) {
          logger.error('Errore upload Visura Camerale', {
            error: error instanceof Error ? error.message : String(error),
            userId: user?.id,
            step: 'upload-visura'
          })
          const errorMsg = getErrorMessage(error, 'Visura Camerale')
          toast.error(errorMsg, { duration: 6000 })
          setLoading(false)
          setProgress({ step: 'error', message: errorMsg, progress: 0 })
          return { success: false }
        }

        // Upload Documento LR
        setProgress({ step: 'uploading', message: 'Caricamento Documento LR...', progress: 35 })
        try {
          const docFilePath = `${user.id}/${Date.now()}_documento_lr.pdf`
          
          // ✅ Start fake progress
          const progressPromise = uploadControls ? simulateFileProgress(
            uploadControls.startUpload.startDocumentoLRUpload,
            uploadControls.setUploadProgress.setDocumentoLRProgress,
            uploadControls.completeUpload.completeDocumentoLRUpload,
            1500
          ) : Promise.resolve()
          
          const { error: docError } = await supabase.storage
            .from('documenti-identita')
            .upload(docFilePath, files.documentoLR, { upsert: true })

          await progressPromise

          if (docError) throw docError
          documentoPath = docFilePath
        } catch (error) {
          logger.error('Errore upload Documento Legale Rappresentante', {
            error: error instanceof Error ? error.message : String(error),
            userId: user?.id,
            step: 'upload-documento-lr'
          })
          const errorMsg = getErrorMessage(error, 'Documento Legale Rappresentante')
          toast.error(errorMsg, { duration: 6000 })
          setLoading(false)
          setProgress({ step: 'error', message: errorMsg, progress: 0 })
          return { success: false }
        }

        // Upload Delega (if delegato)
        if (data.richiedente_ruolo === 'delegato' && files.delegaFirma) {
          setProgress({ step: 'uploading', message: 'Caricamento Delega...', progress: 45 })
          try {
            const delegaFilePath = `${user.id}/${Date.now()}_delega.pdf`
            
            // ✅ Start fake progress
            const progressPromise = uploadControls ? simulateFileProgress(
              uploadControls.startUpload.startDelegaFirmaUpload,
              uploadControls.setUploadProgress.setDelegaFirmaProgress,
              uploadControls.completeUpload.completeDelegaFirmaUpload,
              1500
            ) : Promise.resolve()
            
            const { error: delegaError } = await supabase.storage
              .from('documenti-identita')
              .upload(delegaFilePath, files.delegaFirma, { upsert: true })

            await progressPromise

            if (delegaError) throw delegaError
            delegaPath = delegaFilePath
          } catch (error) {
            logger.error('Errore upload Delega Firmata', {
              error: error instanceof Error ? error.message : String(error),
              userId: user?.id,
              step: 'upload-delega'
            })
            const errorMsg = getErrorMessage(error, 'Delega Firmata')
            toast.error(errorMsg, { duration: 6000 })
            setLoading(false)
            setProgress({ step: 'error', message: errorMsg, progress: 0 })
            return { success: false }
          }
        }
      }

      // ===== Prepare data for API =====
      setProgress({ step: 'confirming', message: 'Salvataggio dati...', progress: 55 })

      // Get id from URL (passed from parent)
      const searchParams = new URLSearchParams(window.location.search)
      const id = parseInt(searchParams.get('id') || '0')

      const updateData = {
        id,
        ...data,
        receiver_tax_id,
        visura_camerale_path: visuraPath,
        delega_firma_path: delegaPath,
        bypassDuplicateCheck: bypassDuplicate, 
      }

      // ===== STEP 3: Conferma Dati (API Call) =====
      setProgress({ step: 'confirming', message: 'Conferma dati in corso...', progress: 60 })

      const response = await fetch('/api/confirm-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      logger.debug('API response received', {
        status: response.status,
        endpoint: '/api/confirm-data',
        userId: user?.id
      })

      // Parse response ONCE
      let responseData: any
      try {
        responseData = await response.json()
        logger.debug('Response data parsed', {
          hasError: !!responseData.error,
          isDuplicate: !!responseData.details,
          userId: user?.id
        })
      } catch (parseError) {
        logger.error('Failed to parse API response', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          endpoint: '/api/confirm-data',
          userId: user?.id
        })
        toast.error('Errore di comunicazione con il server', { duration: 6000 })
        setLoading(false)
        setProgress({ step: 'idle', message: '', progress: 0 })
        return { success: false }
      }

      // Check if response was successful
      if (!response.ok) {
        // ✅ Handle Duplicate Detection (409 OR 400 with details)
        const isDuplicateError = 
          response.status === 409 || 
          (response.status === 400 && responseData.details && responseData.code === 'VALIDATION_ERROR')
        
        if (isDuplicateError && responseData.details) {
          logger.info('Duplicate disdetta detected', {
            duplicateId: responseData.details.duplicateId,
            contractNumber: responseData.details.contractNumber,
            userId: user?.id,
            step: 'duplicate-detection'
          })
          setProgress({ step: 'idle', message: '', progress: 0 })
          setLoading(false)

          // Return duplicate info
          const duplicateResult = {
            success: false,
            isDuplicate: true,
            duplicateData: responseData.details
          }

          return duplicateResult
        }

        // Not a duplicate - regular error
        logger.warn('API request failed (not duplicate)', {
          status: response.status,
          error: responseData.error,
          userId: user?.id
        })
        const errorMsg = responseData.error || 'Errore conferma dati'
        toast.error(`Errore salvataggio dati: ${errorMsg}`, { duration: 6000 })
        setLoading(false)
        setProgress({ step: 'idle', message: '', progress: 0 })
        return { success: false }
      }

      // Success
      logger.info('Data confirmed successfully', {
        id,
        userId: user?.id,
        tipoIntestatario: data.tipo_intestatario
      })
      toast.success('✅ Dati confermati!', {
        duration: 2500,
        id: 'data-confirmed'
      })

      // ===== STEP 4: Invio PEC (Automatico) =====
      setProgress({ step: 'sending', message: 'Generazione PDF e invio PEC...', progress: 75 })
      try {
        const pecResponse = await fetch('/api/send-pec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })

        if (!pecResponse.ok) {
          const pecError = await pecResponse.json()
          throw new Error(pecError.error || 'Errore invio PEC')
        }

        setProgress({ step: 'success', message: 'PEC inviata con successo!', progress: 100 })
        logger.info('PEC sent successfully', {
          id,
          userId: user?.id,
          step: 'pec-sent'
        })
        toast.success('🎉 PEC inviata! Verrai reindirizzato alla Dashboard...', {
          duration: 2500,
          id: 'pec-success'
        })

        // ===== Redirect to Dashboard =====
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
        return { success: true }

      } catch (error) {
        logger.error('PEC sending failed', {
          error: error instanceof Error ? error.message : String(error),
          id,
          userId: user?.id,
          step: 'pec-send'
        })
        // Don't setLoading(false) - keep loading for redirect
        // Data is already saved, user can retry from Dashboard
        const errorMsg = "✅ Dati salvati correttamente!\n⚠️ Errore invio PEC. Riprova dalla Dashboard (pulsante 'Riprova Invio')."
        toast.error(errorMsg, { duration: 8000 })
        setProgress({ step: 'error', message: errorMsg, progress: 70 })
        toast.error(errorMsg, { duration: 8000 })

        // Still redirect to dashboard after delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
        return { success: false }

      }
    } catch (error) {
      // Catch-all for unexpected errors
      logger.error('Unexpected error during submission', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: user?.id,
        step: 'unknown'
      })
      const errorMsg = getErrorMessage(error)
      toast.error(errorMsg, { duration: 6000 })
      setLoading(false)
      setProgress({ step: 'error', message: errorMsg, progress: 0 })
      return { success: false }
    }
  }

  return {
    onSubmit,
    loading,
    progress,
  }
}