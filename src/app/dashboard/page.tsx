// src/app/dashboard/page.tsx

import { Suspense } from 'react'
import Link from 'next/link'
import DashboardList from '@/components/DashboardList'

// La pagina server component
export default function DashboardPage() {
  return (
    // Rimuoviamo il wrapper da qui
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Le mie Disdette</h1>
        <Link 
          href="/new-disdetta"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          + Avvia Nuova Disdetta
        </Link>
      </div>

      <p className="text-gray-600 mb-8">
        Qui puoi vedere lo stato di tutte le disdette che hai caricato.
      </p>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <DashboardList />
      </Suspense>
    </div>
    // Rimuoviamo il wrapper da qui
  )
}

// Lo scheletro di caricamento
function DashboardLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-16 rounded-md bg-gray-200"></div>
      <div className="h-16 rounded-md bg-gray-200"></div>
      <div className="h-16 rounded-md bg-gray-200"></div>
    </div>
  )
}