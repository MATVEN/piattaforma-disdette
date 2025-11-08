"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  // --- FUNZIONE LOGIN CON GOOGLE (NOVITÀ C10) ---
  // Aggiunta rispettando la tua logica di 'loading' e 'error'
  const handleLoginWithGoogle = async () => {
    setLoading(true) // <-- Usa il tuo 'loading'
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // (Supabase gestirà il redirect automaticamente
      // in base a quanto configurato nel Task 1)
    })
    
    // Nota: con OAuth, c'è un reindirizzamento.
    // Il 'loading' non tornerà a 'false' se il redirect ha successo.
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  // --- LA TUA FUNZIONE DI LOGIN (Invariata) ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else if (data.user) {
      router.push('/')
    }
  }

  // --- IL TUO JSX (con aggiunte C10) ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Accedi al tuo Account
        </h1>
        
        {/* --- PULSANTE GOOGLE (NOVITÀ C10) --- */}
        <button
          onClick={handleLoginWithGoogle}
          disabled={loading} // <-- Collegato al tuo 'loading'
          className="mb-4 flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {/* Aggiungi qui un'icona di Google se vuoi */}
          Accedi con Google
        </button>

        {/* --- DIVISORE (NOVITÀ C10) --- */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Oppure continua con</span>
          </div>
        </div>
        
        {/* --- IL TUO FORM (Invariato) --- */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Campo Email */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Campo Password */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Pulsante di Invio */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Caricamento...' : 'Accedi'}
            </button>
          </div>
        </form>

        {/* Messaggio di errore */}
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}