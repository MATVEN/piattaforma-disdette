"use client"

import { useState, useEffect, type FormEvent } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { logger } from '@/lib/logger'
import { OnboardingSteps } from '@/components/OnboardingSteps'
import { onboardingFlowSteps } from '@/config/onboardingSteps'
import { DISDETTA_STATUS } from '@/types/enums'

export default function UploadPage() {
  const { user, isAuthLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const serviceId = params.serviceId as string

  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serviceInfo, setServiceInfo] = useState<{
    serviceName: string
    operatorName: string
  } | null>(null)
  const [loadingServiceInfo, setLoadingServiceInfo] = useState(true)

  // Create Supabase client dynamically with current env vars and cookie handling
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
        remove(name: string, options: any) {
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

  // Fetch service info for display
  useEffect(() => {
  const fetchServiceInfo = async () => {
    if (!serviceId) return
    setLoadingServiceInfo(true)
    try {
      // 1. Get service type
      const { data: service, error: serviceError } = await supabase
        .from('service_types')
        .select('name, operator_id')
        .eq('id', serviceId)
        .single()
      if (serviceError || !service) {
        console.error('Service not found:', serviceError)
        setLoadingServiceInfo(false)
        return
      }
      // 2. Get operator
      const { data: operator, error: operatorError } = await supabase
        .from('operators')
        .select('name')
        .eq('id', service.operator_id)
        .single()
      if (operatorError || !operator) {
        console.error('Operator not found:', operatorError)
        setLoadingServiceInfo(false)
        return
      }
      setServiceInfo({
        serviceName: service.name,
        operatorName: operator.name
      })
    } catch (err) {
      console.error('Error fetching service info:', err)
    } finally {
      setLoadingServiceInfo(false)
    }
  }
  fetchServiceInfo()
  }, [serviceId, supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  // --- GESTORE INVIO (MODIFICATO C14) ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('📁 Seleziona un file prima di procedere', {
        duration: 4000,
        id: 'no-file'
      })
      return
    }

    if (!user) {
      toast.error('🔒 Sessione non valida. Rieffettua il login.', {
        duration: 5000,
        id: 'no-user'
      })
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    setError(null) 

    const timestamp = Date.now()
    const filePath = `${user.id}/${serviceId}/${timestamp}_${file.name}`
    let recordId: number | null = null; // Ci serve l'ID per l'invocazione

    try {
      // --- 1. Upload Bolletta (C3) ---
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documenti_utente')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError
      logger.info('File bolletta uploaded', {
        path: uploadData.path,
        serviceId,
        userId: user.id
      })

      // --- 2. CREAZIONE RECORD DB (C14) ---
      // Creiamo il record 'placeholder' con stato 'PROCESSING'
      // Usiamo 'upsert' per sicurezza, nel caso l'utente ricarichi lo stesso file
      const { data: recordData, error: insertError } = await supabase
        .from('disdette')
        .insert({
          user_id: user.id,
          file_path: filePath,
        })
        .select('id')
        .single()

      if (insertError) throw new Error(`Errore creazione record: ${insertError.message}`)
      if (!recordData) throw new Error("Impossibile recuperare l'ID del record creato.")

      recordId = recordData.id
      logger.info('Database record created', {
        recordId,
        filePath,
        userId: user.id,
        status: 'PROCESSING'
      })

      // --- 3. Invocazione Edge Function (C4 - Modificato) ---
      // Ora passiamo l'ID, non il payload
      const payload = {
        id: recordId
      }
      logger.debug('Invoking process-document Edge Function', {
        recordId,
        userId: user.id
      })

      const { error: invokeError } = await supabase.functions.invoke(
        'process-document',
        { body: payload }
      )
      if (invokeError) throw invokeError

      // --- 4. Redirect a Check Dati (C5) ---
      // L'utente viene reindirizzato. La pagina /review
      // mostrerà "Caricamento..." finché lo stato non cambia
      // da 'PROCESSING' a 'PENDING_REVIEW' o 'FAILED'.
      logger.info('Edge Function invoked successfully, redirecting to review', {
        recordId,
        userId: user.id
      })
      router.push(`/review?id=${recordId}`)

    } catch (error: unknown) {
      let errorMessage = 'Errore sconosciuto.'
      if (error instanceof Error) errorMessage = error.message
      setError(errorMessage)
      setIsSubmitting(false)
      
    }
  }
  
  // --- RENDER ---
  if (isAuthLoading || !user) {
    return <div className="p-8 text-center">Caricamento...</div>
  }

  return (
    <>
      {/* Onboarding Stepper */}
      <OnboardingSteps
        steps={onboardingFlowSteps}
        currentStep={3}  // Upload step
      />

      <div className="bg-white">
        <div className="mx-auto max-w-2xl p-8">
          <h1 className="mb-6 text-3xl font-bold">Carica il tuo documento</h1>
        <p className="mb-4 text-gray-600">
          {loadingServiceInfo ? (
            <>Stai per avviare la disdetta. Carica il documento richiesto (es. bolletta, contratto, modulo).</>
          ) : serviceInfo ? (
            <>
              Stai per avviare la disdetta per{' '}
              <span className="font-semibold text-primary-600">
                    {serviceInfo.operatorName} - {serviceInfo.serviceName}
              </span>
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
              type="file" id="documento_bolletta"
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