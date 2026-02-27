// src/app/faq/page.tsx
// FAQ & Help Center page

'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ChevronDown,
  Rocket,
  Clock,
  Euro,
  AlertCircle,
  FileText,
  Shield,
  MessageCircle
} from 'lucide-react'
import { faqCategories, faqItems, type FAQItem } from '@/data/faqData'

// Icon mapping (use actual Lucide icons)
const iconMap: Record<string, any> = {
  Rocket,
  Clock,
  Euro,
  AlertCircle,
  FileText,
  Shield,
  MessageCircle,
}

// Color mapping for categories
const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  primary: {
    bg: 'bg-primary-100',
    text: 'text-primary-700',
    border: 'border-primary-200'
  },
  secondary: {
    bg: 'bg-secondary-100',
    text: 'text-secondary-700',
    border: 'border-secondary-200'
  },
  indigo: {
    bg: 'bg-primary-100',
    text: 'text-primary-700',
    border: 'border-primary-200'
  },
  purple: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-200'
  },
  pink: {
    bg: 'bg-secondary-100',
    text: 'text-secondary-700',
    border: 'border-secondary-200'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200'
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  cyan: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-200'
  },
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('come-funziona')
  const [showStickyPills, setShowStickyPills] = useState(false) // ✅ Nuovo state

  // Filter FAQ items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return faqItems

    const query = searchQuery.toLowerCase()
    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const grouped: Record<string, FAQItem[]> = {}
    filteredItems.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = []
      }
      grouped[item.category].push(item)
    })
    return grouped
  }, [filteredItems])

  // ✅ Track scroll position for sticky pills
  useEffect(() => {
    const handleScroll = () => {
      // Show pills after scrolling past header (250px)
      setShowStickyPills(window.scrollY > 250)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track active category based on scroll position
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const categoryId = entry.target.id.replace('category-', '')
          setActiveCategory(categoryId)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    faqCategories.forEach((cat) => {
      const element = document.getElementById(`category-${cat.id}`)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [filteredItems])

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`)
    if (element) {
      const offset = 140 // navbar + pills + gap
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
    setActiveCategory(categoryId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50">
      {/* Header - NON sticky */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4"
              style={{
                backgroundImage: 'linear-gradient(135deg, #00C4B4 0%, #0D417D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Domande Frequenti
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Siamo qui per aiutarti. Trova rapidamente le risposte alle tue domande o contattaci per supporto.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca una domanda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ✅ STICKY PILLS - Show after scroll */}
      <AnimatePresence>
        {showStickyPills && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg"
          >
            <div className="mx-auto py-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 px-4 sm:px-6 lg:px-8 w-max min-w-full justify-start">
                {faqCategories.map((cat) => {
                  const hasItems = groupedItems[cat.id]?.length > 0
                  if (!hasItems && searchQuery) return null

                  const Icon = iconMap[cat.icon]
                  return (
                    <button
                      key={cat.id}
                      onClick={() => scrollToCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all hover:scale-105 flex-shrink-0 ${
                        colorMap[cat.color].bg
                      } ${
                        colorMap[cat.color].text
                      } ${
                        colorMap[cat.color].border
                      } ${
                        activeCategory === cat.id
                          ? 'ring-2 ring-offset-2 ring-primary-500 shadow-lg scale-105'
                          : ''
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{cat.name}</span>
                      {hasItems && (
                        <span className="text-xs opacity-60">
                          ({groupedItems[cat.id].length})
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial Category Pills (visible at start) */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto py-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-4 sm:px-6 lg:px-8 w-max min-w-full justify-start">
            {faqCategories.map((cat) => {
              const hasItems = groupedItems[cat.id]?.length > 0
              if (!hasItems && searchQuery) return null

              const Icon = iconMap[cat.icon]
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all hover:scale-105 flex-shrink-0 ${
                    colorMap[cat.color].bg
                  } ${
                    colorMap[cat.color].text
                  } ${
                    colorMap[cat.color].border
                  } ${
                    activeCategory === cat.id
                      ? 'ring-2 ring-offset-2 ring-primary-500 shadow-lg scale-105'
                      : ''
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{cat.name}</span>
                  {hasItems && (
                    <span className="text-xs opacity-60">
                      ({groupedItems[cat.id].length})
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {searchQuery && filteredItems.length === 0 ? (
          // No results
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-sm sm:text-base text-gray-500 mb-4">
              Nessun risultato per &quot;{searchQuery}&quot;
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Cancella ricerca
            </button>
          </motion.div>
        ) : (
          // Category sections
          <div className="text-sm sm:text-base space-y-12">
            {faqCategories.map((cat) => {
              const items = groupedItems[cat.id]
              if (!items || items.length === 0) return null

              const Icon = iconMap[cat.icon]
              const colors = colorMap[cat.color]

              return (
                <motion.div
                  key={cat.id}
                  id={`category-${cat.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="scroll-mt-32"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${colors.bg} ${colors.text} ${colors.border} border`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {cat.name}
                    </h2>
                  </div>

                  {/* FAQ Items */}
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Question (clickable) */}
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
                        >
                          <span className="font-semibold text-gray-900 pr-4">
                            {item.question}
                          </span>
                          <motion.div
                            animate={{ rotate: expandedId === item.id ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          </motion.div>
                        </button>

                        {/* Answer (expandable) */}
                        <AnimatePresence>
                          {expandedId === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="px-6 pb-4 pt-2 text-gray-600 leading-relaxed border-t border-gray-100">
                                {item.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Contact Support CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-8 border border-primary-600"
        >
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Non hai trovato quello che cercavi?
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Il nostro team è qui per aiutarti
          </p>
          <a
            href="mailto:support@DisdEasy.it"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Contatta il Supporto</span>
          </a>
        </motion.div>
      </div>
    </div>
  )
}