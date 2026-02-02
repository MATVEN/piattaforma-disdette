// hooks/useReviewForm.ts
// Manages form setup, data fetching, and status polling for ReviewForm
// Handles OCR status states: LOADING → PROCESSING → PENDING_REVIEW → SUCCESS

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reviewFormSchema, type ReviewFormData } from '@/domain/schemas'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabaseClient'
import { logger } from '@/lib/logger'
import { DISDETTA_STATUS, type DisdettaStatus } from '@/types/enums'

interface ExtractedData {
  id: number
  file_path: string
  status: DisdettaStatus
  supplier_name: string | null
  supplier_tax_id: string | null
  receiver_tax_id: string | null
  supplier_contract_number: string | null
  supplier_iban: string | null
  error_message: string | null
}

interface UserProfile {
  nome: string | null
  cognome: string | null
  codice_fiscale: string | null
  indirizzo_residenza: string | null
  documento_identita_path: string | null
}

const safeJson = async <T,>(res: Response): Promise<T | undefined> => {
  try {
    return (await res.json()) as T
  } catch {
    return undefined
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface UseReviewFormReturn {
  form: UseFormReturn<ReviewFormData>
  tipoIntestatario: 'privato' | 'azienda'
  setTipoIntestatario: (value: 'privato' | 'azienda') => void
  loading: boolean
  currentStatus: 'LOADING' | 'PROCESSING' | 'FAILED' | 'SUCCESS'
  errorMessage: string | null
  data: ExtractedData | null
  profile: UserProfile | null
}

export function useReviewForm(): UseReviewFormReturn {

  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  const searchParams = useSearchParams()
  const id = parseInt(searchParams.get('id') || '0')

  const [data, setData] = useState<ExtractedData | null>(null)
  const [currentStatus, setCurrentStatus] = useState<'LOADING' | 'PROCESSING' | 'FAILED' | 'SUCCESS'>('LOADING')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tipoIntestatario, setTipoIntestatario] = useState<'privato' | 'azienda'>('privato')
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      tipo_intestatario: 'privato' as const,
      supplier_tax_id: '',
      supplier_contract_number: '',
      supplier_iban: '',
      delegaCheckbox: false,
      // B2C defaults (privato)
      nome: '',
      cognome: '',
      codice_fiscale: '',
      indirizzo_residenza: '',
    } as any,
  })

  const { reset } = form
  const hasFetchedRef = useRef(false)

  // ✅ Autosave form before navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const currentData = form.getValues()
        sessionStorage.setItem('review-form-backup', JSON.stringify({
          formData: currentData,
          timestamp: Date.now()
        }))
      } catch (err) {
        console.warn('Failed to autosave:', err)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Fetch user profile for auto-fill
  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          return
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('nome, cognome, codice_fiscale, indirizzo_residenza, documento_identita_path')
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          return
        }
        
        setProfile(data)
      } catch (error) {
        console.error(error)
      }
    }
    
    fetchProfile()
  }, [])

  // Auto-fill empty personal fields when profile loads
  useEffect(() => {
    if (!profile || !data) return
    
    const currentValues = form.getValues()
    
    // Only update if fields are empty
    if (currentValues.tipo_intestatario === 'privato') {
      if (!currentValues.nome && profile.nome) {
        form.setValue('nome', profile.nome)
      }
      if (!currentValues.cognome && profile.cognome) {
        form.setValue('cognome', profile.cognome)
      }
      if (!currentValues.codice_fiscale && profile.codice_fiscale) {
        form.setValue('codice_fiscale', profile.codice_fiscale)
      }
      if (!currentValues.indirizzo_residenza && profile.indirizzo_residenza) {
        form.setValue('indirizzo_residenza', profile.indirizzo_residenza)
      }
    }
  }, [profile, data, form])

 // Data fetching + polling
  useEffect(() => {

    // Skip refetch if already loaded
    if (hasFetchedRef.current && currentStatus === 'SUCCESS') {
      return
    }

    const fetchAndPollData = async () => {

      // ===== CHECK 1: No ID in URL =====
      if (!id || id === 0) {
        toast.error('📋 Nessun documento da revisionare. Carica prima una bolletta.', {
          duration: 5000,
          id: 'no-id'
        })
        router.push('/new-disdetta')
        return
      }

      // ===== CHECK 2: ID non valido =====
      if (isNaN(id) || id < 0) {
        toast.error('⚠️ Link non valido. Riprova dalla dashboard.', {
          duration: 5000,
          id: 'invalid-id'
        })
        router.push('/dashboard')
        return
      }

      setCurrentStatus('LOADING')

      try {
        // Fetch disdetta data
        const { data: disdettaData, error: fetchError } = await supabase
          .from('disdette')
          .select('*')
          .eq('id', id) // ← Usa direttamente id (già number)
          .single()

        // ===== CHECK 3: Record non trovato =====
        if (fetchError || !disdettaData) {
          logger.error('Disdetta not found', {
            id,
            error: fetchError?.message || 'Record not found',
            userId: user?.id
          })
          toast.error('📋 Documento non trovato. Controlla nella Dashboard.', {
            duration: 6000,
            id: 'not-found'
          })
          router.push('/dashboard')
          return
        }

        // ===== CHECK 4: User non autorizzato =====
        // ✅ Wait for user to load (with max retries)
        if (!user) {
          setCurrentStatus('LOADING')
          setLoading(true)
          return
        }

        // Reset retry counter
        if (disdettaData.user_id !== user?.id) {
          logger.warn('Unauthorized access attempt', {
            id,
            requestingUserId: user?.id,
            ownerUserId: disdettaData.user_id
          })
          toast.error('🔒 Non sei autorizzato a visualizzare questo documento.', {
            duration: 6000,
            id: 'unauthorized'
          })
          router.push('/dashboard')
          return
        }

        // Store data
        setData(disdettaData)

        // ===== HANDLE STATUS =====
        const status = disdettaData.status

        if (status === DISDETTA_STATUS.FAILED) {
          setCurrentStatus(DISDETTA_STATUS.FAILED)
          setErrorMessage(disdettaData.error_message || 'Errore elaborazione documento')
          setLoading(false)
          return
        }

        if (status === DISDETTA_STATUS.PROCESSING) {
          setCurrentStatus(DISDETTA_STATUS.PROCESSING)
          // Poll again after 2 seconds
          await sleep(2000)
          fetchAndPollData() // Recursive call for polling
          return
        }

        if (status === DISDETTA_STATUS.PENDING_REVIEW || status === DISDETTA_STATUS.CONFIRMED || status === DISDETTA_STATUS.SENT) {
          // ===== CHECK 5: Dati incompleti =====
          if (!disdettaData.supplier_tax_id) {
            toast('⚠️ P.IVA fornitore non trovata. Compilala manualmente nel form.', {
              duration: 8000,
              id: 'missing-tax-id'
            })
          }

          // ===== ALL CHECKS PASSED - Populate form =====
          setCurrentStatus('SUCCESS')
          
          // Determine tipo intestatario from database
          const tipoFromDb = disdettaData.tipo_intestatario || 'privato'
          setTipoIntestatario(tipoFromDb as 'privato' | 'azienda')

          // Populate form with extracted data
          const formData: any = {
            tipo_intestatario: tipoFromDb,
            supplier_tax_id: disdettaData.supplier_tax_id || '',
            supplier_contract_number: disdettaData.supplier_contract_number || '',
            supplier_iban: disdettaData.supplier_iban || '',
            delegaCheckbox: false,
          }

          // Add B2C or B2B specific fields
          if (tipoFromDb === 'privato') {
            // Auto-fill with profile data if extracted data is empty
            formData.nome = disdettaData.nome || profile?.nome || ''
            formData.cognome = disdettaData.cognome || profile?.cognome || ''
            formData.codice_fiscale = disdettaData.codice_fiscale || profile?.codice_fiscale || ''
            formData.indirizzo_residenza = disdettaData.indirizzo_residenza || profile?.indirizzo_residenza || ''
            formData.luogo_nascita = disdettaData.luogo_nascita || ''
            formData.data_nascita = disdettaData.data_nascita || ''
          } else {
            formData.ragione_sociale = disdettaData.ragione_sociale || ''
            formData.partita_iva = disdettaData.partita_iva || ''
            formData.sede_legale = disdettaData.sede_legale || ''
            formData.lr_nome = disdettaData.lr_nome || ''
            formData.lr_cognome = disdettaData.lr_cognome || ''
            formData.lr_codice_fiscale = disdettaData.lr_codice_fiscale || ''
            formData.richiedente_ruolo = disdettaData.richiedente_ruolo || 'legale_rappresentante'
          }

          // Check if there's a backup in sessionStorage
          let finalFormData = formData
          try {
            const backupStr = sessionStorage.getItem('review-form-backup')

            if (backupStr) {
              const backup = JSON.parse(backupStr)
              const ageMinutes = (Date.now() - backup.timestamp) / 1000 / 60
              // Use backup if less than 30 minutes old
              if (ageMinutes < 30) {
                // Merge: DB data takes priority, backup fills gaps
                finalFormData = {
                  ...backup.formData,
                  ...formData // DB overrides backup
                }
              }
              // Clear backup after use
              // sessionStorage.removeItem('review-form-backup')
            }
          } catch (err) {
            console.warn('Failed to restore backup:', err)
          }

          reset(finalFormData)
          setLoading(false)
          return
        }

        // Unknown status - treat as success
        setCurrentStatus('SUCCESS')
        setLoading(false)
        hasFetchedRef.current = true
        return

      } catch (error) {
        toast.error('⚠️ Errore di connessione. Riprova o contatta il supporto.', {
          duration: 6000,
          id: 'fetch-error'
        })
        setCurrentStatus('FAILED')
        setErrorMessage('Errore di connessione')
        router.push('/dashboard')
      }
    }

    fetchAndPollData()
  }, [id, user])

  return {
    form,
    tipoIntestatario,
    setTipoIntestatario,
    loading: currentStatus === 'LOADING' || currentStatus === 'PROCESSING',
    currentStatus,
    errorMessage,
    data,
    profile
  }
}