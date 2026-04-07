-- Phase 1: SMS Hardening Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. raw_sms: source of truth for every SMS the iOS Shortcut forwards
CREATE TABLE IF NOT EXISTS raw_sms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sender TEXT,
  body TEXT NOT NULL,
  body_hash TEXT GENERATED ALWAYS AS (encode(sha256(body::bytea), 'hex')) STORED,
  processed BOOLEAN NOT NULL DEFAULT false,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  error TEXT,
  UNIQUE(body_hash)
);

CREATE INDEX IF NOT EXISTS idx_raw_sms_processed ON raw_sms(processed);
CREATE INDEX IF NOT EXISTS idx_raw_sms_received_at ON raw_sms(received_at);

-- RLS: same policy as transactions (single-user app)
ALTER TABLE raw_sms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for raw_sms" ON raw_sms FOR ALL USING (true) WITH CHECK (true);

-- 2. Add raw_sms_id FK to existing transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS raw_sms_id UUID REFERENCES raw_sms(id) ON DELETE SET NULL;

-- Verify
SELECT 'raw_sms table created' AS status;
SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'raw_sms_id';
