// hooks/useFileUploads.ts
//
// Manages file state for B2B document uploads:
// - Documento Identità Legale Rappresentante
// - Visura Camerale
// - Delega Firma (conditional on richiedente_ruolo)

import { useState } from 'react'

export interface UseFileUploadsReturn {
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
}

export function useFileUploads(): UseFileUploadsReturn {
  const [documentoLR, setDocumentoLR] = useState<File | null>(null)
  const [visuraCamerale, setVisuraCamerale] = useState<File | null>(null)
  const [delegaFirma, setDelegaFirma] = useState<File | null>(null)

  const handleDocumentoLRChange = (file: File | null) => {
    setDocumentoLR(file)
  }

  const handleVisuraCameraleChange = (file: File | null) => {
    setVisuraCamerale(file)
  }

  const handleDelegaFirmaChange = (file: File | null) => {
    setDelegaFirma(file)
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
  }
}
