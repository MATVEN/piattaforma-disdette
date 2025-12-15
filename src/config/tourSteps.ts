import type { TourStep } from '@/types/tour'

// Homepage Tour
export const homepageTour: TourStep[] = [
  {
    id: 'home-welcome',
    title: '👋 Benvenuto su DisdettaFacile!',
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

// Upload Page Tour
export const uploadTour: TourStep[] = [
  {
    id: 'upload-welcome',
    title: '📤 Carica la Bolletta',
    content: 'Trascina qui il file oppure clicca per selezionarlo. La nostra AI estrarrà automaticamente i dati!',
    target: '#file-upload-area',
    placement: 'top',
    showPrevious: false,
  },
  {
    id: 'upload-file-types',
    title: '📋 Formati Supportati',
    content: 'Accettiamo PDF, JPG e PNG fino a 10MB. La bolletta deve essere leggibile e recente.',
    target: '#file-upload-area',
    placement: 'top',
  },
  {
    id: 'upload-ai-extraction',
    title: '🤖 Estrazione Automatica',
    content: 'L\'AI estrarrà: POD/PDR, dati fornitore, intestatario. Potrai verificare e correggere nel prossimo step.',
    target: 'body',
    placement: 'bottom',
  },
  {
    id: 'upload-next',
    title: '✅ Prossimo Step',
    content: 'Dopo il caricamento, ti porteremo al form di verifica dove controllare tutti i dati estratti.',
    target: 'body',
    placement: 'bottom',
  },
]

// Review Page Tour
export const reviewTour: TourStep[] = [
  {
    id: 'review-welcome',
    title: '✏️ Verifica i Dati',
    content: 'Controlla attentamente che i dati estratti siano corretti. Puoi modificare qualsiasi campo.',
    target: '#review-form',
    placement: 'top',
    showPrevious: false,
  },
  {
    id: 'review-tipo-intestatario',
    title: '🏢 Tipo Intestatario',
    content: 'Seleziona "Privato" se il contratto è intestato a te, "Azienda" se intestato a una società.',
    target: 'input[name="tipo_intestatario"]',
    placement: 'right',
  },
  {
    id: 'review-tooltips',
    title: '❓ Aiuto per Ogni Campo',
    content: 'Passa il mouse sui simboli "?" accanto ai campi per vedere spiegazioni dettagliate.',
    target: 'body',
    placement: 'bottom',
  },
  {
    id: 'review-documents',
    title: '📎 Documenti Richiesti',
    content: 'Per le aziende: Visura Camerale, Documento Identità del Legale Rappresentante, eventuale Delega.',
    target: '#b2b-documents-section',
    placement: 'top',
  },
  {
    id: 'review-submit',
    title: '🚀 Invia Disdetta',
    content: 'Quando tutto è corretto, clicca "Invia Disdetta". Riceverai conferma via email quando la PEC sarà inviata!',
    target: 'button[type="submit"]',
    placement: 'top',
  },
]

// Dashboard Page Tour
export const dashboardTour: TourStep[] = [
  {
    id: 'dashboard-welcome',
    title: '📊 Le Tue Disdette',
    content: 'Qui trovi tutte le tue richieste di disdetta con lo stato di avanzamento aggiornato.',
    target: '#disdette-list',
    placement: 'top',
    showPrevious: false,
  },
  {
    id: 'dashboard-status',
    title: '🔄 Stati Possibili',
    content: 'In Lavorazione = in elaborazione | Inviata = PEC inviata con successo | Fallita = problema tecnico (puoi ritentare)',
    target: 'body',
    placement: 'bottom',
  },
  {
    id: 'dashboard-actions',
    title: '⚡ Azioni Disponibili',
    content: 'Clicca "Riprova invio" per le disdette fallite, oppure "Scarica PDF" per salvare la ricevuta.',
    target: 'body',
    placement: 'bottom',
  },
  {
    id: 'dashboard-new',
    title: '➕ Nuova Disdetta',
    content: 'Devi disdire un altro contratto? Clicca "Nuova Disdetta" nella barra in alto!',
    target: '[href="/new-disdetta"]',
    placement: 'bottom',
  },
]

// Default/Generic Tour (fallback)
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