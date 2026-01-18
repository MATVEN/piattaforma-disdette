// components/SupplierFields.tsx
//
// Common supplier fields shown for both B2C and B2B:
// - P.IVA Fornitore (required, 11 digits)
// - POD/PDR/Codice Cliente (optional)
// - IBAN Fornitore (optional, 27 chars)

import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { type ReviewFormData } from '@/domain/schemas'
import { Building2, FileCheck, CreditCard } from 'lucide-react'
import { Tooltip } from '@/components/onboarding/Tooltip'
import { TOOLTIP_CONTENT, TOOLTIP_IDS } from '@/constants/tooltipContent'

export interface SupplierFieldsProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
}

export function SupplierFields({ register, errors }: SupplierFieldsProps) {
  return (
    <>
      {/* P.IVA Fornitore */}
      <div>
        <Tooltip
          id={TOOLTIP_IDS.partitaIvaFornitore}
          content={TOOLTIP_CONTENT.partitaIvaFornitore}
          placement="right"
          trigger="hover"
          dismissable={true}
          className="mb-2"
        >
          <label htmlFor="supplier_tax_id" className="block text-sm font-medium text-gray-700">
            P.IVA Fornitore<span className="text-red-500">*</span>
          </label>
        </Tooltip>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="supplier_tax_id"
            inputMode="numeric"
            maxLength={11}
            autoComplete="off"
            placeholder="es. 15844561009"
            {...register('supplier_tax_id')}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">11 cifre numeriche</p>
        {errors.supplier_tax_id && (
          <p className="mt-1 text-sm text-red-600">{errors.supplier_tax_id.message}</p>
        )}
      </div>

      {/* POD / PDR / Codice Cliente */}
      <div className="py-6">
        <Tooltip
          id={TOOLTIP_IDS.numeroContratto}
          content={TOOLTIP_CONTENT.numeroContratto}
          placement="right"
          trigger="hover"
          dismissable={true}
          className="mb-2"
        >
          <label
            htmlFor="supplier_contract_number"
            className="block text-sm font-medium text-gray-700"
          >
            POD / PDR / Codice Cliente<span className="text-red-500">*</span>
          </label>
        </Tooltip>
        <div className="relative">
          <FileCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="supplier_contract_number"
            autoComplete="off"
            placeholder="es. IT001E12345678 o 10205464"
            {...register('supplier_contract_number')}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          <strong>Energia:</strong> POD (IT...) o PDR (14 cifre) · <strong>Telefonia:</strong>{' '}
          Codice Cliente (8-10 cifre)
        </p>
        {errors.supplier_contract_number && (
          <p className="mt-1 text-sm text-red-600">{errors.supplier_contract_number.message}</p>
        )}
      </div>

      {/* IBAN Fornitore */}
      <div className="md:col-span-2 pb-6">
        <Tooltip
          id={TOOLTIP_IDS.iban}
          content={TOOLTIP_CONTENT.iban}
          placement="right"
          trigger="hover"
          dismissable={true}
          className="mb-2"
        >
          <label htmlFor="supplier_iban" className="block text-sm font-medium text-gray-700">
            IBAN Fornitore
            <span className="ml-1 text-xs text-gray-500 font-normal">(opzionale)</span>
          </label>
        </Tooltip>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="supplier_iban"
            maxLength={27}
            autoComplete="off"
            spellCheck={false}
            placeholder="es. IT60X0542811101000000123456"
            {...register('supplier_iban')}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">27 caratteri (IT + 25 caratteri)</p>
        {errors.supplier_iban && (
          <p className="mt-1 text-sm text-red-600">{errors.supplier_iban.message}</p>
        )}
      </div>
    </>
  )
}
