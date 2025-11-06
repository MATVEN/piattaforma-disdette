'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation' // <-- ASSICURATI CHE CI SIA

type Profile = {
  nome: string | null
  cognome: string | null
  indirizzo_residenza: string | null
  telefono: string | null
  documento_identita_path: string | null
}

export default function ProfilePage() {
  const { user, isAuthLoading } = useAuth()
  const router = useRouter() // <-- INIZIALIZZA IL ROUTER

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // ... (tutti gli altri stati sono invariati) ...
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<Profile>({
    nome: null,
    cognome: null,
    indirizzo_residenza: null,
    telefono: null,
    documento_identita_path: null,
  })
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null)


  // --- useEffect per Auth (invariato) ---
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  // --- useEffect per Caricamento Dati (invariato) ---
  useEffect(() => {
    if (user) {
      async function fetchProfile() {
        setLoading(true)
        setError(null)
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('nome, cognome, indirizzo_residenza, telefono, documento_identita_path')
            .maybeSingle() 

          if (error) throw error
          if (data) {
            setProfileData(data)
          }
        } catch (error: unknown) {
          if (error instanceof Error) setError(error.message)
          else setError('Errore sconosciuto nel caricamento del profilo.')
        } finally {
          setLoading(false)
        }
      }
      fetchProfile()
    }
  }, [user])

  // --- Gestori Modifiche (invariati) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value || null,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIdDocumentFile(e.target.files[0])
      setError(null)
    }
  }

  // --- Gestore Invio Modulo (MODIFICATO) ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('Utente non trovato.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      let filePath: string | null = profileData.documento_identita_path

      // A. Upload Documento (invariato)
      if (idDocumentFile) {
        const newFilePath = `${user.id}/${idDocumentFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('documenti-identita')
          .upload(newFilePath, idDocumentFile, { upsert: true })
        if (uploadError) throw uploadError
        filePath = newFilePath
      }

      // B. Aggiornamento Dati 'profiles' (invariato)
      const profileUpdate = {
        user_id: user.id,
        nome: profileData.nome,
        cognome: profileData.cognome,
        indirizzo_residenza: profileData.indirizzo_residenza,
        telefono: profileData.telefono,
        documento_identita_path: filePath,
        updated_at: new Date().toISOString(),
      }

      const { data: upsertedData, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileUpdate)
        .select()
        .single()

      if (upsertError) throw upsertError

      setSuccess('Profilo aggiornato con successo! Reindirizzamento...')
      
      if (upsertedData) {
        setProfileData(upsertedData)
      }
      setIdDocumentFile(null)

      // --- INIZIO NUOVA MODIFICA ---
      // Reindirizza l'utente alla dashboard dopo 2 secondi
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000) // 2 secondi per leggere il messaggio di successo
      // --- FINE NUOVA MODIFICA ---

    } catch (error: unknown) {
      if (error instanceof Error) setError(error.message)
      else setError('Errore sconosciuto durante il salvataggio del profilo.')
    } finally {
      // Non reimpostiamo isSubmitting a false se il reindirizzamento
      // sta per avvenire, ma lo facciamo se c'è un errore.
      if (error) {
        setIsSubmitting(false)
      }
    }
  }

  // --- RENDER (invariato) ---
  if (isAuthLoading || !user || loading) {
    return <div className="p-8 text-center">Caricamento...</div>
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      {/* ... resto del JSX ... */}
       <h1 className="mb-6 text-3xl font-bold">Il mio Profilo</h1>
      <p className="mb-4 text-gray-600">
        Completa i tuoi dati anagrafici per poter procedere con le disdette.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        {/* ... tutti gli input (nome, cognome, etc.) sono invariati ... */}
        {/* Nome */}
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            type="text" id="nome" name="nome"
            value={profileData.nome || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        {/* Cognome */}
        <div>
          <label htmlFor="cognome" className="block text-sm font-medium text-gray-700">Cognome</label>
          <input
            type="text" id="cognome" name="cognome"
            value={profileData.cognome || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        {/* Indirizzo Residenza */}
        <div>
          <label htmlFor="indirizzo_residenza" className="block text-sm font-medium text-gray-700">Indirizzo di Residenza</label>
          <input
            type="text" id="indirizzo_residenza" name="indirizzo_residenza"
            value={profileData.indirizzo_residenza || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        {/* Telefono */}
        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Telefono</label>
          <input
            type="tel" id="telefono" name="telefono"
            value={profileData.telefono || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        {/* Documento Identità */}
        <div>
          <label htmlFor="documento" className="block text-sm font-medium text-gray-700">Documento di Identità</label>
          <input
            type="file" id="documento" name="documento"
            onChange={handleFileChange}
            accept="application/pdf, image/png, image/jpeg"
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:bg-indigo-50 file:px-4 file:py-2
              file:text-sm file:font-semibold file:text-indigo-700
              hover:file:bg-indigo-100"
          />
          {profileData.documento_identita_path && !idDocumentFile && (
             <p className="mt-2 text-sm text-gray-500">
               File attuale: {profileData.documento_identita_path.split('/').pop()}
             </p>
          )}
        </div>
        {/* Pulsante Salva */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Salvataggio...' : 'Salva Profilo'}
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