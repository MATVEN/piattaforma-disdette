// src/app/error.tsx
// 500 - Errore generico

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { XCircle, Home } from 'lucide-react'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error caught by error boundary:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-card p-8 sm:p-12 max-w-md mx-auto"
      >
        <div className="flex flex-col items-center text-center gap-6">
          {/* Icon */}
          <XCircle className="h-16 w-16 text-danger-600" />

          {/* Content */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Si è verificato un errore
            </h1>
            <p className="text-gray-600 mt-2">
              Qualcosa è andato storto. Stiamo lavorando per risolvere il problema.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={reset}
              className="flex-1 inline-flex items-center justify-center space-x-2 rounded-lg bg-gradient-primary px-6 py-3 text-sm font-medium text-white shadow-glass transition-all hover:shadow-glass-hover hover:scale-105"
            >
              <span>Riprova</span>
            </button>
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <Home className="h-4 w-4" />
              <span>Torna alla Dashboard</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
