// src/components/ReviewForm/index.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, XCircle, CheckCircle, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmbeddedPaymentForm } from '@/components/EmbeddedPaymentForm'
import { TipoIntestatarioSelector } from './components/TipoIntestatarioSelector'
import { SupplierFields } from './components/SupplierFields'
import { B2CFields } from './components/B2CFields'
import { B2BCompanyFields } from './components/B2BCompanyFields'
import { B2BLegalRepFields } from './components/B2BLegalRepFields'
import { B2BDocumentsSection } from './components/B2BDocumentsSection'
import { DelegationCheckbox } from './components/DelegationCheckbox'
import { SubmitButton } from './components/SubmitButton'
import { ProgressModal } from './components/ProgressModal'
import { DuplicateDetectionModal } from './components/DuplicateDetectionModal'
import { useReviewForm } from './hooks/useReviewForm'
import { useFileUploads } from './hooks/useFileUploads'
import { useFormSubmission } from './hooks/useFormSubmission'
import type { ReviewFormData } from '@/domain/schemas'
import { DISDETTA_STATUS } from '@/types/enums'

/* ================================== */
/*         Status Display             */
/* ================================== */

function StatusDisplay({
 message,
 isError,
}: {
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
         <XCircle className="h-6 w-6 text-danger-600 mt-0.5" />
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
     <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
     <p className="text-lg text-gray-700">{message}</p>
   </div>
 )
}

/* ================================== */
/*         Main Component             */
/* ================================== */

