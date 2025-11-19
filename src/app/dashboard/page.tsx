// src/app/dashboard/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import DashboardList from '@/components/DashboardList'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full overflow-x-hidden">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Le mie Disdette</h1>
        </div>
        
        <p className="text-gray-600 mb-6 sm:mb-8">
          Qui puoi vedere lo stato di tutte le disdette che hai caricato.
        </p>
        
        <Suspense fallback={<DashboardLoadingSkeleton />}>
          <DashboardList />
        </Suspense>
      </div>
    </div>
  )
}

// scheletro di caricamento
function DashboardLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-16 rounded-lg bg-gray-200"></div>
      <div className="h-16 rounded-lg bg-gray-200"></div>
      <div className="h-16 rounded-lg bg-gray-200"></div>
    </div>
  )
}