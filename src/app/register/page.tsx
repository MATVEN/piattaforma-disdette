"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { AuthHeader } from '@/components/AuthHeader'
import { OAuthButton } from '@/components/OAuthButton'
import { LegalFooter } from '@/components/LegalFooter'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const router = useRouter()

  // Google OAuth Registration
  const handleLoginWithGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  // Email/Password Registration
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else if (data.user) {
      setRegistered(true)
      toast.success('Registrazione avvenuta! Controlla la tua email.')
    }
  }

  // Success state
  if (registered) {
    return (
      <div className="bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20 p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="h-10 w-10 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registrazione Completata!
            </h2>
            <p className="text-gray-600 mb-6">
              Abbiamo inviato un'email di conferma a <strong>{email}</strong>.
              Clicca sul link nell'email per attivare il tuo account.
            </p>

            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-xl bg-gradient-primary px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Vai al Login
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <AuthHeader 
          subtitle="Crea il tuo account gratuito"
        />

        {/* Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20 p-6 sm:p-8"
        >
          {/* Google OAuth Button */}
          <OAuthButton onClick={handleLoginWithGoogle} disabled={loading}>
            Registrati con Google
          </OAuthButton>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/80 px-4 text-gray-500">Oppure registrati con l'email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tua@email.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caratteri"
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Almeno 6 caratteri
              </p>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-3 text-sm text-gray-600">
                Accetto i{' '}
                <Link href="/terms-of-service" className="text-primary-600 hover:text-primary-700 font-medium">
                  Termini di Servizio
                </Link>{' '}
                e la{' '}
                <Link href="//privacy-cookie-policy" className="text-primary-600 hover:text-primary-700 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-primary px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Registrazione in corso...</span>
                </>
              ) : (
                <>
                  <span>Registrati</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hai già un account?{' '}
              <Link
                href="/login"
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                Accedi
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer Links */}
        <LegalFooter />
      </motion.div>
    </div>
  )
}