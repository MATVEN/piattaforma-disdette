// hooks/useFormSubmission.ts
//
// Handles form submission logic:
// 1. CRITICAL: receiver_tax_id mapping (B2C: codice_fiscale, B2B: lr_codice_fiscale)
// 2. File uploads for B2B (Visura, Documento LR, Delega)
// 3. API calls: confirm-data → send-pec
// 4. Success redirect to dashboard

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UseFormReturn } from 'react-hook-form'
import { type ReviewFormData } from '@/domain/schemas'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface UseFormSubmissionProps {
  files: {
    documentoLR: File | null
    visuraCamerale: File | null
    delegaFirma: File | null
  }
}

export interface UseFormSubmissionReturn {
  onSubmit: (data: ReviewFormData) => Promise<void>
  loading: boolean
}

export function useFormSubmission({ files }: UseFormSubmissionProps): UseFormSubmissionReturn {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: ReviewFormData) => {
    try {
      setLoading(true)

      // Validate user exists
      if (!user) {
        toast.error('Utente non autenticato')
        setLoading(false)
        return
      }

      // ===== CRITICAL FIX: Map receiver_tax_id from codice_fiscale =====
      let receiver_tax_id: string | null = null

      if (data.tipo_intestatario === 'privato') {
        // B2C: receiver_tax_id = codice_fiscale dell'intestatario
        receiver_tax_id = data.codice_fiscale || null
      } else if (data.tipo_intestatario === 'azienda') {
        // B2B: receiver_tax_id = codice_fiscale del Legale Rappresentante
        receiver_tax_id = data.lr_codice_fiscale || null
      }

      // Validate receiver_tax_id
      if (!receiver_tax_id) {
        toast.error('Codice Fiscale obbligatorio per procedere')
        setLoading(false)
        return
      }

      // Validate supplier_tax_id
      if (!data.supplier_tax_id) {
        toast.error('Partita IVA fornitore obbligatoria')
        setLoading(false)
        return
      }

      let visuraPath: string | null = null
      let delegaPath: string | null = null
      let documentoPath: string | null = null

      // Upload files if B2B
      if (data.tipo_intestatario === 'azienda') {
        // Validate required files
        if (!files.visuraCamerale) {
          toast.error('Visura Camerale obbligatoria per aziende')
          setLoading(false)
          return
        }

        if (!files.documentoLR) {
          toast.error('Documento Legale Rappresentante obbligatorio')
          setLoading(false)
          return
        }

        if (data.richiedente_ruolo === 'delegato' && !files.delegaFirma) {
          toast.error('Delega obbligatoria per delegati')
          setLoading(false)
          return
        }

        // Upload Visura Camerale
        const visuraFilePath = `${user.id}/${Date.now()}_visura.pdf`
        const { error: visuraError } = await supabase.storage
          .from('documenti-identita')
          .upload(visuraFilePath, files.visuraCamerale, { upsert: true })

        if (visuraError) {
          toast.error(`Errore upload Visura: ${visuraError.message}`)
          setLoading(false)
          return
        }
        visuraPath = visuraFilePath

        // Upload Documento LR
        const docFilePath = `${user.id}/${Date.now()}_documento_lr.pdf`
        const { error: docError } = await supabase.storage
          .from('documenti-identita')
          .upload(docFilePath, files.documentoLR, { upsert: true })

        if (docError) {
          toast.error(`Errore upload Documento: ${docError.message}`)
          setLoading(false)
          return
        }
        documentoPath = docFilePath

        // Upload Delega (if delegato)
        if (data.richiedente_ruolo === 'delegato' && files.delegaFirma) {
          const delegaFilePath = `${user.id}/${Date.now()}_delega.pdf`
          const { error: delegaError } = await supabase.storage
            .from('documenti-identita')
            .upload(delegaFilePath, files.delegaFirma, { upsert: true })

          if (delegaError) {
            toast.error(`Errore upload Delega: ${delegaError.message}`)
            setLoading(false)
            return
          }
          delegaPath = delegaFilePath
        }
      }

      // ===== Prepare data for API =====
      // Get id from URL (passed from parent)
      const searchParams = new URLSearchParams(window.location.search)
      const id = parseInt(searchParams.get('id') || '0')

      const updateData = {
        id,
        ...data,
        receiver_tax_id, // ← CRITICAL: Map from CF
        visura_camerale_path: visuraPath,
        delega_firma_path: delegaPath,
      }

      // ===== STEP 1: Conferma Dati =====
      const response = await fetch('/api/confirm-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore conferma dati')
      }

      toast.success('Dati confermati!')

      // ===== STEP 2: Invio PEC (Automatico) =====
      const pecResponse = await fetch('/api/send-pec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!pecResponse.ok) {
        const pecError = await pecResponse.json()
        throw new Error(pecError.error || 'Errore invio PEC')
      }

      toast.success('PEC inviata con successo! Reindirizzamento...')

      // ===== Redirect to Dashboard =====
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('❌ Errore submission:', error)
      toast.error(error instanceof Error ? error.message : 'Errore durante il salvataggio')
    } finally {
      setLoading(false)
    }
  }

  return {
    onSubmit,
    loading,
  }
}
