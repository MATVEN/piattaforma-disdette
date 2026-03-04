'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardList from '@/components/DashboardList'
import toast from 'react-hot-toast'

function DashboardContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const paymentSuccessParam = searchParams.get('payment_success')
    const paymentCancelledParam = searchParams.get('payment_cancelled')
    const legacyPaymentParam = searchParams.get('payment') // fallback / legacy
    const sessionId = searchParams.get('session_id')

    const isSuccess =
      paymentSuccessParam === 'true' || legacyPaymentParam === 'success'
    const isCancelled =
      paymentCancelledParam === 'true' || legacyPaymentParam === 'cancelled'

    if (!isSuccess && !isCancelled) return

    const handlePaymentResult = async () => {
      if (isSuccess) {
        // 🔐 Verifica server-side se abbiamo session_id
        if (sessionId) {
          try {
            const res = await fetch('/api/stripe/verify-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId }),
            })

            const data = await res.json()

            if (res.ok && data.ok && data.paid) {
              toast.success(
                'Pagamento completato! Riceverai una email di conferma. La tua disdetta sarà inviata entro 24h.',
                { duration: 6000, icon: '✅', id: 'payment-success' }
              )
            } else {
              toast(
                'Pagamento in verifica. Se hai completato il pagamento, riceverai presto una email di conferma.',
                { icon: '⏳', id: 'payment-pending' }
              )
            }
          } catch (err) {
            console.error('Errore verifica pagamento:', err)
            toast(
              'Errore nella verifica del pagamento. Controlla la tua email per la conferma.',
              { icon: '⚠️', id: 'payment-verification-error' }
            )
          }
        } else {
          // fallback UX (non ideale ma accettabile)
          toast.success(
            'Pagamento completato! Riceverai una email di conferma.',
            { duration: 6000, icon: '✅', id: 'payment-success' }
          )
        }
      }

      if (isCancelled) {
        toast.error(
          'Pagamento annullato. Puoi riprovare quando vuoi dalla lista delle tue pratiche.',
          { duration: 5000, icon: '❌', id: 'payment-cancelled' }
        )
      }

      // 🧹 Clean URL (mantiene il pathname corrente)
      window.history.replaceState({}, '', window.location.pathname)
    }

    handlePaymentResult()
  }, [searchParams])

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full overflow-x-hidden">
        <div className="mb-4 sm:mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Le mie Disdette
          </h1>
        </div>

        <p className="text-gray-600 mb-4 sm:mb-4">
          Qui puoi vedere lo stato di tutte le disdette che hai caricato.
        </p>

        <Suspense fallback={<DashboardLoadingSkeleton />}>
          <DashboardList />
        </Suspense>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

// Skeleton loader
function DashboardLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-16 rounded-lg bg-gray-200"></div>
      <div className="h-16 rounded-lg bg-gray-200"></div>
      <div className="h-16 rounded-lg bg-gray-200"></div>
    </div>
  )
}