-- =============================================
-- Aung App — LINE Login migration
-- Run this in Supabase SQL Editor AFTER deploying the new auth code.
-- Safe to run multiple times (idempotent).
-- =============================================

-- Add LINE profile columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS line_user_id text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS picture_url text;

-- One-to-one: each LINE user maps to at most one row
CREATE UNIQUE INDEX IF NOT EXISTS users_line_user_id_key
  ON users (line_user_id)
  WHERE line_user_id IS NOT NULL;

-- Phone is now optional (new LINE users may not provide one)
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- Keep password_hash nullable if it isn't already (for pre-existing columns).
-- New LINE-only users won't have one.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
  END IF;
END $$;

-- =============================================
-- Optional: drop OTP table once phone+OTP flow is fully removed.
-- Leave commented for now in case we roll back.
-- =============================================
-- DROP TABLE IF EXISTS otp_codes;
