// components/B2BDocumentsSection.tsx
//
// B2B document uploads section:
// - Documento Identità LR (required)
// - Visura Camerale (required, max 30 days)
// - Delega Firmata (conditional on richiedente_ruolo === 'delegato')
// - Info boxes explaining requirements

import { FieldErrors } from 'react-hook-form'
import { type ReviewFormData } from '@/domain/schemas'
import { FileText, Info } from 'lucide-react'
import { FileUploadField } from '@/components/FileUploadField'
import {
  ALLOWED_ID_DOCUMENT_TYPES,
  ALLOWED_BUSINESS_DOCUMENT_TYPES,
} from '@/domain/schemas'

interface B2BDocumentsSectionProps {
  files: {
    documentoLR: File | null
    visuraCamerale: File | null
    delegaFirma: File | null
  }
  onFileChange: {
    handleDocumentoLRChange: (file: File | null) => void
    handleVisuraCameraleChange: (file: File | null) => void
    handleDelegaFirmaChange: (file: File | null) => void
  }
  uploadStates: {
    documentoLR: { uploading: boolean; progress: number }
    visuraCamerale: { uploading: boolean; progress: number }
    delegaFirma: { uploading: boolean; progress: number }
  }
  richiedenteRuolo: 'legale_rappresentante' | 'delegato' | null
  errors: any
}

export function B2BDocumentsSection({
  files,
  onFileChange,
  uploadStates, // ← ADD THIS
  richiedenteRuolo,
  errors,
}: B2BDocumentsSectionProps) {
  return (
    <>
      {/* Section Header */}
      <div className="md:col-span-2 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-600" />
          Documenti Richiesti
        </h3>
      </div>

      {/* Documento Identità LR */}
      <div className="md:col-span-2">
        <FileUploadField
          label="Documento Identità Legale Rappresentante"
          accept={ALLOWED_ID_DOCUMENT_TYPES.join(',')}
          onChange={onFileChange.handleDocumentoLRChange}
          currentFile={files.documentoLR}
          uploading={uploadStates.documentoLR.uploading}
          uploadProgress={uploadStates.documentoLR.progress}
          helpText="PDF, PNG o JPG - Max 5MB"
          required
          error={errors.documento_lr_path?.message}
        />
      </div>

      {/* Visura Camerale */}
      <div className="md:col-span-2">
        <FileUploadField
          label="Visura Camerale (recente)"
          accept={ALLOWED_BUSINESS_DOCUMENT_TYPES.join(',')}
          onChange={onFileChange.handleVisuraCameraleChange}
          currentFile={files.visuraCamerale}
          uploading={uploadStates.visuraCamerale.uploading}
          uploadProgress={uploadStates.visuraCamerale.progress}
          helpText="PDF - Max 5MB - Necessaria per provare i poteri di firma (max 30 giorni)"
          required
          error={errors.visura_camerale_path?.message}
        />
      </div>

      {/* Conditional: Delega for Delegato */}
      {richiedenteRuolo === 'delegato' && (
        <>
          {/* Info Box - Two Delegations Explanation */}
          <div className="md:col-span-2 bg-blue-50/80 backdrop-blur-xl rounded-xl border border-blue-100 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">📄 Due deleghe necessarie per i delegati</p>
                <p className="text-blue-700">
                  1. <strong>Delega aziendale interna</strong> (carica qui sotto): Documento firmato
                  dal Legale Rappresentante che ti conferisce i poteri di agire per l'azienda.
                </p>
                <p className="text-blue-700 mt-1">
                  2. <strong>Delega alla piattaforma</strong> (checkbox a fine form): Autorizzi
                  DisdettaFacile ad inviare la PEC per tuo conto.
                </p>
              </div>
            </div>
          </div>

          {/* Delega Upload Field */}
          <div className="md:col-span-2">
            <FileUploadField
              label="Delega Firmata dal Legale Rappresentante"
              accept={ALLOWED_BUSINESS_DOCUMENT_TYPES.join(',')}
              onChange={onFileChange.handleDelegaFirmaChange}
              currentFile={files.delegaFirma}
              uploading={uploadStates.delegaFirma.uploading}
              uploadProgress={uploadStates.delegaFirma.progress}
              helpText="PDF firmato dal Legale Rappresentante - Max 5MB"
              required
              error={errors.delega_firma_path?.message}
            />
          </div>
        </>
      )}

      {/* Info Card - B2B Requirements */}
      <div className="md:col-span-2 mt-4 bg-blue-50/80 backdrop-blur-xl rounded-xl border border-blue-100 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">📋 Documenti Obbligatori per Aziende</p>
            <p className="text-blue-700">
              Per le disdette aziendali è necessaria la Visura Camerale (massimo 30 giorni) per
              provare i poteri di firma del Legale Rappresentante. Se non sei il LR, serve anche una
              delega firmata.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}