"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthHeader } from '@/components/AuthHeader'
import { LegalFooter } from '@/components/LegalFooter'

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isValidSession, setIsValidSession] = useState(false)
    const [checking, setChecking] = useState(true)
    const router = useRouter()

    // Check if user has valid recovery session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            
            if (session) {
                setIsValidSession(true)
            } else {
                toast.error('Link non valido o scaduto. Richiedi un nuovo reset.')
                setTimeout(() => router.push('/reset-password'), 3000)
            }
            setChecking(false)
        }

        checkSession()
    }, [router])

    const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // Validate passwords match
        if (password !== confirmPassword) {
            toast.error('Le password non coincidono')
            return
        }

        // Validate password strength
        if (password.length < 8) {
            toast.error('La password deve essere di almeno 8 caratteri')
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.updateUser({
            password: password,
        })

        setLoading(false)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Password aggiornata con successo!')
            setTimeout(() => router.push('/login'), 2000)
        }
    }

    if (checking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        )
    }

    if (!isValidSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20 p-8 max-w-md"
                >
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">Link non valido</h3>
                        <p className="text-gray-600">Reindirizzamento alla pagina di reset...</p>
                    </div>
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
                <AuthHeader subtitle="Imposta la nuova password 🔒" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20 p-6 sm:p-8"
                >
                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                        {/* New Password Field */}
                        <div>
                            <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Nuova Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Minimo 8 caratteri</p>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Conferma Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
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
                                    <span>Aggiornamento...</span>
                                </>
                            ) : (
                            <>
                                <span>Aggiorna Password</span>
                                <ArrowRight className="h-5 w-5" />
                            </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>

                <LegalFooter />
            </motion.div>
        </div>
    )
}