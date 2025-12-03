// src/components/ReviewForm/index.tsx
//
// Main orchestrator for ReviewForm - composes all sub-components
// Refactored from 1243-line monolith into modular architecture

'use client'

import { motion } from 'framer-motion'
import { Loader2, XCircle } from 'lucide-react'
import { TipoIntestatarioSelector } from './components/TipoIntestatarioSelector'
import { SupplierFields } from './components/SupplierFields'
import { B2CFields } from './components/B2CFields'
import { B2BCompanyFields } from './components/B2BCompanyFields'
import { B2BLegalRepFields } from './components/B2BLegalRepFields'
import { B2BDocumentsSection } from './components/B2BDocumentsSection'
import { DelegationCheckbox } from './components/DelegationCheckbox'
import { SubmitButton } from './components/SubmitButton'
import { useReviewForm } from './hooks/useReviewForm'
import { useFileUploads } from './hooks/useFileUploads'
import { useFormSubmission } from './hooks/useFormSubmission'

// Status Display Component
function StatusDisplay({
  message,
  isError,
  isProcessing,
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
  // Hooks
  const {
    form,
    tipoIntestatario,
    setTipoIntestatario,
    loading: dataLoading,
    currentStatus,
    errorMessage,
  } = useReviewForm()

  const { files, handleFileChange } = useFileUploads()

  const { onSubmit, loading: submitting } = useFormSubmission({ files })

  // Form methods
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = form

  // Loading states
  if (currentStatus === 'LOADING')
    return <StatusDisplay message="Caricamento dati..." isError={false} />
  if (currentStatus === 'PROCESSING')
    return <StatusDisplay message="Il tuo documento è in elaborazione..." isError={false} isProcessing />
  if (currentStatus === 'FAILED')
    return <StatusDisplay message={errorMessage || 'Errore sconosciuto'} isError={true} />

  // Main Form
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Tipo Intestatario Selector */}
      <TipoIntestatarioSelector
        value={tipoIntestatario}
        onChange={setTipoIntestatario}
        setValue={setValue}
        register={register}
      />

      {/* Common Supplier Fields */}
      <SupplierFields register={register} errors={errors} />

      {/* Conditional B2C Fields */}
      {tipoIntestatario === 'privato' && <B2CFields register={register} errors={errors} />}

      {/* Conditional B2B Fields */}
      {tipoIntestatario === 'azienda' && (
        <div className="space-y-0">
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
            richiedenteRuolo={watch('richiedente_ruolo')}
            errors={errors}
          />
        </div>
      )}

      {/* Delegation Checkbox */}
      <DelegationCheckbox register={register} errors={errors} />

      {/* Submit Button */}
      <SubmitButton
        loading={submitting}
        disabled={submitting || currentStatus !== 'SUCCESS'}
        currentStatus={currentStatus}
      />
    </motion.form>
  )
}
