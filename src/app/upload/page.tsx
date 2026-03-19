"use client"

import { useState, useEffect, Suspense, type FormEvent } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { logger } from '@/lib/logger'
import { OnboardingSteps } from '@/components/OnboardingSteps'
import { onboardingFlowSteps } from '@/config/onboardingSteps'

function UploadContent() {
  const { user, isAuthLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const operatorId = searchParams.get('operator')
  const categoryId = searchParams.get('category')

  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [operatorName, setOperatorName] = useState<string | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : null
        },
        set(name: string, value: string, options: any) {
          document.cookie = `${name}=${value}; path=/; ${options.maxAge ? `max-age=${options.maxAge};` : ''} SameSite=Lax`
        },
        remove(name: string) {
          document.cookie = `${name}=; path=/; max-age=0`
        }
      }
    }
  )

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  // Redirect se mancano i parametri
  useEffect(() => {
    if (!isAuthLoading && (!operatorId || !categoryId)) {
      router.replace('/new-disdetta')
    }
  }, [isAuthLoading, operatorId, categoryId, router])

  // Fetch nome operatore per visualizzazione
  useEffect(() => {
    const fetchOperatorName = async () => {
      if (!operatorId) return
      setLoadingInfo(true)
      try {
        const { data, error } = await supabase
          .from('operators')
          .select('name')
          .eq('id', operatorId)
          .single()
        if (!error && data) {
          setOperatorName(data.name)
        }
      } catch (err) {
        console.error('Error fetching operator info:', err)
      } finally {
        setLoadingInfo(false)
      }
    }
    fetchOperatorName()
  }, [operatorId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const MAX_SIZE = 10 * 1024 * 1024
    if (selectedFile.size > MAX_SIZE) {
      toast.error('File troppo grande. Massimo 10MB.')
      e.target.value = ''
      return
    }

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/tiff'
    ]
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Formato non supportato. Usa PDF, PNG, JPG o TIFF.')
      e.target.value = ''
      return
    }

    if (selectedFile.type.startsWith('image/')) {
      const img = new Image()
      const objectUrl = URL.createObjectURL(selectedFile)
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        if (img.width < 800 || img.height < 600) {
          toast.error('Immagine troppo piccola. Minimo 800x600 pixel.')
          e.target.value = ''
          return
        }
        setFile(selectedFile)
        setError(null)
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        toast.error('Immagine corrotta. Riprova con un altro file.')
        e.target.value = ''
      }
      img.src = objectUrl
    } else {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('📁 Seleziona un file prima di procedere', { duration: 4000, id: 'no-file' })
      return
    }
    if (!user) {
      toast.error('🔒 Sessione non valida. Rieffettua il login.', { duration: 5000, id: 'no-user' })
      router.push('/login')
      return
    }
    if (!operatorId || !categoryId) {
      toast.error('Parametri mancanti. Torna indietro e riprova.')
      router.replace('/new-disdetta')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const timestamp = Date.now()
    const filePath = `${user.id}/${operatorId}/${timestamp}_${file.name}`
    let recordId: number | null = null

    try {
      // --- 1. Upload Bolletta ---
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documenti_utente')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError
      logger.info('File bolletta uploaded', { path: uploadData.path, operatorId, userId: user.id })

      // --- 1.5 Server-side Document Validation ---
      logger.info('[Upload] Validating document quality...')
      try {
        const validationRes = await fetch('/api/validate-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: filePath, bucket: 'documenti_utente' })
        })
        const validationData = await validationRes.json()
        if (!validationRes.ok || !validationData.is_valid) {
          await supabase.storage.from('documenti_utente').remove([filePath])
          const reason = validationData.reason || 'qualità insufficiente'
          toast.error(`Documento non valido: ${reason}`, { duration: 6000 })
          setError(`Documento non valido: ${reason}`)
          setIsSubmitting(false)
          return
        }
        logger.info('[Upload] Document validation passed')
      } catch (validationError) {
        logger.warn('[Upload] Validation check failed, proceeding anyway', {
          error: validationError instanceof Error ? validationError.message : String(validationError)
        })
      }

      // --- 2. Creazione record DB con operator_id e category_id ---
      const { data: recordData, error: insertError } = await supabase
        .from('disdette')
        .insert({
          user_id: user.id,
          operator_id: Number(operatorId),
          category_id: Number(categoryId),
          file_path: filePath,
        })
        .select('id')
        .single()

      if (insertError) throw new Error(`Errore creazione record: ${insertError.message}`)
      if (!recordData) throw new Error("Impossibile recuperare l'ID del record creato.")

      recordId = recordData.id
      logger.info('Database record created', { recordId, filePath, userId: user.id, status: 'PROCESSING' })

      // --- 3. Invocazione Edge Function ---
      const { error: invokeError } = await supabase.functions.invoke(
        'process-document',
        { body: { id: recordId } }
      )
      if (invokeError) throw invokeError

      logger.info('Edge Function invoked successfully, redirecting to review', { recordId, userId: user.id })
      router.push(`/review?id=${recordId}`)

    } catch (error: unknown) {
      let errorMessage = 'Errore sconosciuto.'
      if (error instanceof Error) errorMessage = error.message
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  if (isAuthLoading || !user) {
    return <div className="p-8 text-center">Caricamento...</div>
  }

  return (
    <>
      {/* Onboarding Stepper - Upload è il 3° step (indice 2) nel nuovo flusso a 3 step */}
      <OnboardingSteps
        steps={onboardingFlowSteps}
        currentStep={2}
      />

      <div className="bg-white">
        <div className="mx-auto max-w-2xl p-8">
          <h1 className="mb-6 text-3xl font-bold">Carica il tuo documento</h1>
          <p className="mb-4 text-gray-600">
            {loadingInfo ? (
              <>Stai per avviare la disdetta. Carica il documento richiesto (es. bolletta, contratto, modulo).</>
            ) : operatorName ? (
              <>
                Stai per avviare la disdetta per{' '}
                <span className="font-semibold text-primary-600">{operatorName}</span>
                . Carica il documento richiesto (es. bolletta, contratto, modulo).
              </>
            ) : (
              <>Stai per avviare la disdetta. Carica il documento richiesto (es. bolletta, contratto, modulo).</>
            )}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
            <div id="file-upload-area">
              <label htmlFor="documento_bolletta" className="block text-sm font-medium text-gray-700">
                Documento Bolletta
              </label>
              <input
                type="file"
                id="documento_bolletta"
                onChange={handleFileChange}
                accept="application/pdf, image/png, image/jpeg"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !file}
                className="flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Caricamento e analisi...' : 'Avanti'}
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  )
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <UploadContent />
    </Suspense>
  )
}
