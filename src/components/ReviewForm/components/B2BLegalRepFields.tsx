// components/B2BLegalRepFields.tsx
//
// Legal Representative fields for B2B:
// - LR Nome, Cognome, Codice Fiscale
// - Richiedente Ruolo (Legale Rappresentante vs Delegato)

import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { type ReviewFormData } from '@/domain/schemas'
import { UserCheck, CreditCard } from 'lucide-react'
import { Tooltip } from '@/components/onboarding/Tooltip'
import { TOOLTIP_CONTENT, TOOLTIP_IDS } from '@/constants/tooltipContent'

export interface B2BLegalRepFieldsProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
}

export function B2BLegalRepFields({ register, errors }: B2BLegalRepFieldsProps) {
  return (
    <>
      {/* Section Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-gray-100">
        <div className="md:col-span-2 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary-600" />
            Legale Rappresentante
          </h3>
        </div>

        {/* LR Nome */}
        <div>
          <label htmlFor="lr_nome" className="block text-sm font-medium text-gray-700 mb-2">
            Nome Legale Rappresentante<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lr_nome"
            {...register('lr_nome')}
            placeholder="Mario"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
          />
          {(errors as any).lr_nome && (
            <p className="mt-1 text-sm text-red-600">{(errors as any).lr_nome.message}</p>
          )}
        </div>

        {/* LR Cognome */}
        <div>
          <label htmlFor="lr_cognome" className="block text-sm font-medium text-gray-700 mb-2">
            Cognome Legale Rappresentante<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lr_cognome"
            {...register('lr_cognome')}
            placeholder="Rossi"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
          />
          {(errors as any).lr_cognome && (
            <p className="mt-1 text-sm text-red-600">{(errors as any).lr_cognome.message}</p>
          )}
        </div>

        {/* LR Codice Fiscale */}
        <div className="md:col-span-2">
          <Tooltip
            id={TOOLTIP_IDS.codiceFiscale}
            content={TOOLTIP_CONTENT.codiceFiscale}
            placement="right"
            trigger="hover"
            dismissable={true}
            className="mb-2"
          >
            <label htmlFor="lr_codice_fiscale" className="block text-sm font-medium text-gray-700">
              Codice Fiscale Legale Rappresentante<span className="text-red-500">*</span>
            </label>
          </Tooltip>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="lr_codice_fiscale"
              {...register('lr_codice_fiscale', {
                onChange: (e) => {
                  // ✅ Transform live: trim + uppercase
                  const value = e.target.value.trim().toUpperCase()
                  e.target.value = value
                }
              })}
              placeholder="RSSMRA80A01H501U"
              className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none uppercase"
              maxLength={16}
            />
          </div>
          {(errors as any).lr_codice_fiscale && (
            <p className="mt-1 text-sm text-red-600">{(errors as any).lr_codice_fiscale.message}</p>
          )}
        </div>

        {/* Richiedente Ruolo */}
        <div className="md:col-span-2 mb-8">
          <Tooltip
            id={TOOLTIP_IDS.ruoloRichiedente}
            content={TOOLTIP_CONTENT.ruoloRichiedente}
            placement="right"
            trigger="hover"
            dismissable={true}
            className="mb-3"
          >
            <label className="block text-sm font-medium text-gray-700">
              Chi sta effettuando questa richiesta?<span className="text-red-500">*</span>
            </label>
          </Tooltip>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-primary-300 cursor-pointer">
              <input
                type="radio"
                {...register('richiedente_ruolo')}
                value="legale_rappresentante"
                defaultChecked
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="font-medium text-gray-900">Legale Rappresentante</div>
                <div className="text-xs text-gray-500">Sono il titolare dei poteri</div>
              </div>
            </label>

            <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-primary-300 cursor-pointer">
              <input
                type="radio"
                {...register('richiedente_ruolo')}
                value="delegato"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
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
      </div>
    </>
  )
}