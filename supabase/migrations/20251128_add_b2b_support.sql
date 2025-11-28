-- Migration: Add B2B Support to extracted_data table
-- Date: 2025-11-28
-- Feature: C23 - B2B Support
-- Description: Adds fields to support both B2C (privato) and B2B (azienda) customers

-- Add tipo_intestatario column (customer type: privato or azienda)
ALTER TABLE extracted_data
ADD COLUMN tipo_intestatario VARCHAR(20) NOT NULL DEFAULT 'privato'
CHECK (tipo_intestatario IN ('privato', 'azienda'));

-- Add B2B company fields (azienda)
ALTER TABLE extracted_data
ADD COLUMN partita_iva VARCHAR(11),
ADD COLUMN ragione_sociale TEXT,
ADD COLUMN sede_legale TEXT;

-- Add Legal Representative fields (Legale Rappresentante)
ALTER TABLE extracted_data
ADD COLUMN lr_nome VARCHAR(100),
ADD COLUMN lr_cognome VARCHAR(100),
ADD COLUMN lr_codice_fiscale VARCHAR(16);

-- Add address fields (separate for B2B)
ALTER TABLE extracted_data
ADD COLUMN indirizzo_fornitura TEXT,
ADD COLUMN indirizzo_fatturazione TEXT;

-- Add document storage paths for B2B
ALTER TABLE extracted_data
ADD COLUMN visura_camerale_path TEXT,  -- Chamber of Commerce certificate
ADD COLUMN delega_firma_path TEXT;      -- Signature delegation document

-- Add requester role field (who is making the request)
ALTER TABLE extracted_data
ADD COLUMN richiedente_ruolo VARCHAR(30)
CHECK (richiedente_ruolo IS NULL OR richiedente_ruolo IN ('legale_rappresentante', 'delegato'));

-- Add comments
COMMENT ON COLUMN extracted_data.tipo_intestatario IS 'Type of customer: privato (B2C individual) or azienda (B2B company)';
COMMENT ON COLUMN extracted_data.partita_iva IS 'Company VAT number (Partita IVA) - 11 digits';
COMMENT ON COLUMN extracted_data.ragione_sociale IS 'Company legal name (Ragione Sociale)';
COMMENT ON COLUMN extracted_data.sede_legale IS 'Company registered office address (Sede Legale)';
COMMENT ON COLUMN extracted_data.lr_nome IS 'Legal representative first name';
COMMENT ON COLUMN extracted_data.lr_cognome IS 'Legal representative last name';
COMMENT ON COLUMN extracted_data.lr_codice_fiscale IS 'Legal representative tax code (Codice Fiscale) - 16 characters';
COMMENT ON COLUMN extracted_data.indirizzo_fornitura IS 'Service delivery address (for utilities)';
COMMENT ON COLUMN extracted_data.indirizzo_fatturazione IS 'Billing address';
COMMENT ON COLUMN extracted_data.visura_camerale_path IS 'Storage path for Chamber of Commerce certificate (Visura Camerale)';
COMMENT ON COLUMN extracted_data.delega_firma_path IS 'Storage path for signature delegation document (Delega Firma)';
COMMENT ON COLUMN extracted_data.richiedente_ruolo IS 'Role of the person making the request: legale_rappresentante or delegato';

-- Create index on tipo_intestatario for performance
CREATE INDEX idx_extracted_data_tipo_intestatario ON extracted_data(tipo_intestatario);

-- Create index on partita_iva for B2B lookups
CREATE INDEX idx_extracted_data_partita_iva ON extracted_data(partita_iva);
