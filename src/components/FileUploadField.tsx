'use client'

import { useRef } from 'react'
import { Upload, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { validateFile } from '@/domain/schemas'

interface FileUploadFieldProps {
  label: string
  accept: string
  onChange: (file: File | null) => void
  currentFile: File | null
  helpText?: string
  required?: boolean
  error?: string
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  accept,
  onChange,
  currentFile,
  helpText,
  required = false,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      onChange(null)
      return
    }

    // Parse accept string to array of MIME types
    const allowedTypes = accept.split(',').map(t => t.trim())

    // Validate file
    const validation = validateFile(file, allowedTypes)
    if (!validation.valid) {
      toast.error(validation.error!)
      // Clear the input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      onChange(null)
      return
    }

    onChange(file)
    toast.success(`File selezionato: ${file.name}`)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            error
              ? 'border-red-300 bg-red-50/50 hover:border-red-400'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
        >
          {currentFile ? (
            <>
              <FileText className="h-5 w-5 text-indigo-600" />
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
      {helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
