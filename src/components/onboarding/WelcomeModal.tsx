'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, CheckCircle, FileText, Send } from 'lucide-react'
import { useOnboarding } from '@/context/OnboardingContext'

export function WelcomeModal() {
    const { isFirstVisit, isLoading, startTour, markAsReturningUser } = useOnboarding()
    const [dontShowAgain, setDontShowAgain] = useState(false)
    const [isVisible, setIsVisible] = useState(true)

    if (isLoading) return null

    if (isLoading) {
        return null
    }

    // Don't render if not first visit or already dismissed
    if (!isFirstVisit || !isVisible) {
        return null
    }

    // handleStartTour
    const handleStartTour = () => {
        if (dontShowAgain) {
            markAsReturningUser()
        }
        setIsVisible(false)
        startTour()
    }

    // handleSkip
    const handleSkip = () => {
        if (dontShowAgain) {
            // Solo se checkbox spuntato → non mostrare più
            markAsReturningUser()
        }
        setIsVisible(false)
    }

    const handleClose = () => {
        setIsVisible(false)
    }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-[51] flex items-center justify-center p-4"
            onClick={handleClose} // ✅ Click container closes modal
          >
            {/* Modal Content - Stop propagation so clicks inside don't close */}
            <div
              className="relative w-full max-w-2xl max-h-[90vh] min-h-0 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()} // ✅ Prevent close when clicking inside
            >
              {/* Gradient Header - Ridotto su mobile */}
              <div className="relative h-16 sm:h-28 bg-gradient-to-r from-indigo-600 to-pink-500 overflow-hidden flex-shrink-0">
                {/* Animated sparkles - Ridotti */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                />
                <motion.div
                  animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0],
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                />
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors cursor-pointer"
                  aria-label="Chiudi"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </button>
                {/* Icon - Più piccolo su mobile */}
                <div className="relative h-full flex items-center justify-center">
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
                  </motion.div>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1 min-h-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
                  Benvenuto su DisdEasy! 🎉
                </h2>
                <p className="text-lg text-gray-600 mb-6 text-center">
                  Siamo felici di averti qui! Ti guidiamo passo dopo passo nella creazione della tua prima disdetta.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <FeatureCard
                    icon={<FileText className="h-6 w-6 text-indigo-600" />}
                    title="Carica bolletta"
                    description="Upload facile del tuo documento"
                  />
                  <FeatureCard
                    icon={<CheckCircle className="h-6 w-6 text-indigo-600" />}
                    title="Verifica dati"
                    description="Controlla le info estratte"
                  />
                  <FeatureCard
                    icon={<Send className="h-6 w-6 text-indigo-600" />}
                    title="Invio automatico"
                    description="PEC inviata per te"
                  />
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="dontShowAgain"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor="dontShowAgain"
                    className="text-sm text-gray-700 cursor-pointer select-none"
                  >
                    Non mostrare più questo messaggio al prossimo accesso
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleStartTour}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>Inizia il tour guidato</span>
                  </button>

                  <button
                    onClick={handleSkip}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700  text-sm sm:text-base font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Salta, lo farò da solo
                  </button>
                </div>

                {/* Info text */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  Puoi sempre rivedere il tour cliccando sul pulsante "?" in basso a destra
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Feature Card Component
function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
  return (
    <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-indigo-50 to-pink-50 rounded-xl border border-indigo-100">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
            {icon}
        </div>
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">{title}</h3>
        <p className="text-xs text-gray-600">{description}</p>
    </div>
  )
}