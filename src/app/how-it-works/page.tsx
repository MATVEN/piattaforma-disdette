'use client'

import { motion } from 'framer-motion'
import { Upload, Sparkles, CheckCircle, Send, ArrowRight, Clock, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    number: 1,
    title: 'Carica Bolletta',
    description: 'Carica il documento del tuo contratto (PDF, PNG, JPG). Il sistema supporta tutti i principali fornitori italiani.',
    icon: Upload,
    color: 'indigo'
  },
  {
    number: 2,
    title: 'OCR Automatico',
    description: 'L\'intelligenza artificiale estrae automaticamente tutti i dati necessari tramite Google Document AI.',
    icon: Sparkles,
    color: 'purple'
  },
  {
    number: 3,
    title: 'Verifica Dati',
    description: 'Rivedi e conferma le informazioni estratte. Puoi modificare qualsiasi campo prima di procedere.',
    icon: CheckCircle,
    color: 'green'
  },
  {
    number: 4,
    title: 'Invio PEC',
    description: 'La disdetta viene inviata automaticamente al fornitore tramite PEC certificata con valore legale.',
    icon: Send,
    color: 'indigo'
  }
]

const features = [
  {
    icon: Clock,
    title: 'Veloce',
    description: 'Solo 5 minuti per completare la procedura'
  },
  {
    icon: Shield,
    title: 'Sicuro',
    description: 'PEC certificata con valore legale'
  },
  {
    icon: Zap,
    title: 'Semplice',
    description: 'Processo guidato passo-passo'
  }
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Come funziona DisEasy
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Inviare una disdetta non è mai stato così semplice. Segui questi 4 passaggi e pensa al resto.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            const colorClasses = {
              indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
              purple: 'bg-purple-100 text-purple-600 border-purple-200',
              pink: 'bg-pink-100 text-pink-600 border-pink-200',
              green: 'bg-green-100 text-green-600 border-green-200'
            }

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-xl ${colorClasses[step.color as keyof typeof colorClasses]} border`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white text-sm font-bold">
                        {step.number}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/60 backdrop-blur-sm border-y border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perché Scegliere DisEasy
            </h2>
            <p className="text-gray-600 text-lg">
              Il modo più rapido e sicuro per gestire le tue disdette
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary text-white mb-4">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-indigo-600 to-pink-500 rounded-2xl p-8 md:p-12 text-center text-white shadow-2xl"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto per Iniziare?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Invia la tua prima disdetta in meno di 5 minuti
          </p>
          <Link
            href="/new-disdetta"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <span>Inizia Ora</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}