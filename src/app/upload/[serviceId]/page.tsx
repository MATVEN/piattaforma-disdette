"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams } from 'next/navigation'

export default function UploadPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  
  const serviceId = params.serviceId as string

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError(null)
      setSuccess(null)
    }
  }

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

    const filePath = `${user.id}/${serviceId}/${file.name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documenti_utente')
      .upload(filePath, file, {
        upsert: true
      })

    if (uploadError) {
      setUploading(false)
      setError(`Errore durante l'upload: ${uploadError.message}`)
      return
    }

    console.log('File caricato con successo:', uploadData.path)

    try {
      console.log("Invocazione Edge Function 'process-document'...")
      
      const { error: invokeError } = await supabase.functions.invoke(
        'process-document',
        {
          body: {
            bucket: 'documenti_utente',
            path: filePath
          }
        }
      )

      if (invokeError) {
        throw invokeError
      }

      console.log("Edge Function 'process-document' invocata con successo.")
      
      router.push(`/review?filePath=${encodeURIComponent(filePath)}`)

    } catch (error: unknown) { // <-- CORREZIONE 1 (era: any)
      setUploading(false)
      // CORREZIONE 2: Controlliamo il tipo di errore
      if (error instanceof Error) {
        setError(`Upload riuscito, ma l'analisi AI non è partita: ${error.message}`)
      } else {
        setError(`Upload riuscito, ma l'analisi AI non è partita: Errore sconosciuto.`)
      }
    }
  }

  if (isAuthLoading || !user) {
    return <div className="p-8 text-center">Caricamento...</div>
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      {/* ... il resto del tuo JSX ... */}
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
            accept="application/pdf, image/png, image/jpeg"
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
            {uploading ? 'Caricamento e analisi...' : 'Carica e procedi'}
          </button>
        </div>
      </form>

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