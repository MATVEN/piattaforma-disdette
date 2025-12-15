// components/onboarding/OnboardingTour.tsx
// Main tour orchestrator component

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useOnboarding } from '@/context/OnboardingContext'
import { TourSpotlight } from './TourSpotlight'
import { TourStepComponent } from './TourStep'
import type { TourStep } from '@/types/tour'
import {
  homepageTour,
  uploadTour,
  reviewTour,
  dashboardTour,
  defaultTour,
} from '@/config/tourSteps'

export function OnboardingTour() {
  const { tourActive, currentStep, totalSteps, nextStep, previousStep, skipTour, stopTour, completeStep } = useOnboarding()
  const [tourSteps, setTourSteps] = useState<TourStep[]>([])
  const pathname = usePathname()

  // Get tour steps based on current page
  const getTourForCurrentPage = (): TourStep[] => {
    
    // Homepage
    if (pathname === '/') {
      return homepageTour
    }
    
    // Upload page (dynamic route)
    if (pathname.startsWith('/upload/')) {
      return uploadTour
    }
    
    // Review page
    if (pathname === '/review') {
      return reviewTour
    }
    
    // Dashboard page
    if (pathname === '/dashboard') {
      return dashboardTour
    }
    
    // Default fallback
    return defaultTour
  }

  // Set tour steps based on current page when tour becomes active
  useEffect(() => {
    if (tourActive && tourSteps.length === 0) {
      const pageTour = getTourForCurrentPage()
      setTourSteps(pageTour)
    }
  }, [tourActive, pathname, tourSteps.length])

  // Scroll target into view when step changes
  useEffect(() => {
    if (!tourActive || tourSteps.length === 0) return

    const stepIndex = currentStep - 1
    if (stepIndex < 0 || stepIndex >= tourSteps.length) return

    const currentStepData = tourSteps[stepIndex]
    const targetEl = document.querySelector(currentStepData.target)

    if (targetEl && currentStepData.target !== 'body') {
      // Scroll into view
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
    return null
  }

  // Check 2: Calcola step index
  const stepIndex = currentStep - 1

  // Check 3: Verifica step index valido
  if (stepIndex < 0 || stepIndex >= tourSteps.length) {
    return null
  }

  // Check 4: Get current step data
  const currentStepData = tourSteps[stepIndex]

  // Check 5: Verifica target element exists
  const targetEl = document.querySelector(currentStepData.target)

  if (!targetEl && currentStepData.target !== 'body') {
    // Auto-skip to next step
    setTimeout(() => {
      if (currentStep < totalSteps) {
        nextStep()
      } else {
        handleComplete()
      }
    }, 100)
    return null
  }

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