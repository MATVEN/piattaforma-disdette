// src/app/not-found.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-card p-8 sm:p-12 max-w-md mx-auto"
      >
        <div className="flex flex-col items-center text-center gap-6">
          {/* 404 Code */}
          <div className="text-6xl font-bold text-primary-600/20">404</div>
          
          {/* Icon */}
          <AlertCircle className="h-16 w-16 text-primary-600 -mt-3" />

          {/* Content */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Pagina non trovata
            </h1>
            <p className="text-gray-600 mt-2">
              La pagina che cerchi non esiste o è stata spostata.
            </p>
          </div>

          {/* Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 rounded-lg bg-gradient-primary px-6 py-3 text-sm font-medium text-white shadow-glass transition-all hover:shadow-glass-hover hover:scale-105"
          >
            <Home className="h-4 w-4" />
            <span>Torna alla Dashboard</span>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}