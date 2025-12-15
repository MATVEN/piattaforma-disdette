// components/B2BCompanyFields.tsx
//
// B2B company data fields:
// - Ragione Sociale, Partita IVA, Sede Legale
// - Indirizzo Fornitura, Indirizzo Fatturazione
// - Checkbox to sync fatturazione with sede legale

import { useState } from 'react'
import { UseFormRegister, UseFormSetValue, UseFormGetValues, FieldErrors } from 'react-hook-form'
import { type ReviewFormData } from '@/domain/schemas'
import { Building2, MapPin, Home, FileText } from 'lucide-react'
import { Tooltip } from '@/components/onboarding/Tooltip'
import { TOOLTIP_CONTENT, TOOLTIP_IDS } from '@/constants/tooltipContent'

export interface B2BCompanyFieldsProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
  setValue: UseFormSetValue<ReviewFormData>
  getValues: UseFormGetValues<ReviewFormData>
}

export function B2BCompanyFields({ register, errors, setValue, getValues }: B2BCompanyFieldsProps) {
  const [indirizzoFatturazioneUguale, setIndirizzoFatturazioneUguale] = useState(true)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-gray-100 pt-6 mb-4">
      {/* Section Header */}
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary-600" />
          Dati Azienda
        </h3>
      </div>

      {/* Ragione Sociale */}
      <div>
        <Tooltip
          id={TOOLTIP_IDS.ragioneSociale}
          content={TOOLTIP_CONTENT.ragioneSociale}
          placement="right"
          trigger="hover"
          dismissable={true}
          className="mb-2"
        >
          <label htmlFor="ragione_sociale" className="block text-sm font-medium text-gray-700">
            Ragione Sociale<span className="text-red-500">*</span>
          </label>
        </Tooltip>
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

      {/* Partita IVA */}
      <div>
        <Tooltip
          id={TOOLTIP_IDS.partitaIva}
          content={TOOLTIP_CONTENT.partitaIva}
          placement="right"
          trigger="hover"
          dismissable={true}
          className="mb-2"
        >
          <label htmlFor="partita_iva" className="block text-sm font-medium text-gray-700">
            Partita IVA<span className="text-red-500">*</span>
          </label>
        </Tooltip>
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

      {/* Sede Legale */}
      <div className="md:col-span-2">
        <Tooltip
          id={TOOLTIP_IDS.sedeLegale}
          content={TOOLTIP_CONTENT.sedeLegale}
          placement="right"
          trigger="hover"
          dismissable={true}
          className="mb-2"
        >
          <label htmlFor="sede_legale" className="block text-sm font-medium text-gray-700">
            Sede Legale<span className="text-red-500">*</span>
          </label>
        </Tooltip>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="sede_legale"
            {...register('sede_legale')}
            onChange={(e) => {
              // If checkbox checked, copy automatically
              if (indirizzoFatturazioneUguale) {
                setValue('indirizzo_fatturazione', e.target.value)
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

      {/* Indirizzo Fornitura */}
      <div className="md:col-span-2 mb-4">
        <Tooltip
          id={TOOLTIP_IDS.indirizzoFornitura}
          content={TOOLTIP_CONTENT.indirizzoFornitura}
          placement="right"
          trigger="hover"
          dismissable={true}
          className="mb-2"
        >
          <label htmlFor="indirizzo_fornitura" className="block text-sm font-medium text-gray-700">
            Indirizzo Fornitura<span className="text-red-500">*</span>
          </label>
        </Tooltip>
        <div className="relative mb-2">
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
        {/* Checkbox: Indirizzo Fatturazione uguale a Sede Legale */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={indirizzoFatturazioneUguale}
              onChange={(e) => {
                const isChecked = e.target.checked
                setIndirizzoFatturazioneUguale(isChecked)

                if (isChecked) {
                  // Copy sede_legale to indirizzo_fatturazione
                  const sedeLegale = getValues('sede_legale')
                  setValue('indirizzo_fatturazione', sedeLegale || '')
                } else {
                  // Clear the field if unchecked
                  setValue('indirizzo_fatturazione', '')
                }
              }}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Indirizzo fatturazione uguale a sede legale</span>
          </label>
        </div>
      </div>

      {/* Indirizzo Fatturazione (conditional) */}
      {!indirizzoFatturazioneUguale && (
        <div className="md:col-span-2">
          <label
            htmlFor="indirizzo_fatturazione"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Indirizzo Fatturazione<span className="text-red-500">*</span>
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
            <p className="mt-1 text-sm text-red-600">
              {(errors as any).indirizzo_fatturazione.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}