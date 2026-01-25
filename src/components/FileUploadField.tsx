'use client'

import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { validateFile } from '@/domain/schemas'

interface FileUploadFieldProps {
  label: string | React.ReactNode
  accept: string
  onChange: (file: File | null) => void
  currentFile: File | null
  helpText?: string
  required?: boolean
  error?: string
  uploading?: boolean
  uploadProgress?: number
  onUploadComplete?: () => void
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  accept,
  onChange,
  currentFile,
  helpText,
  required = false,
  error,
  uploading = false,
  uploadProgress = 0,
  onUploadComplete,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (!file) {
      onChange(null)
      setUploadSuccess(false)
      return
    }

    // Parse accept string to array of MIME types
    const allowedTypes = accept.split(',').map(t => t.trim())

    // Validate file
    const validation = validateFile(file, allowedTypes)
    
    if (!validation.valid) {
      toast.error(validation.error!, { duration: 5000 })
      
      // Clear the input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      onChange(null)
      setUploadSuccess(false)
      return
    }

    // File valid - trigger onChange
    onChange(file)
    setUploadSuccess(false) // Reset success state on new file
    
    toast.success(`📄 File selezionato: ${file.name}`, { 
      duration: 2500,
      id: `file-selected-${label}`
    })
  }

  // Reset success state when currentFile is cleared
  if (!currentFile && uploadSuccess) {
    setUploadSuccess(false)
  }

  // Mark as success when upload completes
  if (!uploading && currentFile && uploadProgress === 100 && !uploadSuccess) {
    setUploadSuccess(true)
    onUploadComplete?.()
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all ${
            uploading
              ? 'border-primary-300 bg-primary-50/50 cursor-wait'
              : error
              ? 'border-red-300 bg-red-50/50 hover:border-red-400 cursor-pointer'
              : uploadSuccess
              ? 'border-green-300 bg-green-50/50 hover:border-green-400 cursor-pointer'
              : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/50 cursor-pointer'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
              <span className="text-sm text-gray-700">Caricamento...</span>
            </>
          ) : uploadSuccess && currentFile ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-700 truncate">{currentFile.name}</span>
            </>
          ) : currentFile ? (
            <>
              <FileText className="h-5 w-5 text-primary-600" />
              <span className="text-sm text-gray-700 truncate">{currentFile.name}</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Carica documento</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {uploading && currentFile && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span className="truncate">{currentFile.name}</span>
            <span className="font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success State */}
      {uploadSuccess && currentFile && !uploading && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>{currentFile.name} caricato</span>
        </div>
      )}

      {/* Help Text */}
      {helpText && !uploading && !uploadSuccess && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <XCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}