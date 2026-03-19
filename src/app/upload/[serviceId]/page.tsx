'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Questa route (/upload/[serviceId]) non è più valida dopo la rimozione di service_types.
 * Redirect automatico alla pagina di nuova disdetta.
 */
export default function OldUploadPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/new-disdetta')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Reindirizzamento...</p>
      </div>
    </div>
  )
}
