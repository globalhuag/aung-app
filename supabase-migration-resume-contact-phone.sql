-- =============================================
-- Aung App - add per-resume contact phone
-- Run in Supabase SQL Editor. Idempotent.
-- =============================================

ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS contact_phone text;
