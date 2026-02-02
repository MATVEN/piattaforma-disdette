// src/components/EmbeddedPaymentForm.tsx
'use client'

import { useState, useEffect, FormEvent } from 'react'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe/stripe-client'
import { PRICE_CENTS, formatPriceEuros } from '@/lib/stripe/stripe-config'
import { CreditCard, Loader2, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

/* ============================================ */
/*        Types                                  */
/* ============================================ */

interface EmbeddedPaymentFormProps {
  disdettaId: number
  supplierName?: string
  onSuccess: () => void
}

type PaymentState = 'idle' | 'processing' | 'succeeded' | 'failed'

/* ============================================ */
/*        Inner Checkout Form                    */
/* ============================================ */

function CheckoutForm({
  disdettaId,
  supplierName,
  onSuccess,
}: EmbeddedPaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [paymentState, setPaymentState] = useState<PaymentState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setPaymentState('processing')
    setErrorMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/review?id=${disdettaId}&payment_intent_success=true`,
        },
      })

      if (error) {
        setPaymentState('failed')
        setErrorMessage(error.message || 'Errore durante il pagamento.')
        toast.error(error.message || 'Errore durante il pagamento.', { duration: 5000 })
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Verify server-side and update DB
        const verifyRes = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            disdettaId,
            paymentIntentId: paymentIntent.id,
          }),
        })

        const verifyData = await verifyRes.json().catch(() => ({}))

        if (verifyRes.ok && verifyData.paid) {
          console.log('[Payment] SUCCESS - Current URL:', window.location.href)
          console.log('[Payment] disdettaId:', disdettaId)
          setPaymentState('succeeded')
          toast.success('Pagamento completato!', { duration: 4000, id: 'payment-confirmed' })

          // ✅ Ensure ID is in URL before calling onSuccess
          const currentUrl = new URL(window.location.href)
          if (!currentUrl.searchParams.has('id')) {
            currentUrl.searchParams.set('id', disdettaId.toString())
            window.history.replaceState({}, '', currentUrl.toString())
            console.log('[Payment] Added ID to URL:', currentUrl.href)
          }

          onSuccess()
        } else {
          // Payment succeeded at Stripe but DB update failed - still show success
          // The webhook or a retry will eventually sync
          console.warn('Payment succeeded but verification returned:', verifyData)
          setPaymentState('succeeded')
          toast.success('Pagamento completato!', { duration: 4000, id: 'payment-confirmed' })
          onSuccess()
        }
      } else if (paymentIntent) {
        // Payment requires additional action or is processing
        setPaymentState('failed')
        setErrorMessage('Il pagamento richiede ulteriori verifiche. Riprova.')
      }
    } catch (err) {
      console.error('Payment error:', err)
      setPaymentState('failed')
      const msg = err instanceof Error ? err.message : 'Errore nel pagamento'
      setErrorMessage(msg)
      toast.error(msg, { duration: 5000 })
    }
  }

  const isReady = stripe && elements
  const isProcessing = paymentState === 'processing'

  return (
    <div className="space-y-5">
      {/* Order Summary */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">Servizio Disdetta DisdEasy</p>
            {supplierName && (
              <p className="text-sm text-gray-600 mt-0.5">
                Fornitore: {supplierName}
              </p>
            )}
          </div>
          <p className="font-bold text-lg text-gray-900 flex-shrink-0">
            {formatPriceEuros(PRICE_CENTS)}
          </p>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Display */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Errore nel pagamento</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {paymentState === 'succeeded' && (
        <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="font-medium">Pagamento completato con successo!</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={!isReady || isProcessing || paymentState === 'succeeded'}
        className="
          flex items-center justify-center gap-2 w-full
          px-6 py-3 rounded-xl
          bg-gradient-primary text-white font-bold
          shadow-lg hover:shadow-xl
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all hover:scale-[1.02]
        "
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Elaborazione in corso...
          </>
        ) : paymentState === 'succeeded' ? (
          <>
            <CheckCircle className="h-5 w-5" />
            Pagamento confermato
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5" />
            Conferma pagamento ({formatPriceEuros(PRICE_CENTS)})
          </>
        )}
      </button>

      {/* Security Note */}
      <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
        <ShieldCheck className="h-3 w-3" />
        Pagamento sicuro gestito da Stripe
      </p>
    </div>
  )
}

/* ============================================ */
/*        Main Wrapper Component                 */
/* ============================================ */

export function EmbeddedPaymentForm({
  disdettaId,
  supplierName,
  onSuccess,
}: EmbeddedPaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function createIntent() {
      try {
        const res = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disdettaId }),
        })

        const data = await res.json().catch(() => ({}))

        if (!isMounted) return

        if (!res.ok) {
          setError(data?.error || 'Errore nella creazione del pagamento')
          setLoading(false)
          return
        }

        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError('Risposta del server non valida')
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to create payment intent:', err)
        setError('Errore di connessione. Riprova.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    createIntent()

    return () => {
      isMounted = false
    }
  }, [disdettaId])

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-glass">
        <div className="flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-gray-600">Preparazione del pagamento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Errore</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!clientSecret) return null

  const stripePromise = getStripe()

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-glass space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary-600" />
        Completa il pagamento
      </h3>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          locale: 'it',
          appearance: {
            theme: 'stripe',
            variables: {
              borderRadius: '12px',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              fontSizeBase: '14px',
              colorPrimary: '#6366f1', // indigo-500 (primary)
              colorBackground: '#ffffff',
              colorText: '#111827', // gray-900
              colorDanger: '#ef4444', // red-500
              spacingUnit: '4px',
            },
            rules: {
              '.Input': {
                border: '2px solid rgb(229, 231, 235)', // gray-200
                boxShadow: 'none',
              },
              '.Input:focus': {
                border: '2px solid #6366f1', // primary-500
                boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)', // primary ring
              },
            },
          },
        }}
      >
        <CheckoutForm
          disdettaId={disdettaId}
          supplierName={supplierName}
          onSuccess={onSuccess}
        />
      </Elements>
    </div>
  )
}
