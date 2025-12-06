'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Loader2 } from 'lucide-react'

interface DuplicateData {
  duplicateId: number
  createdAt: string
  status: string
  contractNumber?: string
}

interface DuplicateDetectionModalProps {
  isOpen: boolean
  duplicateData: DuplicateData | null
  isSubmitting: boolean
  onClose: () => void
  onProceed: () => void
}

export function DuplicateDetectionModal({
  isOpen,
  duplicateData,
  isSubmitting,
  onClose,
  onProceed
}: DuplicateDetectionModalProps) {
  if (!isOpen || !duplicateData) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Richiesta Duplicata Rilevata
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Esiste già una disdetta per questo contratto.
              </p>
            </div>
          </div>

          {/* Duplicate Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="space-y-2 text-sm">
              {duplicateData.contractNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Contratto:</span>
                  <span className="font-medium text-gray-900">
                    {duplicateData.contractNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Creata il:</span>
                <span className="font-medium text-gray-900">
                  {new Date(duplicateData.createdAt).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stato:</span>
                <span className="font-medium text-gray-900">
                  {duplicateData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <p className="text-sm text-gray-600 mb-6">
            Procedendo, verrà creata una nuova richiesta di disdetta per lo stesso contratto.
            Vuoi continuare?
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={onProceed}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Invio...</span>
                </>
              ) : (
                <span>Procedi Comunque</span>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}