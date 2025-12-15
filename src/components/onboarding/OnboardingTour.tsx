// components/onboarding/OnboardingTour.tsx
// Main tour orchestrator component

'use client'

import { useEffect, useState } from 'react'
import { useOnboarding } from '@/context/OnboardingContext'
import { TourSpotlight } from './TourSpotlight'
import { TourStepComponent } from './TourStep'
import type { TourStep } from '@/types/tour'

export function OnboardingTour() {
  const { tourActive, currentStep, totalSteps, nextStep, previousStep, skipTour, stopTour, completeStep } = useOnboarding()
  const [tourSteps, setTourSteps] = useState<TourStep[]>([])

  // ← ADD DEBUG
  console.log('🎯 OnboardingTour render:', {
    tourActive,
    currentStep,
    totalSteps,
    tourStepsLength: tourSteps.length
  })

  // Default tour steps (can be customized)
  useEffect(() => {
    if (tourActive && tourSteps.length === 0) {
      // Set default tour steps
      const defaultSteps: TourStep[] = [
      {
        id: 'welcome',
        title: '👋 Benvenuto su DisdettaFacile!',
        content: 'Ti guideremo attraverso i passaggi per creare la tua prima disdetta.',
        target: 'body',
        placement: 'bottom',
        showPrevious: false,
      },
      {
        id: 'navbar',
        title: '🧭 La Barra di Navigazione',
        content: 'Qui in alto trovi i link per navigare: Dashboard, Profilo e altro.',
        target: 'nav',
        placement: 'bottom',
      },
      {
        id: 'help-button',
        title: '❓ Pulsante Aiuto',
        content: 'Clicca questo pulsante in qualsiasi momento per rivedere il tour o contattare il supporto.',
        target: 'button[aria-label="Aiuto"]',
        placement: 'left',
      },
      {
        id: 'complete',
        title: '🎉 Tutto Pronto!',
        content: 'Ora sei pronto per creare la tua prima disdetta. Clicca "Nuova Disdetta" nella barra in alto per iniziare!',
        target: 'body',
        placement: 'bottom',
      },
    ]
      setTourSteps(defaultSteps)
    }
  }, [tourActive, tourSteps.length])

  // Scroll target into view when step changes
  useEffect(() => {
    if (!tourActive || tourSteps.length === 0) return

    const stepIndex = currentStep - 1
    if (stepIndex < 0 || stepIndex >= tourSteps.length) return

    const currentStepData = tourSteps[stepIndex]
    const targetEl = document.querySelector(currentStepData.target)

    if (targetEl && currentStepData.target !== 'body') {
      targetEl.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [currentStep, tourActive, tourSteps])

  // Keyboard navigation
  useEffect(() => {
    if (!tourActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault()
          handleNext()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (currentStep > 1) {
            handlePrevious()
          }
          break
        case 'Escape':
          e.preventDefault()
          handleSkip()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tourActive, currentStep])

  const handleNext = () => {
    const stepIndex = currentStep - 1
    if (stepIndex >= 0 && stepIndex < tourSteps.length) {
      const currentStepData = tourSteps[stepIndex]

      // Call custom onNext if provided
      if (currentStepData.onNext) {
        currentStepData.onNext()
      }

      // Mark step as completed
      completeStep(currentStepData.id)

      // Check if this is the last step
      if (currentStep >= totalSteps) {
        handleComplete()
      } else {
        nextStep()
      }
    }
  }

  const handlePrevious = () => {
    const stepIndex = currentStep - 1
    if (stepIndex >= 0 && stepIndex < tourSteps.length) {
      const currentStepData = tourSteps[stepIndex]

      // Call custom onPrevious if provided
      if (currentStepData.onPrevious) {
        currentStepData.onPrevious()
      }
    }
    previousStep()
  }

  const handleSkip = () => {
    skipTour()
    setTourSteps([])
  }

  const handleComplete = () => {
    // Mark last step as completed
    const lastStepIndex = tourSteps.length - 1
    if (lastStepIndex >= 0) {
      completeStep(tourSteps[lastStepIndex].id)
    }

    stopTour()
    setTourSteps([])
  }

  // Check 1: Tour attivo e steps disponibili
  if (!tourActive || tourSteps.length === 0) {
    console.log('❌ Tour not rendering:', { tourActive, tourStepsLength: tourSteps.length })
    return null
  }

  // Check 2: Calcola step index
  const stepIndex = currentStep - 1
  console.log('📍 Step index:', stepIndex, 'currentStep:', currentStep, 'totalSteps:', tourSteps.length)

  // Check 3: Verifica step index valido
  if (stepIndex < 0 || stepIndex >= tourSteps.length) {
    console.log('❌ Invalid step index:', { stepIndex, tourStepsLength: tourSteps.length })
    return null
  }

  // Check 4: Get current step data
  const currentStepData = tourSteps[stepIndex]
  console.log('✅ Rendering tour step:', currentStepData)

  // Check 5: Verifica target element exists
  const targetEl = document.querySelector(currentStepData.target)
  console.log('🎯 Looking for target:', currentStepData.target)
  console.log('✅ Target element found:', targetEl)

  if (!targetEl && currentStepData.target !== 'body') {
    console.error('❌ Target element not found:', currentStepData.target)
    // Auto-skip to next step
    setTimeout(() => {
      if (currentStep < totalSteps) {
        console.log('⏭️ Skipping to next step...')
        nextStep()
      } else {
        console.log('✅ Completing tour...')
        handleComplete()
      }
    }, 100)
    return null
  }

  // Render tour
  console.log('🎨 Rendering TourSpotlight and TourStepComponent')

  return (
    <>
      <TourSpotlight
        target={currentStepData.target}
        isActive={tourActive}
        onClickOutside={handleSkip}
      />
      <TourStepComponent
        step={currentStepData}
        currentStep={stepIndex}
        totalSteps={tourSteps.length}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
      />
    </>
  )
}