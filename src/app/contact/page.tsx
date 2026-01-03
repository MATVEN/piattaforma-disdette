'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send, User, MessageSquare, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Domanda Generale',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const subjects = [
    'Domanda Generale',
    'Problema Tecnico',
    'Richiesta Informazioni',
    'Altro'
  ]

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Il nome è obbligatorio'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email è obbligatoria'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Inserisci un\'email valida'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Il messaggio è obbligatorio'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Il messaggio deve contenere almeno 10 caratteri'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Correggi gli errori nel form')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Errore durante l\'invio del messaggio')
      }

      toast.success('Messaggio inviato con successo! Ti risponderemo al più presto.')

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: 'Domanda Generale',
        message: ''
      })
      setErrors({})
    } catch (error) {
      console.error('Error submitting contact form:', error)
      toast.error('Si è verificato un errore. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const characterCount = formData.message.length
  const maxCharacters = 1000

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
              Contattaci
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Hai una domanda o hai bisogno di aiuto? Siamo qui per te.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Nome *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 ${
                    errors.name ? 'border-red-500' : 'border-gray-200'
                  } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none`}
                  placeholder="Il tuo nome"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 ${
                    errors.email ? 'border-red-500' : 'border-gray-200'
                  } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none`}
                  placeholder="tua@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Subject Field */}
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                Oggetto *
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                  Messaggio *
                </label>
                <span className={`text-sm ${
                  characterCount > maxCharacters ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {characterCount} / {maxCharacters}
                </span>
              </div>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  maxLength={maxCharacters}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 ${
                    errors.message ? 'border-red-500' : 'border-gray-200'
                  } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none`}
                  placeholder="Scrivi qui il tuo messaggio..."
                />
              </div>
              {errors.message && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Invio in corso...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Invia Messaggio</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Tempo di Risposta</h3>
            <p className="text-gray-600 text-sm">
              Di solito rispondiamo entro 24 ore nei giorni lavorativi.
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Supporto Email</h3>
            <p className="text-gray-600 text-sm">
              Puoi anche scriverci direttamente a{' '}
              <a href="mailto:support@DisdEasy.it" className="text-indigo-600 hover:text-indigo-700 font-medium">
                support@DisdEasy.it
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}