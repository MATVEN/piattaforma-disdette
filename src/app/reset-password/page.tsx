"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { AuthHeader } from '@/components/AuthHeader'
import { LegalFooter } from '@/components/LegalFooter'

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)

    const router = useRouter()

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        })

        setLoading(false)

        if (error) {
            toast.error(error.message)
        } else {
            setEmailSent(true)
            toast.success('Email di reset inviata! Controlla la tua casella.')
        }
    }

    if (emailSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50 flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <AuthHeader subtitle="Email inviata! 📧" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20 p-6 sm:p-8"
                >
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-900">
                        Controlla la tua email
                        </h3>
                        
                        <p className="text-gray-600">
                        Abbiamo inviato un link per reimpostare la password a{' '}
                        <span className="font-medium text-gray-900">{email}</span>
                        </p>

                        <p className="text-sm text-gray-500">
                        Non hai ricevuto l'email? Controlla la cartella spam o riprova tra qualche minuto.
                        </p>

                        <div className="pt-4">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Torna al login
                        </Link>
                        </div>
                    </div>
                </motion.div>

                <LegalFooter />
            </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50 flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
            >
                <AuthHeader subtitle="Reimposta la tua password 🔑" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20 p-6 sm:p-8"
                >
                    <p className="text-gray-600 mb-6 text-center">
                        Inserisci la tua email e ti invieremo un link per reimpostare la password.
                    </p>

                    <form onSubmit={handleResetPassword} className="space-y-5">
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
                                <span>Invio in corso...</span>
                            </>
                            ) : (
                            <span>Invia link di reset</span>
                            )}
                        </motion.button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Torna al login
                        </Link>
                    </div>
                </motion.div>

                <LegalFooter />
            </motion.div>
        </div>
    )
}