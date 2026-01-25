// src/components/ReviewForm/components/ProgressModal.tsx
// Progress modal to show multi-step submission progress

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, Upload, Database, Mail } from 'lucide-react'

export interface SubmissionProgress {
  step: 'idle' | 'validating' | 'uploading' | 'confirming' | 'sending' | 'success' | 'error'
  message: string
  progress: number // 0-100
}

interface ProgressModalProps {
  progress: SubmissionProgress
}

export function ProgressModal({ progress }: ProgressModalProps) {
  if (progress.step === 'idle') return null

  const steps = [
    {
      id: 'uploading',
      label: 'Upload',
      icon: Upload,
    },
    {
      id: 'confirming',
      label: 'Salvataggio',
      icon: Database,
    },
    {
      id: 'sending',
      label: 'Invio PEC',
      icon: Mail,
    },
  ]

  const getStepStatus = (stepId: string): 'pending' | 'active' | 'completed' => {
    const currentIndex = steps.findIndex((s) => s.id === progress.step)
    const stepIndex = steps.findIndex((s) => s.id === stepId)

    if (progress.step === 'success') return 'completed'
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {progress.step === 'success' ? 'Completato!' : 'Elaborazione in corso...'}
            </h3>
            <p className="text-gray-600">{progress.message}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="bg-gradient-to-r from-primary-500 to-secondary-600 h-full rounded-full"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">{progress.progress}%</p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-start mb-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id)
              const Icon = step.icon

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  {/* Icon Circle */}
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor:
                        status === 'completed'
                          ? '#10b981'
                          : status === 'active'
                          ? '#6366f1'
                          : '#e5e7eb',
                      scale: status === 'active' ? 1.1 : 1,
                    }}
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-2 relative z-20 bg-white"
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    ) : status === 'active' ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Icon className="h-6 w-6 text-gray-400" />
                    )}
                  </motion.div>

                  {/* Label */}
                  <p className={`text-xs font-medium text-center relative z-20 ${
                    status === 'active'
                      ? 'text-primary-600'
                      : status === 'completed'
                      ? 'text-green-600'
                      : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Connecting Lines */}
          <div className="flex justify-between items-center -mt-16 mb-12 px-6 relative z-0">
            {steps.slice(0, -1).map((_, index) => {
              const nextStep = steps[index + 1]
              const status = getStepStatus(nextStep.id)

              return (
                <motion.div
                  key={index}
                  initial={false}
                  animate={{
                    backgroundColor: status === 'pending' ? '#e5e7eb' : '#10b981',
                  }}
                  className="flex-1 h-1 mx-2"
                />
              )
            })}
          </div>

          {/* Success Message */}
          {progress.step === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-0 p-4 bg-green-50 rounded-lg border border-green-200 relative z-10"
            >
              <p className="text-sm text-green-800 text-center font-medium">
                ✅ Operazione completata con successo!
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}