// components/onboarding/TourStep.tsx
// Step tooltip with content, navigation, and progress

'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, ArrowLeft, ArrowRight } from 'lucide-react'
import type { TourStep } from '@/types/tour'

interface TourStepProps {
  step: TourStep
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
}

interface Position {
  top: number
  left: number
}

export function TourStepComponent({ step, currentStep, totalSteps, onNext, onPrevious, onSkip }: TourStepProps) {
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 })
  const [isPositioned, setIsPositioned] = useState(false) // ← ADD
  const tooltipRef = useRef<HTMLDivElement>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {

    setIsPositioned(false)

    const updatePosition = () => {
      const targetEl = document.querySelector(step.target)
      if (!targetEl || !tooltipRef.current) return

      const targetRect = targetEl.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const placement = step.placement || 'bottom'
      const gap = 16

      let top = 0
      let left = 0

      // Special handling for body element
      if (step.target === 'body') {
        // Center tooltip in viewport
        top = window.innerHeight / 2 - tooltipRect.height / 2
        left = window.innerWidth / 2 - tooltipRect.width / 2
      } else {
        // Calculate position based on placement
        switch (placement) {
          case 'top':
            top = targetRect.top - tooltipRect.height - gap
            left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
            break
          case 'bottom':
            top = targetRect.bottom + gap
            left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
            break
          case 'left':
            top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
            left = targetRect.left - tooltipRect.width - gap
            break
          case 'right':
            top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
            left = targetRect.right + gap
            break
        }

        // Auto-flip if doesn't fit viewport
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Flip horizontally if needed
        if (left < 16) {
          left = 16
        } else if (left + tooltipRect.width > viewportWidth - 16) {
          left = viewportWidth - tooltipRect.width - 16
        }

        // Flip vertically if needed
        if (top < 16) {
          top = targetRect.bottom + gap
        } else if (top + tooltipRect.height > viewportHeight - 16) {
          top = targetRect.top - tooltipRect.height - gap
        }
      }

      setPosition({ top, left })
      setIsPositioned(true)
    }

    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    // Delay initial position to ensure tooltip is rendered
    updateTimeoutRef.current = setTimeout(updatePosition, 100)

    // Update on resize or scroll
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [step.target, step.placement])

  const progressPercentage = ((currentStep + 1) / totalSteps) * 100
  const showPrevious = step.showPrevious !== false && currentStep > 0
  const showSkip = step.showSkip !== false

  return (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isPositioned ? 1 : 0,
        y: isPositioned ? 0 : 10 
      }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed z-[60] bg-white rounded-2xl shadow-2xl w-full px-4 sm:px-0 sm:max-w-sm pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-pink-500 p-4 rounded-t-2xl flex items-start justify-between">
        <h3 className="text-lg font-semibold text-white pr-2">{step.title}</h3>
        {showSkip && (
          <button
            onClick={onSkip}
            className="text-white/80 hover:text-white transition-colors flex-shrink-0"
            aria-label="Chiudi tour"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed">{step.content}</p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-indigo-600 to-pink-500 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            Passo {currentStep + 1} di {totalSteps}
          </p>
        </div>
      </div>

      {/* Footer with Navigation Buttons */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3">
        {/* Skip Button (left) */}
        <div className="flex-shrink-0">
          {showSkip && (
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Salta tour"
            >
              Salta
            </button>
          )}
        </div>

        {/* Navigation Buttons (right) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {showPrevious && (
            <button
              onClick={onPrevious}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 min-h-[44px]"
              aria-label="Passo precedente"
            >
              <ArrowLeft className="h-4 w-4" />
              Indietro
            </button>
          )}
          <button
            onClick={onNext}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 rounded-lg transition-all flex items-center gap-2 min-h-[44px]"
            aria-label={currentStep === totalSteps - 1 ? 'Completa tour' : 'Passo successivo'}
          >
            {currentStep === totalSteps - 1 ? 'Completa' : 'Avanti'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}