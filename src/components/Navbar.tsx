// src/components/Navbar.tsx
"use client"

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user } = useAuth() // Non ci serve più isLoading qui
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh() 
  }

  return (
    <nav className="flex w-full items-center justify-between bg-white px-6 py-4 shadow-md">
      <div className="flex items-center">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          DisdettaFacile
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        {user ? (
          // Se l'utente è LOGGATO
          <>
            <span className="hidden text-sm text-gray-700 sm:block">
              Ciao, {user.email}
            </span>
            {/* --- PULSANTE AGGIUNTO --- */}
            <Link
              href="/new-disdetta"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Nuova Disdetta
            </Link>
            {/* ------------------------- */}
            <button
              onClick={handleLogout}
              className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
            >
              Logout
            </button>
          </>
        ) : (
          // Se l'utente NON è loggato
          <>
            <Link 
              href="/login" 
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Accedi
            </Link>
            <Link 
              href="/register" 
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Registrati
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}