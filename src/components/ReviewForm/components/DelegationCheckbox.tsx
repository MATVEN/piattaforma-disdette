// components/DelegationCheckbox.tsx
//
// Final delegation checkbox authorizing platform to send PEC
// Required field for form submission
// Includes preview button and expandable legal text

'use client'

import { useState } from 'react'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { type ReviewFormData } from '@/domain/schemas'
import { FileCheck, AlertCircle, Eye, ChevronDown } from 'lucide-react'

export interface DelegationCheckboxProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
}

export function DelegationCheckbox({ register, errors }: DelegationCheckboxProps) {
  const [showLegalText, setShowLegalText] = useState(false)

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4">
      {/* Grid: colonna stretta per checkbox/freccia, centro fluido, destra fissa per Anteprima */}
      <div
        className="grid"
        style={{ gridTemplateColumns: '32px 1fr auto' }} // gap: row 6px, col 8px (più compatto)
      >
        {/* Checkbox (col 1,row1) */}
        <div className="col-start-1 row-start-1 flex items-center justify-center flex-shrink-0 w-8 h-8">
          <input
            id="delegaCheckbox"
            type="checkbox"
            {...register('delegaCheckbox')}
            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer m-0"
          />
        </div>

        {/* Titolo (col 2,row1) - min-w-0 per permettere truncation se lo spazio scende */}
        <div className="col-start-2 row-start-1 min-w-0 flex items-center">
          <label
            htmlFor="delegaCheckbox"
            className="flex items-center space-x-2 font-medium text-gray-900 cursor-pointer w-full"
          >
            <FileCheck className="h-5 w-5 text-primary-600 flex-shrink-0" />
            <span className="truncate">Delega e Autorizzazione alla Piattaforma<span className="text-red-500"> *</span></span>
          </label>
        </div>

        {/* Pulsante Anteprima (col 3,row1) */}
        <div className="col-start-3 row-start-1 flex justify-end items-start">
          <button
            type="button"
            onClick={() => window.open('/api/preview-delega', '_blank')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Anteprima</span>
          </button>
        </div>

        {/* Freccia (col 1,row2) - allineata verticalmente alla checkbox */}
        <div className="col-start-1 row-start-2 flex justify-center">
          <button
            id="legalToggle"
            type="button"
            onClick={() => setShowLegalText(!showLegalText)}
            aria-expanded={showLegalText}
            aria-controls="legalPanel"
            className="text-gray-600 hover:text-gray-900 transition-colors p-0.5 rounded hover:bg-gray-100"
          >
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-200 ${
                showLegalText ? 'rotate-180' : ''
              }`}
            />
            <span className="sr-only">
              {showLegalText ? 'Nascondi testo legale' : 'Mostra testo legale'}
            </span>
          </button>
        </div>

        {/* Descrizione (col 2->3, row2) - occupa tutta la larghezza utile accanto alla colonna checkbox */}
        <div className="col-start-2 col-end-4 row-start-2">
          <p className="text-xs text-gray-500 leading-tight">
            Autorizzo DisdEasy ad agire come mio mandatario nell&apos;invio<br/>della PEC di disdetta
          </p>
        </div>

        {/* Pannello espandibile — ora inizia dalla colonna 1 e arriva fino alla 3: prende tutta la larghezza */}
        {showLegalText && (
          <div
            id="legalPanel"
            role="region"
            aria-labelledby="legalToggle"
            className="col-start-1 col-end-4 row-start-3 mt-1 p-3 bg-white rounded-lg border border-gray-200 text-sm text-gray-600 space-y-2"
            style={{ boxShadow: 'none' }}
          >
            <p className="text-xs text-gray-500">
              Dichiaro di essere il titolare del contratto/utenza e autorizzo DisdEasy S.r.l. ad inviare e gestire per mio conto la richiesta di disdetta nei confronti del gestore indicato, anche tramite PEC, limitatamente alla presente pratica.
            </p>
            <p className="text-xs text-gray-500">
              Dichiaro che i dati forniti sono corretti, autorizzo l’utilizzo della delega e del mio documento d’identità per le finalità indicate e confermo di aver preso visione della delega completa e della Privacy Policy.
            </p>
          </div>
        )}

        {/* Errore (sotto tutto, allineato con il testo) */}
        {errors.delegaCheckbox && (
          <p className="col-start-2 col-end-4 row-start-4 text-sm text-danger-600 flex items-center space-x-1 mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.delegaCheckbox.message}</span>
          </p>
        )}
      </div>
    </div>
  )
}
