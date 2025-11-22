// src/app/global-error.tsx
// Global error boundary - last resort error handler

'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Critical error caught by global error boundary:', error)
  }, [error])

  return (
    <html lang="it">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-card p-8 sm:p-12 max-w-md mx-auto"
          >
            <div className="flex flex-col items-center text-center gap-6">
              {/* Icon */}
              <AlertTriangle className="h-16 w-16 text-warning-600" />

              {/* Content */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Errore critico
                </h1>
                <p className="text-gray-600 mt-2">
                  Si è verificato un errore inaspettato. Ricarica la pagina o contatta il supporto.
                </p>
              </div>

              {/* Button */}
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center space-x-2 rounded-lg bg-gradient-primary px-6 py-3 text-sm font-medium text-white shadow-glass transition-all hover:shadow-glass-hover hover:scale-105"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Ricarica la pagina</span>
              </button>
            </div>
          </motion.div>
        </div>
      </body>
    </html>
  )
}
