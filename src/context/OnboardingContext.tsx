'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import type { TourStep } from '@/types/tour'

interface OnboardingState {
    isFirstVisit: boolean
    tourActive: boolean
    currentStep: number
    totalSteps: number
    completedSteps: string[]
    dismissedTooltips: string[]
    isLoading: boolean
    tourSteps: TourStep[] // NEW: Tour step configuration
}

interface OnboardingContextType extends OnboardingState {
    startTour: () => void
    stopTour: () => void
    nextStep: () => void
    previousStep: () => void
    skipTour: () => void
    completeStep: (stepId: string) => void
    dismissTooltip: (tooltipId: string) => void
    resetOnboarding: () => void
    markAsReturningUser: () => void
    setTourSteps: (steps: TourStep[]) => void // NEW: Set tour steps
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

const STORAGE_KEY = 'DisdEasy_onboarding'
const TOTAL_TOUR_STEPS = 5

const defaultState: OnboardingState = {
  isFirstVisit: true,
  tourActive: false,
  currentStep: 0,
  totalSteps: TOTAL_TOUR_STEPS,
  completedSteps: [],
  dismissedTooltips: [],
  isLoading: true,
  tourSteps: [], // NEW: Initialize empty tour steps
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState)

  // ✅ Load from localStorage on mount (runs ONCE)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      
      if (stored) {
        const parsed = JSON.parse(stored)
        setState(prev => ({
          ...prev,
          isFirstVisit: parsed.isFirstVisit ?? true,
          completedSteps: parsed.completedSteps ?? [],
          dismissedTooltips: parsed.dismissedTooltips ?? [],
          isLoading: false, 
        }))
      } else {
        // No stored data, keep defaults but stop loading
        setState(prev => ({
          ...prev,
          isLoading: false, 
        }))
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error)
      setState(prev => ({
        ...prev,
        isLoading: false, 
      }))
    }
  }, [])

  // Save to localStorage on state change (but NOT during initial load)
  useEffect(() => {
    // ✅ Don't save during initial load
    if (state.isLoading) return
    
    try {
      const toStore = {
        isFirstVisit: state.isFirstVisit,
        completedSteps: state.completedSteps,
        dismissedTooltips: state.dismissedTooltips,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } catch (error) {
      console.error('Failed to save onboarding state:', error)
    }
  }, [state.isFirstVisit, state.completedSteps, state.dismissedTooltips, state.isLoading])

  const startTour = () => {
    setState(prev => ({
      ...prev,
      tourActive: true,
      currentStep: 1,
    }))
  }

  const stopTour = () => {
    setState(prev => ({
      ...prev,
      tourActive: false,
      currentStep: 0,
    }))
  }

  const nextStep = () => {
    setState(prev => {
      const newStep = Math.min(prev.currentStep + 1, prev.totalSteps)
      if (newStep > prev.totalSteps) {
        // Tour completed
        return {
          ...prev,
          tourActive: false,
          currentStep: 0,
        }
      }
      return {
        ...prev,
        currentStep: newStep,
      }
    })
  }

  const previousStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }))
  }

  const skipTour = () => {
    setState(prev => ({
      ...prev,
      tourActive: false,
      currentStep: 0,
      isFirstVisit: false,
    }))
  }

  const completeStep = (stepId: string) => {
    setState(prev => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, stepId])],
    }))
  }

  const dismissTooltip = (tooltipId: string) => {
    setState(prev => ({
      ...prev,
      dismissedTooltips: [...new Set([...prev.dismissedTooltips, tooltipId])],
    }))
  }

  const resetOnboarding = () => {
    setState(defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }

  const markAsReturningUser = () => {
    // ✅ Save to localStorage IMMEDIATELY (sync)
    try {
      const currentStored = localStorage.getItem(STORAGE_KEY)
      const parsed = currentStored ? JSON.parse(currentStored) : {}
      const updated = {
        ...parsed,
        isFirstVisit: false,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save onboarding state:', error)
    }

    // Then update state (for current session)
    setState(prev => ({
      ...prev,
      isFirstVisit: false,
    }))
  }

  const setTourSteps = (steps: TourStep[]) => {
    setState(prev => ({
      ...prev,
      tourSteps: steps,
      totalSteps: steps.length,
    }))
  }

  const value = useMemo<OnboardingContextType>(() => ({
    ...state,
    startTour,
    stopTour,
    nextStep,
    previousStep,
    skipTour,
    completeStep,
    dismissTooltip,
    resetOnboarding,
    markAsReturningUser,
    setTourSteps,
  }), [state]) // Solo state nelle dipendenze (le funzioni sono stabili)
  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}