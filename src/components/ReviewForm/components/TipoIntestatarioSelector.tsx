// components/TipoIntestatarioSelector.tsx
//
// Two-button selector for choosing between Privato (B2C) and Azienda (B2B)
// Updates both local state and form state

import { UseFormSetValue, UseFormRegister } from 'react-hook-form'
import { type ReviewFormData } from '@/domain/schemas'
import { Users, Building2 } from 'lucide-react'

export interface TipoIntestatarioSelectorProps {
  value: 'privato' | 'azienda'
  onChange: (value: 'privato' | 'azienda') => void
  setValue: UseFormSetValue<ReviewFormData>
  register: UseFormRegister<ReviewFormData>
}

export function TipoIntestatarioSelector({
  value,
  onChange,
  setValue,
  register,
}: TipoIntestatarioSelectorProps) {
  const handleChange = (newValue: 'privato' | 'azienda') => {
    onChange(newValue)
    setValue('tipo_intestatario', newValue)
  }

  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Tipo intestatario contratto *
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleChange('privato')}
          className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
            value === 'privato'
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
          onClick={() => handleChange('azienda')}
          className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
            value === 'azienda'
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

      {/* Hidden input for form registration */}
      <input type="hidden" {...register('tipo_intestatario')} value={value} />
    </div>
  )
}
