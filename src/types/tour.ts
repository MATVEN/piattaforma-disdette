// types/tour.ts
// TypeScript interfaces for onboarding tour system

export interface TourStep {
  id: string
  title: string
  content: string
  target: string // CSS selector (e.g., "#upload-button")
  placement?: 'top' | 'bottom' | 'left' | 'right'
  showSkip?: boolean
  showPrevious?: boolean
  onNext?: () => void
  onPrevious?: () => void
}

export interface TourConfig {
  steps: TourStep[]
  onComplete?: () => void
  onSkip?: () => void
}

export interface SpotlightPosition {
  top: number
  left: number
  width: number
  height: number
}
