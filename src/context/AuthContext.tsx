// src/context/AuthContext.tsx
"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

// 1. Aggiungi isLoading al tipo
interface AuthContextType {
  session: Session | null
  user: User | null
  isLoading: boolean // <-- AGGIUNTO
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // <-- AGGIUNTO (inizia true)

  useEffect(() => {

    // Controlla la sessione all'avvio
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false) // <-- AGGIUNTO (finito caricamento)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false) // <-- AGGIUNTO (finito anche qui)
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user,
    isLoading, // <-- AGGIUNTO
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}