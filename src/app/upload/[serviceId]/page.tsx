// src/app/upload/[serviceId]/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams } from 'next/navigation'

export default function UploadPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const params = useParams() // Hook per leggere i parametri dall'URL
  
  const serviceId = params.serviceId as string // Estraiamo l'ID del servizio

  // Stati per il file e il caricamento
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // --- 1. PROTEZIONE PAGINA ---
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  // --- 2. GESTORE SELEZIONE FILE ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError(null) // Resetta errori precedenti
    }
  }

  // --- 3. GESTORE INVIO/UPLOAD ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!file) {
      setError('Per favore, seleziona un file da caricare.')
      return
    }
    if (!user) {
      setError('Utente non trovato. Esegui nuovamente il login.')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    // Definiamo il percorso (path) sicuro nello storage.
    // Esempio: 1234-abcd-5678/42/documento_bolletta.pdf
    //          (user.id) / (serviceId) / (filename)
    // Questo è FONDAMENTALE per la sicurezza RLS!
    const filePath = `${user.id}/${serviceId}/${file.name}`

    // Usiamo la funzione di upload dello storage
    const { data, error } = await supabase.storage
      .from('documenti_utente') // Nome del nostro bucket
      .upload(filePath, file)   // Percorso e file

    setUploading(false)

    if (error) {
      setError(`Errore durante l'upload: ${error.message}`)
    } else {
      setSuccess(`File caricato con successo! Path: ${data.path}`)
      // QUI, in futuro, salveremo 'data.path' nel nostro database
      // e chiameremo la funzione AI.
      console.log('File caricato:', data)
      // Per ora, reindirizziamo alla homepage dopo 3 secondi
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }
  }

  // --- 4. RENDER ---
  if (isAuthLoading || !user) {
    return <div className="p-8 text-center">Caricamento...</div>
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-3xl font-bold">
        Carica il tuo documento
      </h1>
      <p className="mb-4 text-gray-600">
        Stai per avviare la disdetta per il servizio (ID: {serviceId}). Carica il
        documento richiesto (es. bolletta, contratto, modulo).
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <label 
            htmlFor="document" 
            className="block text-sm font-medium text-gray-700"
          >
            Seleziona documento
          </label>
          <input
            type="file"
            id="document"
            name="document"
            onChange={handleFileChange}
            accept="application/pdf, image/png, image/jpeg" // Accetta solo tipi comuni
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:bg-indigo-50 file:px-4 file:py-2
              file:text-sm file:font-semibold file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={uploading || !file}
            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {uploading ? 'Caricamento in corso...' : 'Carica e procedi'}
          </button>
        </div>
      </form>

      {/* Messaggi di feedback */}
      {success && (
        <p className="mt-4 rounded-md bg-green-100 p-3 text-center text-sm text-green-700">
          {success}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}