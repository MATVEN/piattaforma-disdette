// components/B2CFields.tsx
//
// B2C-specific fields for "Privato" (individual) customers:
// - Nome, Cognome
// - Codice Fiscale (16 chars, uppercase)
// - Indirizzo Residenza
// - Documento Identità

import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { type ReviewFormData } from '@/domain/schemas'
import { Users, User, CreditCard, MapPin, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Tooltip } from '@/components/onboarding/Tooltip'
import { TOOLTIP_CONTENT, TOOLTIP_IDS } from '@/constants/tooltipContent'

// ✅ Type per UserProfile
interface UserProfile {
  nome: string | null
  cognome: string | null
  codice_fiscale: string | null
  indirizzo_residenza: string | null
  documento_identita_path: string | null
}

export interface B2CFieldsProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
  // ✅ AGGIUNTE
  profile: UserProfile | null
  documentoIdentita: File | null
  onDocumentoChange: (file: File | null) => void
  uploadingDocumento: boolean
  allegaBolletta: boolean
  onAllegaBollettaChange: (value: boolean) => void
}

export function B2CFields({
  register,
  errors,
  profile,
  documentoIdentita,
  onDocumentoChange,
  uploadingDocumento,
  allegaBolletta,
  onAllegaBollettaChange,
}: B2CFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-gray-100 py-6">
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-600" />
          Dati Intestatario Privato
        </h3>
      </div>

      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
          Nome<span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="nome"
            {...register('nome')}
            placeholder="Mario"
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
          />
        </div>
        {(errors as any).nome && (
          <p className="mt-1 text-sm text-red-600">{(errors as any).nome.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="cognome" className="block text-sm font-medium text-gray-700 mb-2">
          Cognome<span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="cognome"
            {...register('cognome')}
            placeholder="Rossi"
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
          />
        </div>
        {(errors as any).cognome && (
          <p className="mt-1 text-sm text-red-600">{(errors as any).cognome.message}</p>
        )}
      </div>

      <div className="md:col-span-2">
        <Tooltip
          id={TOOLTIP_IDS.codiceFiscale}
          content={TOOLTIP_CONTENT.codiceFiscale}
          placement="right"
          trigger="hover"
          dismissable={true}
          className="mb-2"
        >
          <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700">
            Codice Fiscale<span className="text-red-500">*</span>
          </label>
        </Tooltip>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="codice_fiscale"
            {...register('codice_fiscale', {
              onChange: (e) => {
                const value = e.target.value.trim().toUpperCase()
                e.target.value = value
              }
            })}
            placeholder="RSSMRA80A01H501U"
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none uppercase"
            maxLength={16}
          />
        </div>
        {(errors as any).codice_fiscale && (
          <p className="mt-1 text-sm text-red-600">{(errors as any).codice_fiscale.message}</p>
        )}
      </div>

      <div className="md:col-span-2">
        <Tooltip
          id={TOOLTIP_IDS.indirizzo}
          content={TOOLTIP_CONTENT.indirizzo}
          placement="right"
          trigger="hover"
          dismissable={true}
          className="mb-2"
        >
          <label htmlFor="indirizzo_residenza" className="block text-sm font-medium text-gray-700">
            Indirizzo di Residenza<span className="text-red-500">*</span>
          </label>
        </Tooltip>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="indirizzo_residenza"
            {...register('indirizzo_residenza')}
            placeholder="Via Roma 123, 00100 Roma"
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
          />
        </div>
        {(errors as any).indirizzo_residenza && (
          <p className="mt-1 text-sm text-red-600">{(errors as any).indirizzo_residenza.message}</p>
        )}
      </div>

      {/* ✅ Documento Identità */}
      <div className="md:col-span-2 space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Documento d'identità *
          <span className="text-xs text-gray-500 ml-2">
            (Carta d'identità o passaporto, fronte e retro)
          </span>
        </label>
        
        {/* Documento già presente nel profilo */}
        {profile?.documento_identita_path && !documentoIdentita && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Documento dal tuo profilo
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('documento-identita-b2c') as HTMLInputElement
                  if (input) input.click()
                }}
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              >
                Sostituisci
              </button>
            </div>
          </div>
        )}
        
        {/* Campo upload */}
        <input
          id="documento-identita-b2c"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              onDocumentoChange(file)
            }
          }}
          className={`
            block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-primary-50 file:text-primary-700
            hover:file:bg-primary-100
            cursor-pointer
            ${profile?.documento_identita_path && !documentoIdentita ? 'hidden' : ''}
          `}
        />
        
        {/* File uploadato */}
        {documentoIdentita && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span>{documentoIdentita.name}</span>
            <button
              type="button"
              onClick={() => onDocumentoChange(null)}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Warning se manca */}
        {!profile?.documento_identita_path && !documentoIdentita && (
          <p className="text-xs text-amber-600 flex items-start gap-1">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Il documento è obbligatorio per procedere</span>
          </p>
        )}
        
        {/* Upload in corso */}
        {uploadingDocumento && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Caricamento in corso...</span>
          </div>
        )}
      </div>

      {/* Checkbox: allega documento originale */}
      <div className="md:col-span-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={allegaBolletta}
            onChange={(e) => onAllegaBollettaChange(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Allega anche il documento caricato</span>
            <span className="text-gray-500 ml-1">
              (bolletta, contratto, modulo — non sempre obbligatorio)
            </span>
          </span>
        </label>
      </div>
    </div>
  )
}