-- Migration: Add B2B Support to disdette table
-- Date: 2025-11-28
-- Feature: C23 - B2B Support
-- Description: Adds fields to support both B2C (privato) and B2B (azienda) customers

-- Add tipo_intestatario column (customer type: privato or azienda)
ALTER TABLE disdette
ADD COLUMN tipo_intestatario VARCHAR(20) NOT NULL DEFAULT 'privato'
CHECK (tipo_intestatario IN ('privato', 'azienda'));

-- Add B2B company fields (azienda)
ALTER TABLE disdette
ADD COLUMN partita_iva VARCHAR(11),
ADD COLUMN ragione_sociale TEXT,
ADD COLUMN sede_legale TEXT;

-- Add Legal Representative fields (Legale Rappresentante)
ALTER TABLE disdette
ADD COLUMN lr_nome VARCHAR(100),
ADD COLUMN lr_cognome VARCHAR(100),
ADD COLUMN lr_codice_fiscale VARCHAR(16);

-- Add address fields (separate for B2B)
ALTER TABLE disdette
ADD COLUMN indirizzo_fornitura TEXT,
ADD COLUMN indirizzo_fatturazione TEXT;

-- Add document storage paths for B2B
ALTER TABLE disdette
ADD COLUMN visura_camerale_path TEXT,  -- Chamber of Commerce certificate
ADD COLUMN delega_firma_path TEXT;      -- Signature delegation document

-- Add requester role field (who is making the request)
ALTER TABLE disdette
ADD COLUMN richiedente_ruolo VARCHAR(30)
CHECK (richiedente_ruolo IS NULL OR richiedente_ruolo IN ('legale_rappresentante', 'delegato'));

-- Add comments
COMMENT ON COLUMN disdette.tipo_intestatario IS 'Type of customer: privato (B2C individual) or azienda (B2B company)';
COMMENT ON COLUMN disdette.partita_iva IS 'Company VAT number (Partita IVA) - 11 digits';
COMMENT ON COLUMN disdette.ragione_sociale IS 'Company legal name (Ragione Sociale)';
COMMENT ON COLUMN disdette.sede_legale IS 'Company registered office address (Sede Legale)';
COMMENT ON COLUMN disdette.lr_nome IS 'Legal representative first name';
COMMENT ON COLUMN disdette.lr_cognome IS 'Legal representative last name';
COMMENT ON COLUMN disdette.lr_codice_fiscale IS 'Legal representative tax code (Codice Fiscale) - 16 characters';
COMMENT ON COLUMN disdette.indirizzo_fornitura IS 'Service delivery address (for utilities)';
COMMENT ON COLUMN disdette.indirizzo_fatturazione IS 'Billing address';
COMMENT ON COLUMN disdette.visura_camerale_path IS 'Storage path for Chamber of Commerce certificate (Visura Camerale)';
COMMENT ON COLUMN disdette.delega_firma_path IS 'Storage path for signature delegation document (Delega Firma)';
COMMENT ON COLUMN disdette.richiedente_ruolo IS 'Role of the person making the request: legale_rappresentante or delegato';

-- Add B2C base columns (missing from Day 1)
ALTER TABLE disdette 
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS cognome TEXT,
ADD COLUMN IF NOT EXISTS codice_fiscale TEXT,
ADD COLUMN IF NOT EXISTS indirizzo_residenza TEXT,

-- Add comments
COMMENT ON COLUMN disdette.nome IS 'Nome intestatario (B2C)';
COMMENT ON COLUMN disdette.cognome IS 'Cognome intestatario (B2C)';
COMMENT ON COLUMN disdette.codice_fiscale IS 'Codice Fiscale intestatario (B2C) o LR (B2B)';
COMMENT ON COLUMN disdette.indirizzo_residenza IS 'Indirizzo residenza (B2C)';

-- Create index on tipo_intestatario for performance
CREATE INDEX idx_disdette_tipo_intestatario ON disdette(tipo_intestatario);

-- Create index on partita_iva for B2B lookups
CREATE INDEX idx_disdette_partita_iva ON disdette(partita_iva);
