import type { TourStep } from '@/types/tour'

/**
 * Tour Step Configurations
 *
 * Strategic Decision (C24 Day 4):
 * - Tour Guidato: Homepage only (first-time onboarding)
 * - Guida Contestuale: All other pages (quick operational help)
 *
 * This separation provides:
 * - Clear role distinction (onboarding vs operational)
 * - No content redundancy
 * - Fast help without interrupting workflow
 */

// Homepage Tour (active)
export const homepageTour: TourStep[] = [
  {
    id: 'home-welcome',
    title: '👋 Benvenuto su DisdEasy!',
    content: 'La piattaforma più semplice per disdire contratti di luce, gas e telefonia. Ti guidiamo passo dopo passo!',
    target: 'body',
    placement: 'bottom',
    showPrevious: false,
  },
  {
    id: 'home-how-it-works',
    title: '🚀 Come Funziona',
    content: 'In 3 semplici passi: 1) Carica la bolletta 2) Verifica i dati estratti 3) Inviamo la PEC per te!',
    target: 'body',
    placement: 'bottom',
  },
  {
    id: 'home-new-disdetta',
    title: '📄 Inizia Subito',
    content: 'Clicca "Nuova Disdetta" per iniziare. Ti servirà una bolletta recente del servizio da disdire.',
    target: '[href="/new-disdetta"]',
    placement: 'bottom',
  },
  {
    id: 'home-help',
    title: '❓ Serve Aiuto?',
    content: 'Usa questo pulsante in qualsiasi momento per rivedere il tour o contattare il supporto!',
    target: 'button[aria-label="Aiuto"]',
    placement: 'left',
  },
]

// Default fallback tour
// Removed: uploadTour, reviewTour, dashboardTour (unused after strategic decision)
export const defaultTour: TourStep[] = [
  {
    id: 'default-welcome',
    title: '👋 Benvenuto!',
    content: 'Usa la barra di navigazione per accedere alle diverse sezioni della piattaforma.',
    target: 'nav',
    placement: 'bottom',
    showPrevious: false,
  },
  {
    id: 'default-help',
    title: '❓ Hai Bisogno di Aiuto?',
    content: 'Clicca questo pulsante in qualsiasi momento per rivedere il tour o contattare il supporto.',
    target: 'button[aria-label="Aiuto"]',
    placement: 'left',
  },
  {
    id: 'default-complete',
    title: '🎉 Sei Pronto!',
    content: 'Esplora la piattaforma e crea la tua prima disdetta quando sei pronto!',
    target: 'body',
    placement: 'bottom',
  },
]