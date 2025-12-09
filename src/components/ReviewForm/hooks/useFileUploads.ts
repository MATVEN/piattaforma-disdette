// hooks/useFileUploads.ts
//
// Manages file state for B2B document uploads:
// - Documento Identità Legale Rappresentante
// - Visura Camerale
// - Delega Firma (conditional on richiedente_ruolo)

import { useState } from 'react'

interface UploadState {
  uploading: boolean
  progress: number
}

interface UseFileUploadsReturn {
  files: {
    documentoLR: File | null
    visuraCamerale: File | null
    delegaFirma: File | null
  }
  handleFileChange: {
    handleDocumentoLRChange: (file: File | null) => void
    handleVisuraCameraleChange: (file: File | null) => void
    handleDelegaFirmaChange: (file: File | null) => void
  }
  uploadStates: {
    documentoLR: UploadState
    visuraCamerale: UploadState
    delegaFirma: UploadState
  }
  setUploadProgress: {
    setDocumentoLRProgress: (progress: number) => void
    setVisuraCameraleProgress: (progress: number) => void
    setDelegaFirmaProgress: (progress: number) => void
  }
  startUpload: {
    startDocumentoLRUpload: () => void
    startVisuraCameraleUpload: () => void
    startDelegaFirmaUpload: () => void
  }
  completeUpload: {
    completeDocumentoLRUpload: () => void
    completeVisuraCameraleUpload: () => void
    completeDelegaFirmaUpload: () => void
  }
  resetUploadStates: () => void
}

export function useFileUploads(): UseFileUploadsReturn {
  // File states (existing)
  const [documentoLR, setDocumentoLR] = useState<File | null>(null)
  const [visuraCamerale, setVisuraCamerale] = useState<File | null>(null)
  const [delegaFirma, setDelegaFirma] = useState<File | null>(null)

  // ✅ NEW: Upload progress states
  const [uploadStates, setUploadStates] = useState<{
    documentoLR: UploadState
    visuraCamerale: UploadState
    delegaFirma: UploadState
  }>({
    documentoLR: { uploading: false, progress: 0 },
    visuraCamerale: { uploading: false, progress: 0 },
    delegaFirma: { uploading: false, progress: 0 },
  })

  // File change handlers (existing)
  const handleDocumentoLRChange = (file: File | null) => {
    setDocumentoLR(file)
    if (file) {
      // Reset upload state when new file selected
      setUploadStates(prev => ({
        ...prev,
        documentoLR: { uploading: false, progress: 0 }
      }))
    }
  }

  const handleVisuraCameraleChange = (file: File | null) => {
    setVisuraCamerale(file)
    if (file) {
      setUploadStates(prev => ({
        ...prev,
        visuraCamerale: { uploading: false, progress: 0 }
      }))
    }
  }

  const handleDelegaFirmaChange = (file: File | null) => {
    setDelegaFirma(file)
    if (file) {
      setUploadStates(prev => ({
        ...prev,
        delegaFirma: { uploading: false, progress: 0 }
      }))
    }
  }

  // ✅ NEW: Progress setters
  const setDocumentoLRProgress = (progress: number) => {
    setUploadStates(prev => ({
      ...prev,
      documentoLR: { ...prev.documentoLR, progress }
    }))
  }

  const setVisuraCameraleProgress = (progress: number) => {
    setUploadStates(prev => ({
      ...prev,
      visuraCamerale: { ...prev.visuraCamerale, progress }
    }))
  }

  const setDelegaFirmaProgress = (progress: number) => {
    setUploadStates(prev => ({
      ...prev,
      delegaFirma: { ...prev.delegaFirma, progress }
    }))
  }

  // ✅ NEW: Start upload
  const startDocumentoLRUpload = () => {
    setUploadStates(prev => ({
      ...prev,
      documentoLR: { uploading: true, progress: 0 }
    }))
  }

  const startVisuraCameraleUpload = () => {
    setUploadStates(prev => ({
      ...prev,
      visuraCamerale: { uploading: true, progress: 0 }
    }))
  }

  const startDelegaFirmaUpload = () => {
    setUploadStates(prev => ({
      ...prev,
      delegaFirma: { uploading: true, progress: 0 }
    }))
  }

  // ✅ NEW: Complete upload
  const completeDocumentoLRUpload = () => {
    setUploadStates(prev => ({
      ...prev,
      documentoLR: { uploading: false, progress: 100 }
    }))
  }

  const completeVisuraCameraleUpload = () => {
    setUploadStates(prev => ({
      ...prev,
      visuraCamerale: { uploading: false, progress: 100 }
    }))
  }

  const completeDelegaFirmaUpload = () => {
    setUploadStates(prev => ({
      ...prev,
      delegaFirma: { uploading: false, progress: 100 }
    }))
  }

  // ✅ NEW: Reset all upload states
  const resetUploadStates = () => {
    setUploadStates({
      documentoLR: { uploading: false, progress: 0 },
      visuraCamerale: { uploading: false, progress: 0 },
      delegaFirma: { uploading: false, progress: 0 },
    })
  }

  return {
    files: {
      documentoLR,
      visuraCamerale,
      delegaFirma,
    },
    handleFileChange: {
      handleDocumentoLRChange,
      handleVisuraCameraleChange,
      handleDelegaFirmaChange,
    },
    uploadStates,
    setUploadProgress: {
      setDocumentoLRProgress,
      setVisuraCameraleProgress,
      setDelegaFirmaProgress,
    },
    startUpload: {
      startDocumentoLRUpload,
      startVisuraCameraleUpload,
      startDelegaFirmaUpload,
    },
    completeUpload: {
      completeDocumentoLRUpload,
      completeVisuraCameraleUpload,
      completeDelegaFirmaUpload,
    },
    resetUploadStates,
  }
}