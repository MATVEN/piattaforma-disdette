// hooks/useFileUploads.ts
//
// Manages file state for document uploads:
// - Documento Identità (B2C) 
// - Documento Identità Legale Rappresentante (B2B)
// - Visura Camerale (B2B)
// - Delega Firma (B2B conditional on richiedente_ruolo)

import { useState } from 'react'

interface UploadState {
  uploading: boolean
  progress: number
}

interface UseFileUploadsReturn {
  files: {
    documentoIdentita: File | null      
    documentoLR: File | null
    visuraCamerale: File | null
    delegaFirma: File | null
  }
  handleFileChange: {
    handleDocumentoIdentitaChange: (file: File | null) => void
    handleDocumentoLRChange: (file: File | null) => void
    handleVisuraCameraleChange: (file: File | null) => void
    handleDelegaFirmaChange: (file: File | null) => void
  }
  uploadStates: {
    documentoIdentita: UploadState      
    documentoLR: UploadState
    visuraCamerale: UploadState
    delegaFirma: UploadState
  }
  setUploadProgress: {
    setDocumentoIdentitaProgress: (progress: number) => void
    setDocumentoLRProgress: (progress: number) => void
    setVisuraCameraleProgress: (progress: number) => void
    setDelegaFirmaProgress: (progress: number) => void
  }
  startUpload: {
    startDocumentoIdentitaUpload: () => void
    startDocumentoLRUpload: () => void
    startVisuraCameraleUpload: () => void
    startDelegaFirmaUpload: () => void
  }
  completeUpload: {
    completeDocumentoIdentitaUpload: () => void
    completeDocumentoLRUpload: () => void
    completeVisuraCameraleUpload: () => void
    completeDelegaFirmaUpload: () => void
  }
  resetUploadStates: () => void
}

export function useFileUploads(): UseFileUploadsReturn {
  // File states
  const [documentoIdentita, setDocumentoIdentita] = useState<File | null>(null)
  const [documentoLR, setDocumentoLR] = useState<File | null>(null)
  const [visuraCamerale, setVisuraCamerale] = useState<File | null>(null)
  const [delegaFirma, setDelegaFirma] = useState<File | null>(null)

  // Upload progress states
  const [uploadStates, setUploadStates] = useState<{
    documentoIdentita: UploadState      
    documentoLR: UploadState
    visuraCamerale: UploadState
    delegaFirma: UploadState
  }>({
    documentoIdentita: { uploading: false, progress: 0 },
    documentoLR: { uploading: false, progress: 0 },
    visuraCamerale: { uploading: false, progress: 0 },
    delegaFirma: { uploading: false, progress: 0 },
  })

  // Handler Documento Identità (B2C)
  const handleDocumentoIdentitaChange = (file: File | null) => {
    setDocumentoIdentita(file)
    if (file) {
      setUploadStates(prev => ({
        ...prev,
        documentoIdentita: { uploading: false, progress: 0 }
      }))
    }
  }

  // File change handlers (existing)
  const handleDocumentoLRChange = (file: File | null) => {
    setDocumentoLR(file)
    if (file) {
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

  // Progress setter
  const setDocumentoIdentitaProgress = (progress: number) => {
    setUploadStates(prev => ({
      ...prev,
      documentoIdentita: { ...prev.documentoIdentita, progress }
    }))
  }

  // Progress setters (existing)
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

  // Start upload
  const startDocumentoIdentitaUpload = () => {
    setUploadStates(prev => ({
      ...prev,
      documentoIdentita: { uploading: true, progress: 0 }
    }))
  }

  // Start upload (existing)
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

  // Complete upload
  const completeDocumentoIdentitaUpload = () => {
    setUploadStates(prev => ({
      ...prev,
      documentoIdentita: { uploading: false, progress: 100 }
    }))
  }

  // Complete upload (existing)
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

  // Reset all upload states
  const resetUploadStates = () => {
    setUploadStates({
      documentoIdentita: { uploading: false, progress: 0 },
      documentoLR: { uploading: false, progress: 0 },
      visuraCamerale: { uploading: false, progress: 0 },
      delegaFirma: { uploading: false, progress: 0 },
    })
  }

  return {
    files: {
      documentoIdentita,    
      documentoLR,
      visuraCamerale,
      delegaFirma,
    },
    handleFileChange: {
      handleDocumentoIdentitaChange,
      handleDocumentoLRChange,
      handleVisuraCameraleChange,
      handleDelegaFirmaChange,
    },
    uploadStates,
    setUploadProgress: {
      setDocumentoIdentitaProgress,
      setDocumentoLRProgress,
      setVisuraCameraleProgress,
      setDelegaFirmaProgress,
    },
    startUpload: {
      startDocumentoIdentitaUpload,
      startDocumentoLRUpload,
      startVisuraCameraleUpload,
      startDelegaFirmaUpload,
    },
    completeUpload: {
      completeDocumentoIdentitaUpload,
      completeDocumentoLRUpload,
      completeVisuraCameraleUpload,
      completeDelegaFirmaUpload,
    },
    resetUploadStates,
  }
}