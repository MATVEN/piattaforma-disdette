'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileFormSchema, type ProfileFormData } from '@/domain/schemas'

type Profile = {
  nome: string | null
  cognome: string | null
  indirizzo_residenza: string | null
  telefono: string | null
  documento_identita_path: string | null
}

export default function ProfilePage() {
  const { user, isAuthLoading } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null)
  const [currentDocPath, setCurrentDocPath] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nome: '',
      cognome: '',
      indirizzo_residenza: '',
      telefono: '',
    }
  })

  // --- 1. PROTEZIONE PAGINA ---
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
            .select('nome, cognome, indirizzo_residenza, telefono, documento_identita_path')
            .maybeSingle() 

          if (error) throw error
          if (data) {
            reset({
              nome: data.nome || '',
              cognome: data.cognome || '',
              indirizzo_residenza: data.indirizzo_residenza || '',
              telefono: data.telefono || '',
            })
            setCurrentDocPath(data.documento_identita_path)
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
  }, [user, reset])

  // --- 3. Gestore File ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIdDocumentFile(e.target.files[0])
      setError(null)
    }
  }

  // --- 4. GESTORE INVIO ---
  const onSubmit: SubmitHandler<ProfileFormData> = async (formData) => {
    if (!user) {
      setError('Utente non trovato.')
      return
    }

    setError(null)
    setSuccess(null)

    // --- NUOVO CONTROLLO C13.5 ---
    if (!idDocumentFile && !currentDocPath) {
      setError("Il documento d'identità è obbligatorio. Seleziona un file.")
      return // Blocca l'invio
    }
    // --- FINE CONTROLLO ---

    try {
      let filePath: string | null = currentDocPath

      // A. Upload Documento
      if (idDocumentFile) {
        const newFilePath = `${user.id}/${idDocumentFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('documenti-identita')
          .upload(newFilePath, idDocumentFile, { upsert: true })
        if (uploadError) throw uploadError
        filePath = newFilePath
      }

      // B. Aggiornamento Dati 'profiles'
      const profileUpdate = {
        user_id: user.id,
        nome: formData.nome,
        cognome: formData.cognome,
        indirizzo_residenza: formData.indirizzo_residenza,
        telefono: formData.telefono,
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
      
      setCurrentDocPath(upsertedData.documento_identita_path)
      setIdDocumentFile(null)

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error: unknown) {
      if (error instanceof Error) setError(error.message)
      else setError('Errore sconosciuto during il salvataggio del profilo.')
    }
  }

  // --- 5. RENDER (Caricamento) ---
  if (isAuthLoading || !user || loading) {
    return <div className="p-8 text-center">Caricamento...</div>
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Il mio Profilo</h1>
      <p className="mb-4 text-gray-600">
        Completa i tuoi dati anagrafici per poter procedere con le disdette.
      </p>

      {/* --- 6. RENDER FORM --- */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        
        {/* Nome */}
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            type="text" id="nome"
            {...register("nome")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>}
        </div>

        {/* Cognome */}
        <div>
          <label htmlFor="cognome" className="block text-sm font-medium text-gray-700">Cognome</label>
          <input
            type="text" id="cognome"
            {...register("cognome")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.cognome && <p className="mt-1 text-sm text-red-600">{errors.cognome.message}</p>}
        </div>

        {/* Indirizzo Residenza */}
        <div>
          <label htmlFor="indirizzo_residenza" className="block text-sm font-medium text-gray-700">Indirizzo di Residenza</label>
          <input
            type="text" id="indirizzo_residenza"
            {...register("indirizzo_residenza")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.indirizzo_residenza && <p className="mt-1 text-sm text-red-600">{errors.indirizzo_residenza.message}</p>}
        </div>

        {/* Telefono */}
        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Telefono</label>
          <input
            type="tel" id="telefono"
            {...register("telefono")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono.message}</p>}
        </div>
        
        {/* Documento Identità */}
        <div>
          <label htmlFor="documento" className="block text-sm font-medium text-gray-700">Documento di Identità</label>
          <input
            type="file" id="documento" name="documento"
            onChange={handleFileChange}
            accept="application/pdf, image/png, image/jpeg"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {currentDocPath && !idDocumentFile && (
             <p className="mt-2 text-sm text-gray-500">
               File attuale: {currentDocPath.split('/').pop()}
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

      {/* Messaggi di feedback (API) */}
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