import ReviewForm from '@/components/ReviewForm'
import { Suspense } from 'react'

// Questa è una pagina Server Component che usa Suspense 
// per gestire il caricamento del componente client sottostante
export default function ReviewPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Revisiona Dati Estratti</h1>
      <p className="text-gray-600 mb-8">
        La nostra intelligenza artificiale ha estratto i seguenti dati dalla tua
        bolletta. Controlla che siano corretti prima di procedere.
      </p>

      {/* Suspense è il modo moderno di Next.js per mostrare un "Caricamento..."
        mentre il componente client (ReviewForm) carica i dati.
      */}
      <Suspense fallback={<ReviewLoadingSkeleton />}>
        <ReviewForm />
      </Suspense>
    </div>
  )
}

// Un semplice componente "scheletro" per il caricamento
function ReviewLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded-md w-1/3 mb-4"></div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-md"></div>
        <div className="h-10 bg-gray-200 rounded-md"></div>
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    </div>
  )
}