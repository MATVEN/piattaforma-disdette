'use client'

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

// --- 1. DEFINIAMO I TIPI ---
type Profile = {
  nome: string | null
  cognome: string | null
  indirizzo_residenza: string | null
  documento_identita_path: string | null
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  isAuthLoading: boolean
  isProfileLoading: boolean
  isProfileComplete: boolean
}

// --- 2. CREIAMO IL CONTEXT ---
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAuthLoading: true,
  isProfileLoading: true,
  isProfileComplete: false,
})

// --- 3. CREIAMO IL PROVIDER ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isProfileComplete, setIsProfileComplete] = useState(false)

  // --- EFFECT 1: GESTIONE AUTENTICAZIONE ---
  useEffect(() => {
    
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      setUser(user)
      setIsAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setIsAuthLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // --- EFFECT 2: GESTIONE PROFILO ---
  useEffect(() => {

    // Definiamo la funzione di fetch *all'interno* dell'effect
    async function fetchProfile(user: User) { // <-- 1. Accetta 'user' come parametro
      setIsProfileLoading(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nome, cognome, indirizzo_residenza, documento_identita_path')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setProfile(data)
          if (data.nome && data.cognome && data.indirizzo_residenza) {
            setIsProfileComplete(true)
          } else {
            setIsProfileComplete(false)
          }
        } else {
          setProfile(null)
          setIsProfileComplete(false)
        }
      } catch (error: unknown) {
        console.error("Errore caricamento profilo:", error)
        setProfile(null)
        setIsProfileComplete(false)
      } finally {
        setIsProfileLoading(false)
      }
    }

    // --- 3. CONTROLLO LOGICO ---
    if (user) {
      // Se l'utente è loggato, carica il profilo
      fetchProfile(user)
    } else {
      // Se l'utente fa logout, resetta tutto
      setProfile(null)
      setIsProfileComplete(false)
      setIsProfileLoading(false)
    }
  }, [user]) // Dipende sempre da 'user'

  // --- 4. ESPONIAMO I VALORI (MEMOIZED) ---
  const value = useMemo(() => ({
    user,
    profile,
    isAuthLoading,
    isProfileLoading,
    isProfileComplete,
  }), [user, profile, isAuthLoading, isProfileLoading, isProfileComplete])
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// --- 5. CREIAMO L'HOOK ---
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}