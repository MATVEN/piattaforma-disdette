'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

// Questo componente "avvolge" le pagine che vogliamo proteggere
export default function ProfileRequired({ children }: { children: ReactNode }) {
  const { isProfileComplete, isAuthLoading, isProfileLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Non fare nulla mentre l'autenticazione o il profilo stanno ancora caricando
    if (isAuthLoading || isProfileLoading) {
      return
    }

    // Se l'utente non è loggato, l'AuthContext lo gestirà (o lo farà un'altra route protetta),
    // ma se è loggato E il profilo NON è completo...
    if (user && !isProfileComplete) {
      // ...reindirizzalo forzatamente!
      console.log("C9: Profilo incompleto, reindirizzamento a /profileUser")
      router.push('/profileUser') 
    }
  }, [isProfileComplete, isAuthLoading, isProfileLoading, user, router])

  // --- Gestione Stati di Caricamento ---
  
  // 1. Mostra il caricamento se l'auth o il profilo stanno caricando
  if (isAuthLoading || isProfileLoading) {
    return <div className="p-8 text-center">Caricamento...</div>
  }

  // 2. Se l'utente è loggato E il profilo è completo, mostra la pagina
  if (user && isProfileComplete) {
    return <>{children}</> // Mostra il contenuto della pagina protetta
  }

  // 3. Se l'utente non è loggato o il profilo non è completo,
  // il reindirizzamento (useEffect) è già in corso.
  // Mostriamo null o un caricamento per evitare "sfarfallii".
  return <div className="p-8 text-center">Verifica profilo in corso...</div>
}