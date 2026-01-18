-- Enhanced payment tracking columns for Stripe integration
-- Run this migration in Supabase SQL Editor

-- Add payment tracking columns to disdette table
ALTER TABLE disdette
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_amount INTEGER,           -- in cents
ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT 'eur',
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_method TEXT,              -- 'card', 'apple_pay', 'google_pay'
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_disdette_stripe_session
ON disdette(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_disdette_payment_status
ON disdette(payment_status);

-- Add constraint for payment_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_payment_status'
    ) THEN
        ALTER TABLE disdette
        ADD CONSTRAINT check_payment_status
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
    END IF;
END $$;

-- Comment on columns for documentation
COMMENT ON COLUMN disdette.payment_status IS 'Payment status: pending, paid, failed, refunded';
COMMENT ON COLUMN disdette.payment_amount IS 'Payment amount in cents (e.g., 699 = €6.99)';
COMMENT ON COLUMN disdette.payment_currency IS 'ISO 4217 currency code (default: eur)';
COMMENT ON COLUMN disdette.payment_date IS 'Timestamp when payment was completed';
COMMENT ON COLUMN disdette.payment_method IS 'Payment method used (card, apple_pay, google_pay)';
COMMENT ON COLUMN disdette.stripe_session_id IS 'Stripe Checkout Session ID for idempotency';
COMMENT ON COLUMN disdette.stripe_payment_intent IS 'Stripe Payment Intent ID for reference';
