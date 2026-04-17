// hooks/useFormSubmission.ts
//
// Handles form submission logic:
// 1. CRITICAL: receiver_tax_id mapping (B2C: codice_fiscale, B2B: lr_codice_fiscale)
// 2. File uploads for B2B (Visura, Documento LR, Delega)
// 3. API calls: confirm-data → send-pec
// 4. Success redirect to dashboard
// 5. Enhanced error handling with user-friendly messages (C23 Day 4)

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { type ReviewFormData } from '@/domain/schemas'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { type SubmissionProgress } from '../components/ProgressModal'
import { logger } from '@/lib/logger'
import { type DisdettaStatus } from '@/types/enums'

/* ================================== */
/*      Error Handling Helpers        */
/* ================================== */

const getErrorMessage = (error: unknown, context?: string): string => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()

    if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
      return 'Errore di connessione. Verifica la tua connessione internet e riprova.'
    }

    if (msg.includes('validation') || msg.includes('required') || msg.includes('obbligatorio')) {
      return 'Alcuni campi obbligatori sono mancanti. Controlla il form e riprova.'
    }

    if (msg.includes('upload') || msg.includes('storage')) {
      return `Errore durante il caricamento ${context ? `di ${context}` : 'dei file'}. Verifica che siano PDF validi e riprova.`
    }

    if (msg.includes('pdf')) {
      return 'Errore durante la generazione della lettera. Contatta il supporto se il problema persiste.'
    }

    if (msg.includes('pec') || msg.includes('email') || msg.includes('invio')) {
      return "Errore durante l'invio della PEC. I tuoi dati sono stati salvati, puoi ritentare dalla Dashboard."
    }

    if (msg.includes('auth') || msg.includes('session') || msg.includes('unauthorized')) {
      return 'Sessione scaduta. Effettua nuovamente il login.'
    }

    return error.message
  }

  return 'Si è verificato un errore imprevisto. Riprova o contatta il supporto.'
}

/* ================================== */
/*           Type Definitions         */
/* ================================== */

interface SubmissionResult {
  success: boolean
  requiresPayment?: boolean
  disdettaId?: number
  isDuplicate?: boolean
  duplicateData?: {
    duplicateId: number
    createdAt: string
    status: DisdettaStatus
    contractNumber?: string
  }
  warning?: string
  operatorMismatchData?: {
    extracted_supplier: string
    selected_operator: string
    similarity: number
  }
}

interface UseFormSubmissionProps {
  files: {
    documentoIdentita: File | null
    documentoLR: File | null
    visuraCamerale: File | null
    delegaFirma: File | null
  }
  profile: {
    documento_identita_path: string | null
  } | null
  uploadControls?: {
    startUpload: {
      startDocumentoIdentitaUpload: () => void
      startDocumentoLRUpload: () => void
      startVisuraCameraleUpload: () => void
      startDelegaFirmaUpload: () => void
    }
    setUploadProgress: {
      setDocumentoIdentitaProgress: (progress: number) => void
      setDocumentoLRProgress: (progress: number) => void
      setVisuraCameraleProgress: (progress: number) => void
      setDelegaFirmaProgress: (progress: number) => void
    }
    completeUpload: {
      completeDocumentoIdentitaUpload: () => void
      completeDocumentoLRUpload: () => void
      completeVisuraCameraleUpload: () => void
      completeDelegaFirmaUpload: () => void
    }
  }
}

export interface UseFormSubmissionReturn {
  onSubmit: (data: ReviewFormData, bypassDuplicate?: boolean, options?: { bypassOperatorCheck?: boolean }) => Promise<SubmissionResult>
  sendPEC: (disdettaId: number, allegaBolletta?: boolean) => Promise<boolean>
  loading: boolean
  progress: SubmissionProgress
}

/* ================================== */
/*          Main Hook                 */
/* ================================== */

