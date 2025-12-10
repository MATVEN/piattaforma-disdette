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

    console.log('🎨 WelcomeModal render - isLoading:', isLoading, 'isFirstVisit:', isFirstVisit, 'isVisible:', isVisible)

    // ✅ Don't render until Context has loaded from localStorage
    if (isLoading) {
        console.log('⏳ Still loading, not rendering modal')
        return null
    }

    // Don't render if not first visit or already dismissed
    if (!isFirstVisit || !isVisible) {
        console.log('✋ Not first visit or not visible, not rendering modal')
        return null
    }

    console.log('✅ Rendering WelcomeModal!')

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

          {/* Modal Container - ✅ FIX BUG 3: Click outside to close */}
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
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()} // ✅ Prevent close when clicking inside
            >
              {/* Gradient Header */}
              <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-pink-500 overflow-hidden">
                {/* Animated sparkles */}
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
                  className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"
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
                  className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"
                />

                {/* Close button - ✅ FIX BUG 2: Ensure clickable with higher z-index */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors cursor-pointer"
                  aria-label="Chiudi"
                >
                  <X className="h-5 w-5 text-white" />
                </button>

                {/* Icon */}
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
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="h-10 w-10 text-indigo-600" />
                  </motion.div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
                  Benvenuto su DisdettaFacile! 🎉
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
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
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