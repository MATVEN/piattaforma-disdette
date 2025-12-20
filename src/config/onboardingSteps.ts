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
    id: 'service',
    label: 'Servizio',
    description: 'Specifica il contratto',
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
  if (pathname === '/new-disdetta') return 0 // Category
  if (pathname.startsWith('/operator/')) return 1 // Operator (se hai questa route)
  if (pathname.startsWith('/upload/')) return 2 // Service/Upload
  if (pathname === '/review') return 3 // Review (bonus step)
  return 0 // Default
}