export function useFormSubmission({
  files,
  profile,
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

  // mounted guard to avoid state updates after unmount
  const mountedRef = useRef<boolean>(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const setProgressSafe = (p: SubmissionProgress) => {
    if (mountedRef.current) setProgress(p)
  }
  const setLoadingSafe = (v: boolean) => {
    if (mountedRef.current) setLoading(v)
  }

  /* ---------- Helper Functions ---------- */

  const simulateFileProgress = (
    startFn: () => void,
    progressFn: (p: number) => void,
    completeFn: () => void,
    durationMs: number = 1500
    ) => {
    if (!uploadControls) return Promise.resolve()
    return new Promise<void>((resolve) => {
      try {
        startFn()
      } catch (err) {
        logger.warn('Upload control start callback failed', {
          error: err instanceof Error ? err.message : String(err)
        })
      }
      let prog = 0
      const steps = 10
      const interval = durationMs / steps
      const timer = setInterval(() => {
        if (!mountedRef.current) {
          clearInterval(timer)
          resolve()
          return
        }
        prog += 10
        try {
          progressFn(prog)
        } catch (err) {
          logger.warn('Upload control progress callback failed', {
            progress: prog,
            error: err instanceof Error ? err.message : String(err)
          })
        }
        if (prog >= 100) {
          clearInterval(timer)
          try {
            completeFn()
          } catch (err) {
            logger.warn('Upload control complete callback failed', {
              error: err instanceof Error ? err.message : String(err)
            })
          }
          resolve()
        }
      }, interval)
    })
  }

  // Robust PDF validation (name + MIME type)
  const isPdfFile = (f: File | null): boolean => {
    if (!f) return false
    const nameOk = f.name?.toLowerCase().endsWith('.pdf')
    const typeOk = f.type === 'application/pdf'
    return nameOk || typeOk
  }

  // Robust ID parsing with NaN check and >0
  const parseIdFromUrl = (): number | null => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const raw = sp.get('id')
      if (!raw) return null
      const n = Number.parseInt(raw, 10)
      return Number.isFinite(n) && n > 0 ? n : null
    } catch {
      return null
    }
  }

  /* ---------- Form Submission ---------- */

  const onSubmit = async (
    data: ReviewFormData,
    bypassDuplicate = false,
    options?: { bypassOperatorCheck?: boolean }
  ): Promise<SubmissionResult> => {
    setLoadingSafe(true)
    setProgressSafe({ step: 'validating', message: 'Validazione dati...', progress: 5 })

    try {
      /* ===== STEP 0: Authentication ===== */

      if (!user) {
        toast.error('🔒 Sessione scaduta. Effettua nuovamente il login per continuare.', {
          duration: 7000,
          id: 'session-expired',
        })
        router.push('/login')
        return { success: false }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error('🔒 Sessione scaduta. Effettua nuovamente il login per continuare.', {
          duration: 7000,
          id: 'session-expired-verify',
        })
        router.push('/login')
        return { success: false }
      }

      /* ===== CRITICAL: Map receiver_tax_id ===== */

      let receiver_tax_id: string | null = null

      if (data.tipo_intestatario === 'privato') {
        receiver_tax_id = data.codice_fiscale || null
      } else if (data.tipo_intestatario === 'azienda') {
        receiver_tax_id = data.lr_codice_fiscale || null
      }

      /* ===== STEP 1: Validate Required Fields ===== */

      if (!receiver_tax_id) {
        toast.error('⚠️ Codice Fiscale obbligatorio per procedere', {
          duration: 6000,
          id: 'cf-required',
        })
        return { success: false }
      }

      if (!data.supplier_tax_id) {
        toast.error('⚠️ Partita IVA fornitore obbligatoria per procedere', {
          duration: 6000,
          id: 'piva-required',
        })
        return { success: false }
      }

      /* ===== STEP 1.5: Documento Identità (B2C) ===== */
      
      let documentoIdentitaPath: string | null = null
      
      if (data.tipo_intestatario === 'privato') {
        // Verifica documento obbligatorio
        if (!profile?.documento_identita_path && !files.documentoIdentita) {
          toast.error('📄 Documento d\'identità obbligatorio. Caricalo per procedere.', {
            duration: 6000,
            id: 'documento-identita-required',
          })
          return { success: false }
        }
        
        // Upload nuovo documento se presente
        if (files.documentoIdentita) {
          try {
            setProgressSafe({ 
              step: 'uploading', 
              message: 'Caricamento documento d\'identità...', 
              progress: 15 
            })
            
            const docPath = `${user.id}/documento_identita_${Date.now()}.pdf`
            
            const progressPromise = uploadControls
              ? simulateFileProgress(
                  uploadControls.startUpload.startDocumentoIdentitaUpload,
                  uploadControls.setUploadProgress.setDocumentoIdentitaProgress,
                  uploadControls.completeUpload.completeDocumentoIdentitaUpload,
                  1500
                )
              : Promise.resolve()
            
            const { error: docError } = await supabase.storage
              .from('documenti-identita')
              .upload(docPath, files.documentoIdentita, { upsert: true })

            await progressPromise

            if (docError) throw docError

            // ===== Server-side identity document validation =====
            setProgressSafe({
              step: 'validating',
              message: "Validazione documento d'identità...",
              progress: 18
            })

            try {
              const validationRes = await fetch('/api/validate-identity-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  file_path: docPath,
                  bucket: 'documenti-identita'
                })
              })

              const validationData = await validationRes.json()

              if (!validationRes.ok || !validationData.is_valid) {
                // Delete uploaded file (validation failed)
                await supabase.storage
                  .from('documenti-identita')
                  .remove([docPath])

                const errorMsg = validationData.document_type_name
                  ? `Documento non valido. Rilevato: ${validationData.document_type_name}. ${validationData.reason}`
                  : `Documento non valido: ${validationData.reason || "documento d'identità non riconosciuto"}`

                toast.error(errorMsg, { duration: 7000 })
                setProgressSafe({ step: 'error', message: errorMsg, progress: 0 })
                return { success: false }
              }

              logger.info('Identity document validation passed', {
                documentType: validationData.document_type_name,
                userId: user?.id
              })
            } catch (validationError) {
              // Non blocchiamo se la validazione fallisce per errore tecnico
              logger.warn('Identity validation check failed, proceeding anyway', {
                error: validationError instanceof Error ? validationError.message : String(validationError)
              })
            }

            documentoIdentitaPath = docPath

            // Salva path in profilo per riutilizzo futuro
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ documento_identita_path: docPath })
              .eq('user_id', user.id)
            
            if (profileError) {
              logger.warn('Failed to update profile with documento path', {
                error: profileError.message,
                userId: user.id,
              })
              // Non blocchiamo il flusso, il documento è comunque uploadato
            }
            
          } catch (err) {
            logger.error('Errore upload Documento Identità', {
              error: err instanceof Error ? err.message : String(err),
              userId: user?.id,
              step: 'upload-documento-identita',
            })
            const errorMsg = getErrorMessage(err, 'Documento Identità')
            toast.error(errorMsg, { duration: 6000 })
            setProgressSafe({ step: 'error', message: errorMsg, progress: 0 })
            return { success: false }
          }
        } else {
          // Usa documento esistente dal profilo
          documentoIdentitaPath = profile?.documento_identita_path ?? null
        }
      }

      /* ===== STEP 2: File Upload (B2B) ===== */

      let visuraPath: string | null = null
      let delegaPath: string | null = null
      let documentoPath: string | null = null

      if (data.tipo_intestatario === 'azienda') {
        setProgressSafe({ step: 'uploading', message: 'Caricamento documenti...', progress: 25 })

        // Validate files exist AND are PDFs
        if (!files.visuraCamerale || !isPdfFile(files.visuraCamerale)) {
          const msg = '📄 Visura Camerale obbligatoria (PDF). Carica il documento per procedere.'
          toast.error(msg, { duration: 6000, id: 'visura-required' })
          return { success: false }
        }

        if (!files.documentoLR || !isPdfFile(files.documentoLR)) {
          const msg = "📄 Documento d'identità LR obbligatorio (PDF). Carica il documento per procedere."
          toast.error(msg, { duration: 6000, id: 'documento-lr-required' })
          return { success: false }
        }

        if (
          data.richiedente_ruolo === 'delegato' &&
          (!files.delegaFirma || !isPdfFile(files.delegaFirma))
        ) {
          const msg = '📄 Delega firmata obbligatoria (PDF). Carica il documento per procedere.'
          toast.error(msg, { duration: 6000, id: 'delega-required' })
          return { success: false }
        }

        // Upload Visura Camerale
        try {
          setProgressSafe({ step: 'uploading', message: 'Caricamento Visura Camerale...', progress: 30 })
          const visuraFilePath = `${user.id}/${Date.now()}_visura.pdf`

          const progressPromise = uploadControls
            ? simulateFileProgress(
                uploadControls.startUpload.startVisuraCameraleUpload,
                uploadControls.setUploadProgress.setVisuraCameraleProgress,
                uploadControls.completeUpload.completeVisuraCameraleUpload,
                1500
              )
            : Promise.resolve()

          const { error: visuraError } = await supabase.storage
            .from('documenti-identita')
            .upload(visuraFilePath, files.visuraCamerale!, { upsert: true })

          await progressPromise

          if (visuraError) throw visuraError
          visuraPath = visuraFilePath
        } catch (err) {
          logger.error('Errore upload Visura Camerale', {
            error: err instanceof Error ? err.message : String(err),
            userId: user?.id,
            step: 'upload-visura',
          })
          const errorMsg = getErrorMessage(err, 'Visura Camerale')
          toast.error(errorMsg, { duration: 6000 })
          setProgressSafe({ step: 'error', message: errorMsg, progress: 0 })
          return { success: false }
        }

        // Upload Documento LR
        try {
          setProgressSafe({ step: 'uploading', message: 'Caricamento Documento LR...', progress: 40 })
          const docFilePath = `${user.id}/${Date.now()}_documento_lr.pdf`

          const progressPromise = uploadControls
            ? simulateFileProgress(
                uploadControls.startUpload.startDocumentoLRUpload,
                uploadControls.setUploadProgress.setDocumentoLRProgress,
                uploadControls.completeUpload.completeDocumentoLRUpload,
                1500
              )
            : Promise.resolve()

          const { error: docError } = await supabase.storage
            .from('documenti-identita')
            .upload(docFilePath, files.documentoLR!, { upsert: true })

          await progressPromise

          if (docError) throw docError

          // ===== Server-side identity document validation for LR =====
          setProgressSafe({
            step: 'validating',
            message: "Validazione documento LR...",
            progress: 45
          })

          try {
            const validationRes = await fetch('/api/validate-identity-document', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file_path: docFilePath,
                bucket: 'documenti-identita'
              })
            })

            const validationData = await validationRes.json()

            if (!validationRes.ok || !validationData.is_valid) {
              // Delete uploaded file (validation failed)
              await supabase.storage
                .from('documenti-identita')
                .remove([docFilePath])

              const errorMsg = validationData.document_type_name
                ? `Documento LR non valido. Rilevato: ${validationData.document_type_name}. ${validationData.reason}`
                : `Documento LR non valido: ${validationData.reason || "documento d'identità non riconosciuto"}`

              toast.error(errorMsg, { duration: 7000 })
              setProgressSafe({ step: 'error', message: errorMsg, progress: 0 })
              return { success: false }
            }

            logger.info('LR identity document validation passed', {
              documentType: validationData.document_type_name,
              userId: user?.id
            })
          } catch (validationError) {
            // Non blocchiamo se la validazione fallisce per errore tecnico
            logger.warn('LR identity validation check failed, proceeding anyway', {
              error: validationError instanceof Error ? validationError.message : String(validationError)
            })
          }

          documentoPath = docFilePath
        } catch (err) {
          logger.error('Errore upload Documento LR', {
            error: err instanceof Error ? err.message : String(err),
            userId: user?.id,
            step: 'upload-documento-lr',
          })
          const errorMsg = getErrorMessage(err, 'Documento Legale Rappresentante')
          toast.error(errorMsg, { duration: 6000 })
          setProgressSafe({ step: 'error', message: errorMsg, progress: 0 })
          return { success: false }
        }

        // Upload Delega (if delegato)
        if (data.richiedente_ruolo === 'delegato' && files.delegaFirma) {
          try {
            setProgressSafe({ step: 'uploading', message: 'Caricamento Delega...', progress: 50 })

            const delegaFilePath = `${user.id}/${Date.now()}_delega.pdf`

            const progressPromise = uploadControls
              ? simulateFileProgress(
                  uploadControls.startUpload.startDelegaFirmaUpload,
                  uploadControls.setUploadProgress.setDelegaFirmaProgress,
                  uploadControls.completeUpload.completeDelegaFirmaUpload,
                  1500
                )
              : Promise.resolve()

            const { error: delegaError } = await supabase.storage
              .from('documenti-identita')
              .upload(delegaFilePath, files.delegaFirma!, { upsert: true })

            await progressPromise

            if (delegaError) throw delegaError
            delegaPath = delegaFilePath
          } catch (err) {
            logger.error('Errore upload Delega', {
              error: err instanceof Error ? err.message : String(err),
              userId: user?.id,
              step: 'upload-delega',
            })
            const errorMsg = getErrorMessage(err, 'Delega Firmata')
            toast.error(errorMsg, { duration: 6000 })
            setProgressSafe({ step: 'error', message: errorMsg, progress: 0 })
            return { success: false }
          }
        }
      }

      /* ===== STEP 3: Confirm Data (API Call) ===== */

      setProgressSafe({ step: 'confirming', message: 'Conferma dati in corso...', progress: 60 })

      const urlId = parseIdFromUrl()

      const payload = {
        id: urlId ?? undefined,
        ...data,
        receiver_tax_id,
        visura_camerale_path: visuraPath,
        delega_firma_path: delegaPath,
        bypassDuplicateCheck: bypassDuplicate,
        bypassOperatorCheck: options?.bypassOperatorCheck ?? false,
      }

      const response = await fetch('/api/confirm-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      logger.debug('API response received', {
        status: response.status,
        endpoint: '/api/confirm-data',
        userId: user?.id,
      })

      // Double protection JSON parsing
      let responseData: any = {}
      try {
        responseData = await response.json().catch(() => ({}))
      } catch (parseErr) {
        logger.error('Failed to parse /api/confirm-data response', {
          error: parseErr instanceof Error ? parseErr.message : String(parseErr),
          userId: user?.id,
        })
        toast.error('Errore di comunicazione con il server', { duration: 6000 })
        setProgressSafe({ step: 'idle', message: '', progress: 0 })
        return { success: false }
      }

      /* ===== Handle Response ===== */

      // Check for operator mismatch warning (status 200 with warning flag)
      if (response.ok && responseData.warning === 'operator_mismatch') {
        logger.info('Operator mismatch warning', {
          data: responseData.data,
          userId: user?.id,
          step: 'operator-mismatch',
        })
        setProgressSafe({ step: 'idle', message: '', progress: 0 })
        return {
          success: false,
          warning: 'operator_mismatch',
          operatorMismatchData: responseData.data,
        }
      }

      if (!response.ok) {
        // Check for duplicate detection
        const isDuplicateError =
          response.status === 409 ||
          (response.status === 400 &&
            responseData.details &&
            responseData.code === 'VALIDATION_ERROR')

        if (isDuplicateError && responseData.details) {
          logger.info('Duplicate detected', {
            details: responseData.details,
            userId: user?.id,
            step: 'duplicate-detection',
          })
          setProgressSafe({ step: 'idle', message: '', progress: 0 })
          return {
            success: false,
            isDuplicate: true,
            duplicateData: responseData.details,
          }
        }

        // Regular error
        logger.warn('confirm-data failed', {
          status: response.status,
          error: responseData.error,
          userId: user?.id,
        })
        const errorMsg = responseData.error || 'Errore conferma dati'
        toast.error(`Errore salvataggio dati: ${errorMsg}`, { duration: 6000 })
        setProgressSafe({ step: 'idle', message: '', progress: 0 })
        return { success: false }
      }

      /* ===== Success - Prefer server-returned ID ===== */

      // Fallback cascade: server response → URL id
      const returnedId =
        (responseData?.id ?? responseData?.disdettaId ?? urlId) ?? null
      const disdettaId =
        returnedId !== null && Number.isFinite(Number(returnedId)) && Number(returnedId) > 0
          ? Number(returnedId)
          : null

      logger.info('Data confirmed successfully', {
        disdettaId,
        userId: user?.id,
        tipoIntestatario: data.tipo_intestatario,
      })

      setProgressSafe({ step: 'success', message: 'Dati confermati!', progress: 100 })
      toast.success('✅ Dati confermati! Procedi al pagamento.', {
        duration: 3000,
        id: 'data-confirmed',
      })

      // refresh server data so UI reflects DB updates (webhook may update DB shortly)
      try {
        router.refresh()
      } catch (err) {
        logger.warn('router.refresh failed', { error: err instanceof Error ? err.message : String(err) })
      }

      return {
        success: true,
        requiresPayment: true,
        disdettaId: disdettaId ?? undefined,
      }
    } catch (err) {
      logger.error('Unexpected error during submission', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        userId: user?.id,
        step: 'unknown',
      })
      const errorMsg = getErrorMessage(err)
      toast.error(errorMsg, { duration: 6000 })
      setProgressSafe({ step: 'error', message: errorMsg, progress: 0 })
      return { success: false }
    } finally {
      setLoadingSafe(false)
    }
  }

  /* ---------- Separate PEC Sending ---------- */

  const sendPEC = async (disdettaId: number, allegaBolletta = false): Promise<boolean> => {
    setLoadingSafe(true)
    setProgressSafe({
      step: 'sending',
      message: 'Generazione PDF e invio PEC...',
      progress: 75,
    })

    try {
      const pecResponse = await fetch('/api/send-pec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: disdettaId, allegaBolletta }),
      })

      if (!pecResponse.ok) {
        const pecError = await pecResponse.json().catch(() => ({}))
        throw new Error(pecError.error || 'Errore invio PEC')
      }

      setProgressSafe({ step: 'success', message: 'PEC inviata con successo!', progress: 100 })
      logger.info('PEC sent successfully', {
        id: disdettaId,
        userId: user?.id,
        step: 'pec-sent',
      })

      toast.success('🎉 PEC inviata! Verrai reindirizzato alla Dashboard...', {
        duration: 2500,
        id: 'pec-success',
      })

      setTimeout(() => {
        router.push('/dashboard?success=pec_sent')
      }, 1200)

      return true
    } catch (err) {
      logger.error('PEC sending failed', {
        error: err instanceof Error ? err.message : String(err),
        id: disdettaId,
        userId: user?.id,
        step: 'pec-send',
      })
      const errorMsg = getErrorMessage(err, 'invio PEC')
      toast.error(errorMsg, { duration: 6000 })
      setProgressSafe({ step: 'error', message: errorMsg, progress: 0 })
      return false
    } finally {
      setLoadingSafe(false)
    }
  }

  return {
    onSubmit,
    sendPEC,
    loading,
    progress,
  }
}