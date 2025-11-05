"use client"

import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams } from 'next/navigation'

// Definiamo i passi del nostro wizard
type UploadStep = 'bolletta' | 'delega' | 'sending'

export default function UploadPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const serviceId = params.serviceId as string

  // --- STATI PRINCIPALI ---
  const [step, setStep] = useState<UploadStep>('bolletta') // Stato del wizard
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false) // Blocco pulsanti

  // --- STATI DEI FILE ---
  const [fileBolletta, setFileBolletta] = useState<File | null>(null)
  const [pathBolletta, setPathBolletta] = useState<string | null>(null) // Salviamo il path del file 1
  
  const [fileDelega, setFileDelega] = useState<File | null>(null)

  // --- 1. PROTEZIONE PAGINA (Invariato) ---
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  // --- 2. GESTORI SELEZIONE FILE ---
  const handleFileChangeBolletta = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileBolletta(e.target.files[0])
      setError(null)
    }
  }

  const handleFileChangeDelega = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileDelega(e.target.files[0])
      setError(null)
    }
  }

  // --- 3. GESTORE INVIO (MODIFICATO) ---
  // Ora questo gestisce entrambi gli step
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('Utente non trovato.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // --- STEP 1: UPLOAD BOLLETTA ---
      if (step === 'bolletta') {
        if (!fileBolletta) {
          throw new Error('Per favore, seleziona il file della bolletta.')
        }
        
        const filePath = `${user.id}/${serviceId}/${fileBolletta.name}`
        const { error: uploadError } = await supabase.storage
          .from('documenti_utente') // Bucket C3
          .upload(filePath, fileBolletta, { upsert: true })

        if (uploadError) throw uploadError

        setPathBolletta(filePath) // Salviamo il path per dopo
        setStep('delega') // Avanziamo allo step successivo
      
      // --- STEP 2: UPLOAD DELEGA E INVIO FINALE ---
      } else if (step === 'delega') {
        if (!fileDelega) {
          throw new Error('Per favore, seleziona il file di delega.')
        }
        if (!pathBolletta) { // Sicurezza: dovremmo sempre avere il pathBolletta
          throw new Error('Errore: path della bolletta non trovato.')
        }

        // Upload nel nuovo bucket
        const delegaFilePath = `${user.id}/${fileDelega.name}`
        const { error: delegaUploadError } = await supabase.storage
          .from('documenti-delega') // Bucket C7.1
          .upload(delegaFilePath, fileDelega, { upsert: true })

        if (delegaUploadError) throw delegaUploadError
        
        // Ora abbiamo entrambi i file, cambiamo lo stato in "Invio"
        setStep('sending')

        // --- 3. INVOCAZIONE EDGE FUNCTION (Corretto) ---
        const payload = {
          bucket: 'documenti_utente',
          path: pathBolletta,
          delegaPath: delegaFilePath
        }

        console.log("Invocazione Edge Function con payload:", payload)

        const { error: invokeError } = await supabase.functions.invoke(
          'process-document',
          { body: payload }
        )
        if (invokeError) throw invokeError

        // --- 4. REDIRECT A CHECK DATI (C5) ---
        console.log("Invocazione riuscita. Reindirizzamento a /review...")
        router.push(`/review?filePath=${encodeURIComponent(pathBolletta)}`)
      }

    } catch (error: unknown) {
      if (error instanceof Error) setError(error.message)
      else setError('Errore sconosciuto.')
    } finally {
      // Sblocchiamo il pulsante (tranne se stiamo reindirizzando)
      if (step !== 'sending') {
        setIsSubmitting(false)
      }
    }
  }
  
  // --- 4. RENDER (Caricamento Auth) ---
  if (isAuthLoading || !user) {
    return <div className="p-8 text-center">Caricamento...</div>
  }

  // --- 5. RENDER PRINCIPALE ---
  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-3xl font-bold">
        {step === 'bolletta' 
          ? 'Step 1: Carica Documento' 
          : 'Step 2: Carica Delega'}
      </h1>
      <p className="mb-4 text-gray-600">
        {step === 'bolletta'
          ? `Stai per avviare la disdetta per il servizio (ID: ${serviceId}). Carica il documento richiesto (es. bolletta).`
          : 'Ottimo. Ora carica il documento di delega firmato per autorizzarci a inviare la PEC per tuo conto.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        
        {/* Mostra solo lo Step 1 */}
        {step === 'bolletta' && (
          <div>
            <label htmlFor="documento_bolletta" className="block text-sm font-medium text-gray-700">
              Documento Bolletta
            </label>
            <input
              type="file" id="documento_bolletta"
              onChange={handleFileChangeBolletta}
              accept="application/pdf, image/png, image/jpeg"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <button
              type="submit"
              disabled={isSubmitting || !fileBolletta}
              className="mt-6 flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Caricamento...' : 'Avanti'}
            </button>
          </div>
        )}

        {/* Mostra solo lo Step 2 */}
        {(step === 'delega' || step === 'sending') && (
          <div>
            <label htmlFor="documento_delega" className="block text-sm font-medium text-gray-700">
              Documento Delega
            </label>
            <input
              type="file" id="documento_delega"
              onChange={handleFileChangeDelega}
              accept="application/pdf, image/png, image/jpeg"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <button
              type="submit"
              disabled={isSubmitting || !fileDelega || step === 'sending'}
              className="mt-6 flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              {step === 'sending' ? 'Invio e Analisi...' : 'Carica e Invia'}
            </button>
          </div>
        )}

        {/* Messaggio di Errore Globale */}
        {error && (
          <p className="mt-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}