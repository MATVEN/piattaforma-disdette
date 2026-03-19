// src/config/onboardingSteps.ts
// Configuration for onboarding flow steps

import type { OnboardingStep } from '@/components/OnboardingSteps'

export const onboardingFlowSteps: OnboardingStep[] = [
  {
    id: 'category',
    label: 'Categoria',
    description: 'Scegli il tipo di utenza',
  },
  {
    id: 'operator',
    label: 'Operatore',
    description: 'Seleziona il fornitore',
  },
  {
    id: 'upload',
    label: 'Caricamento',
    description: 'Upload documento',
  },
]

/**
 * Get current step index based on pathname
 */
export function getCurrentStepFromPath(pathname: string): number {
  if (pathname === '/new-disdetta') return 0 // Category / Operator
  if (pathname === '/upload') return 2        // Upload
  if (pathname === '/review') return 3        // Review (bonus step)
  return 0 // Default
}
