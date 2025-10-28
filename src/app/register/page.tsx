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
  
  // Stati per feedback all'utente
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Funzione chiamata quando l'utente invia il modulo
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Previene il ricaricamento della pagina
    
    setLoading(true)
    setMessage('')
    setError('')

    // Usiamo la funzione signUp di Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    setLoading(false)

    if (error) {
      // Se c'è un errore, lo mostriamo
      setError(error.message)
    } else if (data.user) {
      // Se la registrazione ha successo
      // Nota: Supabase invia un'email di conferma di default
      setMessage('Registrazione avvenuta! Controlla la tua email per il link di conferma.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Crea il tuo Account
        </h1>
        
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

        {/* Messaggi di feedback */}
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