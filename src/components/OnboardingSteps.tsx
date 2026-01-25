// src/components/OnboardingSteps.tsx
// Horizontal stepper for multi-page onboarding flow

'use client'

import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

export interface OnboardingStep {
  id: string
  label: string
  description?: string
}

interface OnboardingStepsProps {
  steps: OnboardingStep[]
  currentStep: number // 0-indexed
  className?: string
}

export function OnboardingSteps({ steps, currentStep, className = '' }: OnboardingStepsProps) {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={`sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 ${className}`}>
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Desktop: Full stepper */}
        <div className="hidden md:flex items-center justify-between mb-3">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            const isFuture = index > currentStep

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle + Label */}
                <div className="flex items-center">
                  {/* Circle */}
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      background: isCompleted || isActive ? 'linear-gradient(135deg, #00C4B4 0%, #0D417D 100%)' : '#e5e7eb',
                    }}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${isActive ? 'ring-4 ring-primary-200' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-sm font-semibold ${isActive || isCompleted ? 'text-white' : 'text-gray-500'}`}>
                        {index + 1}
                      </span>
                    )}
                  </motion.div>

                  {/* Label */}
                  <div className="ml-3">
                    <p className={`text-sm font-medium transition-colors ${
                      isActive ? 'text-primary-600' :
                      isCompleted ? 'text-gray-700' : 
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    {step.description && isActive && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Arrow (except last) */}
                {index < steps.length - 1 && (
                  <ChevronRight className={`mx-3 flex-shrink-0 ${
                    isCompleted ? 'text-primary-400' : 'text-gray-300'
                  }`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: Compact stepper */}
        <div className="md:hidden flex items-center justify-between mb-3">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = index < currentStep

            return (
              <div key={step.id} className="flex items-center">
                {/* Small Circle */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                  ${isCompleted || isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}
                  ${isActive ? 'ring-2 ring-primary-300' : ''}
                `}>
                  {isCompleted ? '✓' : index + 1}
                </div>

                {/* Arrow */}
                {index < steps.length - 1 && (
                  <ChevronRight className="mx-1 h-4 w-4 text-gray-300" />
                )}
              </div>
            )
          })}
        </div>

        {/* Current step label (mobile only) */}
        <p className="md:hidden text-sm font-medium text-primary-600 mb-3">
          {steps[currentStep].label}
        </p>

        {/* Progress Bar */}
        <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full"
          />
        </div>
      </div>
    </div>
  )
}