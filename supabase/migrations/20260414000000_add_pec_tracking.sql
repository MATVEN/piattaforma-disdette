-- Migration: Add PEC tracking columns to disdette
-- Purpose: Foundation for Message-ID based receipt tracking (manual phase)
-- Run this in Supabase SQL Editor BEFORE deploying the updated Edge Function

ALTER TABLE disdette
ADD COLUMN message_id TEXT,
ADD COLUMN sent_at TIMESTAMPTZ,
ADD COLUMN delivered_at TIMESTAMPTZ,
ADD COLUMN delivery_status TEXT CHECK (delivery_status IN ('sent', 'delivered', 'bounced', 'failed'));

-- Index for fast Message-ID lookup (when manually searching receipts)
CREATE INDEX idx_disdette_message_id ON disdette(message_id);

-- Documentation
COMMENT ON COLUMN disdette.message_id IS 'Email Message-ID header for tracking PEC receipts';
COMMENT ON COLUMN disdette.sent_at IS 'Timestamp when PEC was sent';
COMMENT ON COLUMN disdette.delivered_at IS 'Timestamp when delivery receipt received (manual update for now)';
COMMENT ON COLUMN disdette.delivery_status IS 'PEC delivery status: sent/delivered/bounced/failed (manual update for now)';
