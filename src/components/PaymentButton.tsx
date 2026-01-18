// src/components/PaymentBUtton.tsx

'use client'

import { useState } from 'react'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { getStripe } from '@/lib/stripe/stripe-client'
import { STRIPE_ERROR_MESSAGES, PRICE_CENTS, formatPriceEuros } from '@/lib/stripe/stripe-config'
import toast from 'react-hot-toast'

interface PaymentButtonProps {
  disdettaId: number
  disabled?: boolean
  className?: string
}

export function PaymentButton({ disdettaId, disabled, className = '' }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disdettaId }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMessage = data?.error || 'Errore nella creazione del checkout'
        throw new Error(errorMessage)
      }

      const { sessionId, url } = data

      // Metodo moderno: usa url se disponibile
      if (url) {
        window.location.href = url
        return
      }

      // Fallback: usa sessionId (backward compatibility)
      if (sessionId) {
        const stripe = await getStripe()
        if (!stripe) {
          throw new Error('Impossibile caricare Stripe. Riprova tra qualche secondo.')
        }

        const result = await (stripe as any).redirectToCheckout({ sessionId })

        if (result && result.error) {
          const errorCode = result.error.code || 'default'
          const friendlyMessage = STRIPE_ERROR_MESSAGES[errorCode] || STRIPE_ERROR_MESSAGES.default
          throw new Error(friendlyMessage)
        }
        return
      }

      throw new Error('Sessione non creata dal server')
    } catch (err) {
      console.error('Payment error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore nel pagamento'
      setError(errorMessage)
      toast.error(errorMessage, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handlePayment}
        disabled={disabled || loading}
        className={`
          flex items-center justify-center gap-2 w-full
          px-6 py-3 rounded-xl
          bg-gradient-primary text-white font-bold
          shadow-lg hover:shadow-xl
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all hover:scale-105
          ${className}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Reindirizzamento sicuro...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Procedi al pagamento ({formatPriceEuros(PRICE_CENTS)})
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Errore nel pagamento</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}