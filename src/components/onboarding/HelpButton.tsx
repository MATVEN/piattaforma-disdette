'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, BookOpen, Mail, X, Lightbulb } from 'lucide-react'
import { useOnboarding } from '@/context/OnboardingContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Contenuti guida contestuale per ogni pagina
const contextualHelp: Record<string, { title: string; tips: string[] }> = {
  '/': {
    title: 'Benvenuto su DisdEasy!',
    tips: [
      '📄 Carica la tua bolletta per iniziare',
      '🤖 L\'AI estrae automaticamente i dati',
      '✅ Verifica e invia la disdetta in pochi click',
    ],
  },
  '/upload': {
    title: 'Caricamento Documento',
    tips: [
      '📸 Accettiamo PDF, JPG e PNG fino a 10MB',
      '📋 La bolletta deve essere leggibile e recente',
      '🔍 L\'AI estrae automaticamente POD/PDR e dati fornitore',
    ],
  },
  '/review': {
    title: 'Verifica Dati',
    tips: [
      '✏️ Controlla attentamente i dati estratti dall\'AI',
      '🏢 Scegli "Privato" o "Azienda" in base all\'intestatario',
      '📝 I campi obbligatori sono contrassegnati con *',
      '🚀 Se tutto è corretto, clicca "Invia Disdetta". Riceverai conferma via email quando la PEC sarà inviata!',
    ],
  },
  '/dashboard': {
    title: 'Le Tue Disdette',
    tips: [
      '📊 Qui trovi tutte le tue richieste di disdetta',
      '🔄 Stato "In attesa" = in lavorazione',
      '✅ Stato "Inviata" = PEC inviata con successo',
      '🔁 Puoi provare a inviare nuovamente le richieste fallite',
    ],
  },
  '/new-disdetta': {
    title: 'Nuova Disdetta',
    tips: [
      '⚡ Scegli il tipo di servizio (Luce/Gas/Telefonia)',
      '📄 Avrai bisogno della bolletta più recente',
      '🚀 Il processo richiede circa 2-3 minuti',
    ],
  },
  '/terms': {
    title: 'Termini e Condizioni',
    tips: [
      '📋 Leggi con attenzione prima di usare il servizio',
      '🔝 Usa i bottoni in alto per navigare velocemente tra le sezioni',
      '⚖️ Sezioni chiave: Mandato, Responsabilità e Limitazioni',
      '📧 Per dubbi, contatta il supporto tramite il form contatti',
    ],
  },
  '/privacy-cookie-policy': {
    title: 'Privacy & Cookie Policy',
    tips: [
      '🔒 Scopri come proteggiamo i tuoi dati personali',
      '🍪 Gestisci le tue preferenze sui cookie',
      '📊 Trovi info su: conservazione dati, diritti GDPR, e destinatari',
      '🔝 Usa i bottoni in alto per passare da Privacy a Cookie Policy',
    ],
  },
  '/faq': {
    title: 'Domande Frequenti',
    tips: [
      '🔍 Usa la barra di ricerca per trovare risposte velocemente',
      '📂 Le domande sono organizzate per categoria',
      '💡 Clicca su una domanda per espandere la risposta',
      '📧 Non trovi risposta? Contattaci dal form supporto',
    ],
  },
  '/operators': {
    title: 'Operatori Supportati',
    tips: [
      '📡 Verifica se il tuo operatore è nella lista',
      '🔎 Usa i filtri per cercare per tipo servizio',
      '✅ Lista aggiornata regolarmente con nuovi operatori',
      '📧 Operatore mancante? Segnalacelo!',
    ],
  },
  '/how-it-works': {
    title: 'Come Funziona',
    tips: [
      '📖 Scopri il processo in 3 semplici step',
      '🤖 L\'AI estrae automaticamente i dati dalla bolletta',
      '🔒 Tutti i dati sono crittografati e protetti',
      '🚀 Pronto? Clicca "Nuova Disdetta" per iniziare',
    ],
  },
  '/contact': {
    title: 'Contattaci',
    tips: [
      '✍️ Compila il form per richiedere assistenza',
      '📧 Preferisci email? Trova l\'indirizzo in fondo alla pagina',
      '⏰ Rispondiamo entro 24-48 ore lavorative',
      '💡 Per domande comuni, consulta prima le FAQ',
    ],
  },
}

