'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Building2, Zap, Flame, Phone, Search } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Operator {
  id: number
  name: string
  category_id: number
  categories: {
    id: number
    name: string
  } | null
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  'Energia': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Gas': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Telecom': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  'Internet': { bg: 'bg-primary-100', text: 'text-primary-800' }
}

const categoryIcons: Record<string, any> = {
  'Energia': Zap,
  'Gas': Flame,
  'Telecom': Phone,
  'Internet': Phone
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>('Tutti')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchOperators() {
      try {
        const { data, error } = await supabase
          .from('operators')
          .select(`
            id,
            name,
            category_id,
            categories!inner (
              id,
              name
            )
          `)
          .order('name')

        if (error) throw error
        
        // ✅ Trasformazione esplicita: no cast, no errori TypeScript
        if (data) {
          const transformedData: Operator[] = data.map(op => ({
            id: op.id,
            name: op.name,
            category_id: op.category_id,
            // ✅ Se è array, prendi primo elemento; se è oggetto, usa direttamente
            categories: Array.isArray(op.categories)
              ? (op.categories.length > 0 ? op.categories[0] : null)
              : op.categories || null
          }))
          setOperators(transformedData)
        }
      } catch (error) {
        console.error('Error fetching operators:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOperators()
  }, [])

  // Get unique categories for filters
  const categories = useMemo(() => {
    const cats = new Set(['Tutti'])
    operators.forEach(op => {
      if (op.categories) {  // ✅ Controlla solo esistenza
        cats.add(op.categories.name)  // ✅ Accesso diretto
      }
    })
    return Array.from(cats)
  }, [operators])

  // Filter operators
  const filteredOperators = useMemo(() => {
    let filtered = operators

    // Filter by category
    if (activeFilter !== 'Tutti') {
      filtered = filtered.filter(op =>
        op.categories && op.categories.name === activeFilter  // ✅
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(op =>
        op.name.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [operators, activeFilter, searchQuery])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50">
      {/* Hero Section */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
              Operatori Supportati
            </h1>
            <p className="text-sm sm:text-base text-gray-600 text-lg mb-4">
              Puoi inviare disdette a tutti i principali fornitori italiani di energia, gas e telecomunicazioni
            </p>

            {/* Filters and Search */}
            <div className="relative max-w-2xl mx-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Search Bar */}
                <div className="relative max-w-md mx-auto mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cerca operatore..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveFilter(category)}
                      className={`px-4 py-2 rounded-full font-medium transition-all ${
                        activeFilter === category
                          ? 'bg-gradient-primary text-white shadow-lg scale-105'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-500 hover:scale-105'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Operators Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="text-sm sm:text-base mt-4 text-gray-600">Caricamento operatori...</p>
          </div>
        ) : filteredOperators.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-sm sm:text-base text-gray-500 mb-4">
              Nessun operatore trovato
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Cancella ricerca
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-600 mb-8"
            >
              Trovati <span className="font-semibold text-primary-600">{filteredOperators.length}</span> operatori
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOperators.map((operator, index) => {
                const categoryName = operator.categories
                  ? operator.categories.name
                  : 'Altro'
                const colors = categoryColors[categoryName] || { bg: 'bg-gray-100', text: 'text-gray-800' }
                const Icon = categoryIcons[categoryName] || Building2

                return (
                  <motion.div
                    key={operator.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 hover:shadow-xl hover:scale-105 transition-all"
                  >
                    {/* ✅ Tutto in una riga orizzontale */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Icona + Nome */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-gradient-primary text-white rounded-lg flex-shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 text-base truncate">
                          {operator.name}
                        </h3>
                      </div>
                      {/* Badge categoria */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${colors.bg} ${colors.text}`}>
                          {categoryName}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-8 border border-primary-600 text-center"
        >
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Non trovi il tuo operatore?
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Stiamo continuamente aggiungendo nuovi operatori. Contattaci per richiedere il supporto per il tuo fornitore.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Contattaci
          </a>
        </motion.div>
      </div>
    </div>
  )
}
