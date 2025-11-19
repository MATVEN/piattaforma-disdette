import ReviewForm from '@/components/ReviewForm'
import { Suspense } from 'react'

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-12">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Revisiona Dati Estratti</h1>
        <p className="text-gray-600 mb-8">
          La nostra intelligenza artificiale ha estratto i seguenti dati dalla tua
          bolletta. Controlla che siano corretti prima di procedere.
        </p>
        
        <Suspense fallback={<ReviewLoadingSkeleton />}>
          <div className="bg-white rounded-xl shadow-card p-8">
            <ReviewForm />
          </div>
        </Suspense>
      </div>
    </div>
  )
}

function ReviewLoadingSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-card p-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-md w-1/3 mb-4"></div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-md"></div>
        <div className="h-10 bg-gray-200 rounded-md"></div>
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    </div>
  )
}