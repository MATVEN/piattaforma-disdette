'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileFormSchema, type ProfileFormData } from '@/domain/schemas'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Upload, Save, Loader2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

type Profile = {
  nome: string | null
  cognome: string | null
  indirizzo_residenza: string | null
  telefono: string | null
  documento_identita_path: string | null
}

// Constants for file validation
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

export default function ProfilePage() {
  const { user, isAuthLoading } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
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

  // Protection
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  // Load Profile Data
  useEffect(() => {
    if (user) {
      async function fetchProfile() {
        setLoading(true)
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
          if (error instanceof Error) {
            toast.error(error.message)
          } else {
            toast.error('Errore nel caricamento del profilo')
          }
        } finally {
          setLoading(false)
        }
      }
      fetchProfile()
    }
  }, [user, reset])

  // File Handler with Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Size validation
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Il file deve essere inferiore a 5MB')
        return
      }
      
      // Type validation
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error('Formato non supportato. Usa PDF, PNG o JPG')
        return
      }
      
      setIdDocumentFile(file)
      toast.success(`File selezionato: ${file.name}`)
    }
  }

  // Submit Handler
  const onSubmit: SubmitHandler<ProfileFormData> = async (formData) => {
    if (!user) {
      toast.error('Utente non trovato')
      return
    }

    // Validate ID document
    if (!idDocumentFile && !currentDocPath) {
      toast.error("Il documento d'identità è obbligatorio")
      return
    }

    try {
      let filePath: string | null = currentDocPath

      // Upload Document
      if (idDocumentFile) {
        const newFilePath = `${user.id}/${idDocumentFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('documenti-identita')
          .upload(newFilePath, idDocumentFile, { upsert: true })
        if (uploadError) throw uploadError
        filePath = newFilePath
      }

      // Update Profile
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

      setCurrentDocPath(upsertedData.documento_identita_path)
      setIdDocumentFile(null)

      toast.success('Profilo aggiornato con successo!')

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Errore durante il salvataggio')
      }
    }
  }

  // Get initials for avatar
  const getInitials = () => {
    if (!user?.email) return '?'
    return user.email.charAt(0).toUpperCase()
  }

  // Loading State
  if (isAuthLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with Avatar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl font-bold text-white">{getInitials()}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Il mio Profilo
          </h1>
          <p className="text-gray-600">
            Completa i tuoi dati per procedere con le disdette
          </p>
          {user.email && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
          )}
        </motion.div>

        {/* Profile Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20 p-6 sm:p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="nome"
                  {...register("nome")}
                  placeholder="Mario"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
              </div>
              {errors.nome && (
                <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
              )}
            </div>

            {/* Cognome */}
            <div>
              <label htmlFor="cognome" className="block text-sm font-medium text-gray-700 mb-2">
                Cognome *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="cognome"
                  {...register("cognome")}
                  placeholder="Rossi"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
              </div>
              {errors.cognome && (
                <p className="mt-1 text-sm text-red-600">{errors.cognome.message}</p>
              )}
            </div>

            {/* Indirizzo Residenza */}
            <div>
              <label htmlFor="indirizzo_residenza" className="block text-sm font-medium text-gray-700 mb-2">
                Indirizzo di Residenza *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="indirizzo_residenza"
                  {...register("indirizzo_residenza")}
                  placeholder="Via Roma 123, 00100 Roma"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
              </div>
              {errors.indirizzo_residenza && (
                <p className="mt-1 text-sm text-red-600">{errors.indirizzo_residenza.message}</p>
              )}
            </div>

            {/* Telefono */}
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                Telefono *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  id="telefono"
                  {...register("telefono")}
                  placeholder="+39 123 456 7890"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
              </div>
              {errors.telefono && (
                <p className="mt-1 text-sm text-red-600">{errors.telefono.message}</p>
              )}
            </div>

            {/* Documento Identità */}
            <div>
              <label htmlFor="documento" className="block text-sm font-medium text-gray-700 mb-2">
                Documento di Identità * (PDF, PNG, JPG - Max 5MB)
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="documento"
                  name="documento"
                  onChange={handleFileChange}
                  accept="application/pdf, image/png, image/jpeg"
                  className="hidden"
                />
                <label
                  htmlFor="documento"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer"
                >
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {idDocumentFile ? idDocumentFile.name : 'Carica documento'}
                  </span>
                </label>
              </div>
              {currentDocPath && !idDocumentFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="h-4 w-4" />
                  <span>File attuale: {currentDocPath.split('/').pop()}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-primary px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Salva Profilo</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-blue-50/80 backdrop-blur-xl rounded-xl border border-blue-100 p-4 text-sm text-blue-800"
        >
          <p className="font-medium mb-1">📝 Perché questi dati?</p>
          <p className="text-blue-700">
            I tuoi dati anagrafici sono necessari per generare la lettera di disdetta legalmente valida.
            Il documento d'identità sarà allegato alla PEC.
          </p>
        </motion.div>
      </div>
    </div>
  )
}