export default function ReviewForm() {
 const searchParams = useSearchParams()
 const router = useRouter()

 /* ---------- Hooks ---------- */

  const {
    form,
    tipoIntestatario,
    setTipoIntestatario,
    currentStatus,
    errorMessage,
    data,
    profile
  } = useReviewForm()

  const {
    files,
    handleFileChange,
    uploadStates,
    startUpload,
    setUploadProgress,
    completeUpload,
  } = useFileUploads()

  const { onSubmit, sendPEC, loading: submitting, progress } =
    useFormSubmission({
      files,
      profile,
      uploadControls: {
        startUpload,
        setUploadProgress,
        completeUpload,
      },
    })

  /* ---------- State Management ---------- */

  // Duplicate detection
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateData, setDuplicateData] = useState<any>(null)
  const [isBypassSubmitting, setIsBypassSubmitting] = useState(false)

  /* ---------- State Management ---------- */
  type FlowState = 'editing' | 'pending_payment' | 'paid' | 'sending' | 'sent'
  const [flowState, setFlowState] = useState<FlowState>('editing')
  const [confirmedDisdettaId, setConfirmedDisdettaId] = useState<number | null>(null)
  // Payment verification in progress (for UX feedback when returning from 3DS redirect)
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = form

  useEffect(() => {
    if (!data) return
    if (data.id && !confirmedDisdettaId) {
      setConfirmedDisdettaId(data.id)
    }
    if (data.status === DISDETTA_STATUS.PENDING_PAYMENT) {
      setFlowState('pending_payment')
    } else if (data.status === DISDETTA_STATUS.CONFIRMED) {
      setFlowState('paid')
      setValue('delegaCheckbox', true)
    } else if (data.status === DISDETTA_STATUS.SENT) {
      setFlowState('sent')
      setValue('delegaCheckbox', true)
    } else if (data.status === DISDETTA_STATUS.PENDING_REVIEW) {
      setFlowState('editing')
    }
  }, [data, setValue])

  /* ---------- Form Submission ---------- */
  const handleFormSubmit = async (data: ReviewFormData) => {
    // ✅ Save form data to sessionStorage before payment
    try {
      sessionStorage.setItem('review-form-backup', JSON.stringify({
        formData: data,
        timestamp: Date.now()
      }))
    } catch (err) {
      console.warn('Failed to save form backup:', err)
    }
    const result = await onSubmit(data, false)

    if (result?.isDuplicate && result.duplicateData) {
      setDuplicateData(result.duplicateData)
      setShowDuplicateModal(true)
      return
    }

    if (result?.requiresPayment && result.disdettaId) {
      setConfirmedDisdettaId(result.disdettaId)
      setFlowState('pending_payment')
    }
  }

  const handleBypassDuplicate = async () => {
    setIsBypassSubmitting(true)
    setShowDuplicateModal(false)

    const result = await onSubmit(getValues(), true)

    setIsBypassSubmitting(false)
    setDuplicateData(null)

    if (result?.requiresPayment && result.disdettaId) {
      setConfirmedDisdettaId(result.disdettaId)
      setFlowState('pending_payment')
    }
  }

  const handleCloseDuplicateModal = async () => {
    setShowDuplicateModal(false)
    
    const idToDelete = searchParams.get('id')
    
    if (idToDelete) {
      try {
        await fetch('/api/delete-disdetta', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: parseInt(idToDelete, 10) })
        })
        
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (err) {
        console.error('DELETE error:', err)
      }
    }
    
    setDuplicateData(null)
    window.location.href = '/dashboard'
  }

 /* ---------- PEC Sending ---------- */
  const handleSendPEC = async () => {
    if (!confirmedDisdettaId) {
      toast.error('ID disdetta non trovato')
      return
    }

    setFlowState('sending')
    const success = await sendPEC(confirmedDisdettaId)
    setFlowState(success ? 'sent' : 'paid')
  }

 /* ---------- Payment Success Detection ---------- */
  useEffect(() => {
    // 🔒 Cleanup flag to prevent setState after unmount
    let isMounted = true

    const paymentSuccess = searchParams.get('payment_success')
    const paymentCancelled = searchParams.get('payment_cancelled')
    const sessionId = searchParams.get('session_id')
    const idParam = searchParams.get('id')

    // ✅ 1. Robust ID parsing with NaN check
    const parsedId = idParam ? parseInt(idParam, 10) : null
    const validParsedId =
      parsedId !== null && Number.isInteger(parsedId) && parsedId > 0
        ? parsedId
        : null

    // Determine target disdetta ID with fallback cascade
    const targetId = validParsedId ?? confirmedDisdettaId ?? data?.id ?? null

    if (paymentSuccess === 'true') {
      // 🔐 Server-side verification if sessionId available
      if (sessionId) {
        setVerifyingPayment(true)

        ;(async () => {
          try {
            const res = await fetch('/api/stripe/verify-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId }),
            })

            const payload = await res.json().catch(() => ({}))

            if (!isMounted) return // ✅ 2. Prevent setState after unmount

            if (res.ok && payload.ok && payload.paid) {
              if (targetId) setConfirmedDisdettaId(targetId)
              setFlowState('paid')

              toast.success('✅ Pagamento completato! Ora puoi inviare la PEC.', {
                duration: 4000,
                id: 'payment-confirmed',
              })
            } else {
              toast(
                '⏳ Pagamento in verifica. Controlla la tua email per la conferma.',
                {
                  duration: 6000,
                  id: 'payment-pending',
                }
              )
            }
          } catch (err) {
            // ✅ 5. Enhanced error logging
            console.error('Errore verifica pagamento:', err)
            if (err instanceof Error) {
              console.error('Error message:', err.message)
              console.error('Stack trace:', err.stack)
            }

            if (isMounted) {
              toast(
                '⚠️ Errore nella verifica. Controlla la tua email per la conferma.',
                {
                  duration: 4000,
                  id: 'payment-verification-error',
                }
              )
            }
          } finally {
            if (isMounted) {
              setVerifyingPayment(false)

              // Clean payment params, preserve 'id'
              const url = new URL(window.location.href)
              url.searchParams.delete('payment_success')
              url.searchParams.delete('session_id')
              window.history.replaceState({}, '', url.pathname + url.search)
            }
          }
        })()
      } else {
        // Fallback UX (less secure, no sessionId to verify)
        if (targetId) setConfirmedDisdettaId(targetId)
        setFlowState('paid')

        toast.success('✅ Pagamento completato! Ora puoi inviare la PEC.', {
          duration: 4000,
          id: 'payment-confirmed',
        })

        const url = new URL(window.location.href)
        url.searchParams.delete('payment_success')
        window.history.replaceState({}, '', url.pathname + url.search)
      }
    } else if (paymentCancelled === 'true') {
      toast('Pagamento annullato. Puoi riprovare quando vuoi.', {
        duration: 4000,
        id: 'payment-cancelled',
      })

      const url = new URL(window.location.href)
      url.searchParams.delete('payment_cancelled')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.pathname + url.search)
    }

    // Handle return from embedded payment 3DS redirect
    const paymentIntentSuccess = searchParams.get('payment_intent_success')
    const redirectStatus = searchParams.get('redirect_status')

    if (paymentIntentSuccess === 'true' && redirectStatus === 'succeeded') {
      const piId = searchParams.get('payment_intent')

      if (piId && targetId) {
        setVerifyingPayment(true)

        ;(async () => {
          try {
            const res = await fetch('/api/stripe/create-payment-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                disdettaId: targetId,
                paymentIntentId: piId,
              }),
            })

            const payload = await res.json().catch(() => ({}))

            if (!isMounted) return

            if (res.ok && payload.paid) {
              setConfirmedDisdettaId(targetId)
              setFlowState('paid')
              toast.success('Pagamento completato! Ora puoi inviare la PEC.', {
                duration: 4000,
                id: 'payment-confirmed',
              })
            } else {
              // Payment might still be processing
              setConfirmedDisdettaId(targetId)
              setFlowState('pending_payment')
              toast('Pagamento in verifica. Riprova tra qualche secondo.', {
                duration: 6000,
                id: 'payment-pending',
              })
            }
          } catch (err) {
            console.error('Errore verifica payment intent:', err)
            if (isMounted) {
              toast('Errore nella verifica. Riprova.', {
                duration: 4000,
                id: 'payment-verification-error',
              })
            }
          } finally {
            if (isMounted) {
              setVerifyingPayment(false)

              // Clean payment intent params, preserve 'id'
              const url = new URL(window.location.href)
              url.searchParams.delete('payment_intent_success')
              url.searchParams.delete('payment_intent')
              url.searchParams.delete('payment_intent_client_secret')
              url.searchParams.delete('redirect_status')
              window.history.replaceState({}, '', url.pathname + url.search)
            }
          }
        })()
      }
    }

    // ✅ 2. Cleanup function to prevent memory leaks
    return () => {
      isMounted = false
    }
  }, [searchParams, data, confirmedDisdettaId, router])

  /* ---------- Loading States ---------- */
  if (currentStatus === 'LOADING') {

    // Try to restore backup immediately for better UX
    const backupStr = typeof window !== 'undefined' ? sessionStorage.getItem('review-form-backup') : null

    if (backupStr) {
      try {
        const backup = JSON.parse(backupStr)
        Object.entries(backup.formData).forEach(([key, value]) => {
          setValue(key as any, value, { shouldValidate: false })
        })
      } catch (err) {
        console.warn('Failed to restore backup during loading:', err)
      }
    }
    
    return <StatusDisplay message="Caricamento dati..." isError={false} />
  }

  if (currentStatus === DISDETTA_STATUS.PROCESSING) {
    return (
      <StatusDisplay
        message="Il tuo documento è in elaborazione..."
        isError={false}
        isProcessing
      />
    )
  }

  if (currentStatus === 'SUCCESS' && data?.status === DISDETTA_STATUS.SENT) {
    return (
      <div className="text-center py-12 space-y-4">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
        <h3 className="text-xl font-semibold text-gray-900">
          Disdetta già inviata!
        </h3>
        <p className="text-gray-600">
          La tua disdetta è stata inviata con successo. Controlla la dashboard per i dettagli.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 px-6 py-2 bg-gradient-primary text-white rounded-lg"
        >
          Torna alla Dashboard
        </button>
      </div>
    )
  }

  if (currentStatus === DISDETTA_STATUS.FAILED) {
    return (
      <StatusDisplay message={errorMessage || 'Errore sconosciuto'} isError />
    )
  }

  const isFormDisabled = flowState !== 'editing'

  /* ================================== */
  /*            Render                  */
  /* ================================== */

  return (
    <motion.form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Form Fields - Disabled when not editing */}
      <div className={isFormDisabled ? 'pointer-events-none opacity-60' : ''}>
        <TipoIntestatarioSelector
          value={tipoIntestatario}
          onChange={setTipoIntestatario}
          setValue={setValue}
          register={register}
        />

        <SupplierFields register={register} errors={errors} />

        {tipoIntestatario === 'privato' && (
          <B2CFields 
            register={register} 
            errors={errors}
            profile={profile}
            documentoIdentita={files.documentoIdentita}
            onDocumentoChange={handleFileChange.handleDocumentoIdentitaChange}
            uploadingDocumento={uploadStates.documentoIdentita?.uploading ?? false}
          />
        )}

        {tipoIntestatario === 'azienda' && (
          <>
            <B2BCompanyFields
              register={register}
              errors={errors}
              setValue={setValue}
              getValues={getValues}
            />
            <B2BLegalRepFields register={register} errors={errors} />
            <B2BDocumentsSection
              files={files}
              onFileChange={handleFileChange}
              uploadStates={uploadStates}
              richiedenteRuolo={watch('richiedente_ruolo')}
              errors={errors}
            />
          </>
        )}

        <DelegationCheckbox register={register} errors={errors} />
      </div>

      {/* State: EDITING - Submit Button */}
      {flowState === 'editing' && (
        <SubmitButton
          loading={submitting}
          disabled={submitting || currentStatus !== 'SUCCESS'}
          currentStatus={currentStatus}
        />
      )}

      {/* State: PENDING_PAYMENT - Embedded Payment Form */}
      {flowState === 'pending_payment' && confirmedDisdettaId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 text-lg">
                  Dati confermati!
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Procedi al pagamento per completare l&apos;invio della tua disdetta.
                </p>
              </div>
            </div>
          </div>

          <EmbeddedPaymentForm
            disdettaId={confirmedDisdettaId}
            supplierName={data?.supplier_name ?? undefined}
            onSuccess={() => {
              setFlowState('paid')
            }}
          />
        </motion.div>
      )}

      {/* State: PAID - Send PEC Button */}
      {flowState === 'paid' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="rounded-xl border-2 border-green-300 bg-green-50 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 text-lg">
                  Pagamento completato!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Ora puoi procedere con l'invio della PEC alla compagnia.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendPEC}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-primary text-white font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Invio PEC in corso...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Invia PEC
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Modals */}
      {flowState === 'sending' && progress.step !== 'idle' && (
          <ProgressModal progress={progress} />
        )}

      <DuplicateDetectionModal
          isOpen={showDuplicateModal}
          duplicateData={duplicateData}
          onClose={handleCloseDuplicateModal}
        />
    </motion.form>
  )
}