const defaultHelp = {
  title: 'Guida Generale',
  tips: [
    '📄 Carica una bolletta per creare una disdetta',
    '📋 Accettiamo PDF, JPG e PNG fino a 10MB. La bolletta deve essere leggibile e recente.',
    '🤖 L\'AI estrae automaticamente i dati importanti. Potrai verificare e correggere nel prossimo step.',
    '✅ Dopo il caricamento, ti porteremo al form di verifica dove controllare tutti i dati estratti',
  ],
}

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [showContextualHelp, setShowContextualHelp] = useState(false)
  const { startTour } = useOnboarding()
  const pathname = usePathname()

  // Get contextual help for current page
  const currentHelp = contextualHelp[pathname] || defaultHelp

  const handleStartTour = () => {
    setIsOpen(false)
    startTour()
  }

  const handleShowContextualHelp = () => {
    setShowContextualHelp(true)
  }

  const handleCloseContextualHelp = () => {
    setShowContextualHelp(false)
  }

  return (
    <>
      {/* Main Help Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center group"
        aria-label="Aiuto"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="help"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-2xl font-semibold">?</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip on hover */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Hai bisogno di aiuto?
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="fixed bottom-24 right-6 z-50 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-secondary-600 px-5 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  Come possiamo aiutarti?
                </h3>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <MenuItem
                  icon={<Sparkles className="h-5 w-5 text-primary-600" />}
                  title="Rivedi Tour Guidato"
                  description="Ripercorri i passaggi principali"
                  onClick={handleStartTour}
                />

                <MenuItem
                  icon={<Lightbulb className="h-5 w-5 text-primary-600" />}
                  title="Guida Contestuale"
                  description="Aiuto specifico per questa pagina"
                  onClick={handleShowContextualHelp}
                />

                <MenuItem
                  icon={<Mail className="h-5 w-5 text-primary-600" />}
                  title="Contatta Supporto"
                  description="Scrivici per assistenza diretta"
                  href="mailto:supporto@DisdEasy.it"
                  onClick={() => setIsOpen(false)}
                  isLast
                />
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Siamo qui per aiutarti! 💙
                </p>
              </div>
            </motion.div>
          </>
        )}

        {/* Contextual Help Modal */}
        {showContextualHelp && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseContextualHelp}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="fixed top-1/2 -translate-y-1/2 inset-x-4 z-50 max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-secondary-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-white" />
                  <h3 className="text-white font-semibold">{currentHelp.title}</h3>
                </div>
                <button
                  onClick={handleCloseContextualHelp}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Chiudi"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <ul className="space-y-3">
                  {currentHelp.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-lg leading-none mt-0.5">{tip.split(' ')[0]}</span>
                      <span className="text-gray-700 text-sm flex-1">
                        {tip.split(' ').slice(1).join(' ')}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCloseContextualHelp}
                  className="w-full mt-6 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-600 text-white font-medium rounded-lg hover:shadow-lg transition-shadow"
                >
                  Ho capito!
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// MenuItem Component
interface MenuItemProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick?: () => void
  href?: string
  isLast?: boolean
}

function MenuItem({ icon, title, description, onClick, href, isLast }: MenuItemProps) {
  const content = (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
        !isLast ? 'mb-1' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{title}</h4>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </motion.div>
  )

  if (href) {
    // External link (mailto) or internal link
    if (href.startsWith('mailto:')) {
      return (
        <a href={href} onClick={onClick}>
          {content}
        </a>
      )
    }
    return (
      <Link href={href} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return content
}