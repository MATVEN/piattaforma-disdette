// Indica a Next.js che questo è un "Client Component", 
// necessario per usare 'useState' e gestire l'interazione dell'utente.
"use client"

// Importiamo i 'ganci' di React per gestire lo stato del modulo
import { useState } from 'react'
// Importiamo il nostro client Supabase
import { supabase } from '@/lib/supabaseClient'

export default function RegisterPage() {
  // Stati per salvare i valori degli input
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Stati per feedback all'utente (invariati)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // --- FUNZIONE REGISTRAZIONE CON GOOGLE (NOVITÀ C10) ---
  const handleLoginWithGoogle = async () => {
    setLoading(true)
    setMessage('')
    setError('')
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })

    // Se il reindirizzamento a Google fallisce, mostriamo un errore
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Se ha successo, l'utente viene reindirizzato a Google,
    // quindi non è necessario reimpostare 'loading' a false.
  }

  // --- Funzione di registrazione standard (invariata) ---
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() 
    
    setLoading(true)
    setMessage('')
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else if (data.user) {
      setMessage('Registrazione avvenuta! Controlla la tua email per il link di conferma.')
    }
  }

  // --- JSX (Aggiornato con C10) ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Crea il tuo Account
        </h1>

        {/* --- PULSANTE GOOGLE (NOVITÀ C10) --- */}
        <button
          onClick={handleLoginWithGoogle}
          disabled={loading}
          className="mb-4 flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {/* Aggiungi qui un'icona di Google se vuoi */}
          Registrati con Google
        </button>

        {/* --- DIVISORE (NOVITÀ C10) --- */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Oppure registrati con l&aposemail</span>
          </div>
        </div>
        
        {/* --- Form Email/Password (invariato) --- */}
        <form onSubmit={handleRegister} className="space-y-6">
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
              placeholder="Minimo 6 caratteri"
            />
          </div>

          {/* Pulsante di Invio */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Caricamento...' : 'Registrati'}
            </button>
          </div>
        </form>

        {/* Messaggi di feedback (invariati) */}
        {message && (
          <p className="mt-4 text-center text-sm text-green-600">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}