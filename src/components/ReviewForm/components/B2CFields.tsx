// components/B2CFields.tsx
//
// B2C-specific fields for "Privato" (individual) customers:
// - Nome, Cognome
// - Codice Fiscale (16 chars, uppercase)
// - Indirizzo Residenza

import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { type ReviewFormData } from '@/domain/schemas'
import { Users, User, CreditCard, MapPin } from 'lucide-react'

export interface B2CFieldsProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
}

export function B2CFields({ register, errors }: B2CFieldsProps) {
  return (
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
  )
}
