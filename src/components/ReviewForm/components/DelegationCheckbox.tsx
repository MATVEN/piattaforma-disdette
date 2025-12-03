// components/DelegationCheckbox.tsx
//
// Final delegation checkbox authorizing platform to send PEC
// Required field for form submission

import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { type ReviewFormData } from '@/domain/schemas'
import { FileCheck, AlertCircle } from 'lucide-react'

export interface DelegationCheckboxProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
}

export function DelegationCheckbox({ register, errors }: DelegationCheckboxProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6">
      <div className="flex items-start space-x-3">
        <input
          id="delegaCheckbox"
          type="checkbox"
          {...register('delegaCheckbox')}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
        <div className="flex-1">
          <label
            htmlFor="delegaCheckbox"
            className="flex items-center space-x-2 font-medium text-gray-900 cursor-pointer"
          >
            <FileCheck className="h-5 w-5 text-primary-600" />
            <span>Delega e Autorizzazione alla Piattaforma *</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Autorizzo DisdettaFacile ad agire come mio mandatario nell'invio della PEC di
            disdetta
          </p>
          {errors.delegaCheckbox && (
            <p className="mt-2 text-sm text-danger-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.delegaCheckbox.message}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
