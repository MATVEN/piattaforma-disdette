'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Sparkles, BookOpen, Mail, X } from 'lucide-react'
import { useOnboarding } from '@/context/OnboardingContext'
import Link from 'next/link'

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { startTour } = useOnboarding()

  const handleStartTour = () => {
    setIsOpen(false)
    startTour()
  }

  return (
    <>
      {/* Main Help Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center group"
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
              className="relative"
            >
              <HelpCircle className="h-6 w-6" />
              
              {/* Pulse animation */}
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-full bg-white"
              />
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
              <div className="bg-gradient-to-r from-indigo-600 to-pink-500 px-5 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Come possiamo aiutarti?
                </h3>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <MenuItem
                  icon={<Sparkles className="h-5 w-5 text-indigo-600" />}
                  title="Rivedi Tour Guidato"
                  description="Ripercorri i passaggi principali"
                  onClick={handleStartTour}
                />

                <MenuItem
                  icon={<BookOpen className="h-5 w-5 text-indigo-600" />}
                  title="FAQ e Guide"
                  description="Trova risposte alle domande comuni"
                  href="/faq"
                  onClick={() => setIsOpen(false)}
                />

                <MenuItem
                  icon={<Mail className="h-5 w-5 text-indigo-600" />}
                  title="Contatta Supporto"
                  description="Scrivici per assistenza diretta"
                  href="mailto:supporto@disdettafacile.it"
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
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
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