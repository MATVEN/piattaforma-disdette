'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

type Profile = {
  nome: string | null
  cognome: string | null
  indirizzo_residenza: string | null
  telefono: string | null
  documento_identita_path: string | null
}

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  // --- 2. Caricamento Dati Profilo ---
  useEffect(() => {
    if (user) {
      async function fetchProfile() {
        setLoading(true)
        setError(null)
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .maybeSingle()

          if (error) throw error
          
          // Se i dati esistono (utente vecchio con profilo), popola il form
          if (data) {
            setProfileData(data)
          }
          // Se data è null (nuovo utente), il form resta vuoto, senza errori.
          
        } catch (error: unknown) { // Ora questo prenderà solo errori REALI
          if (error instanceof Error) {
            setError(error.message)
          } else {
            setError('Errore sconosciuto nel caricamento del profilo.')
          }
        } finally {
          setLoading(false)
        }
      }
      fetchProfile()
    }
  }, [user])

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

  // --- 4. Gestore Invio Modulo ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('Utente non trovato.')
      return
    }

    setIsSubmitting(true)
    setError(null) // Resettiamo gli errori prima di iniziare
    setSuccess(null)

    try {
      let filePath: string | null = profileData.documento_identita_path

      // --- A. Upload Documento (invariato) ---
      if (idDocumentFile) {
        const newFilePath = `${user.id}/${idDocumentFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('documenti-identita')
          .upload(newFilePath, idDocumentFile, {
            upsert: true,
          })
        if (uploadError) throw uploadError
        filePath = newFilePath
      }

      // --- B. Aggiornamento Dati Tabella 'profiles' ---
      
      // Prepariamo i dati per l'UPSERT.
      const profileUpdate = {
        user_id: user.id, // <-- Chiave Primaria
        nome: profileData.nome,
        cognome: profileData.cognome,
        indirizzo_residenza: profileData.indirizzo_residenza,
        telefono: profileData.telefono,
        documento_identita_path: filePath,
        updated_at: new Date().toISOString(),
      }

      // Eseguiamo l'UPSERT (che ora funzionerà grazie alla RLS SQL)
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileUpdate)

      if (upsertError) throw upsertError

      setSuccess('Profilo aggiornato con successo!')
      if(filePath) {
        setProfileData(prev => ({...prev, documento_identita_path: filePath}))
      }
      setIdDocumentFile(null)

    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Errore sconosciuto durante il salvataggio del profilo.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- 5. RENDER (invariato) ---
  if (isAuthLoading || !user) {
    return <div className="p-8 text-center">Caricamento...</div>
  }
  
  if (loading) {
     return <div className="p-8 text-center">Caricamento profilo...</div>
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Il mio Profilo</h1>
       <p className="mb-4 text-gray-600">
        Completa i tuoi dati anagrafici per poter procedere con le disdette.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
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