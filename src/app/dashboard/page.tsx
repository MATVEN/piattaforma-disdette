import { Suspense } from 'react'
import Link from 'next/link'
import DashboardList from '@/components/DashboardList'

// Questa è la pagina server component
export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Le mie Disdette</h1>
        <Link 
          href="/new-disdetta" // Assumendo che C2 sia in questa route
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          + Avvia Nuova Disdetta
        </Link>
      </div>

      <p className="text-gray-600 mb-8">
        Qui puoi vedere lo stato di tutte le disdette che hai caricato.
      </p>

      {/* Usiamo Suspense per mostrare uno scheletro 
          mentre il componente client carica i dati */}
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <DashboardList />
      </Suspense>
    </div>
  )
}

// Un semplice componente "scheletro" per il caricamento
function DashboardLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-16 rounded-md bg-gray-200"></div>
      <div className="h-16 rounded-md bg-gray-200"></div>
      <div className="h-16 rounded-md bg-gray-200"></div>
    </div>
  )
}