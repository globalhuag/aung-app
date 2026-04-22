-- =============================================
-- Aung App — Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- ── users ────────────────────────────────────
-- Auth is LINE-only: line_user_id comes from a verified LIFF idToken
-- (see src/app/api/auth/line/route.ts). phone is kept optional so existing
-- records can be linked manually; new rows may have phone = NULL.
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id text,
  display_name text,
  picture_url text,
  phone text UNIQUE,
  credits integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_line_user_id_key
  ON users (line_user_id)
  WHERE line_user_id IS NOT NULL;

-- ── resumes ──────────────────────────────────
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text,
  birthday text,
  gender text,
  race text,
  province text,
  smart_card text,
  bank_account text,
  drive_car text,
  car_license text,
  drive_moto text,
  moto_license text,
  thai_listen text,
  thai_read text,
  eng_listen text,
  eng_read text,
  skills text,
  w1_name text,
  w1_duration text,
  w1_salary text,
  w2_name text,
  w2_duration text,
  w2_salary text,
  w3_name text,
  w3_duration text,
  w3_salary text,
  want_job text,
  want_area text,
  want_salary text,
  strengths text,
  job_type text,
  photo_url text,
  doc_urls text[],
  suit_status text DEFAULT 'pending',  -- pending | done | error
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── topup_requests ────────────────────────────
CREATE TABLE IF NOT EXISTS topup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  package_id text,
  amount numeric,
  credits integer,
  status text DEFAULT 'pending',  -- pending | approved
  created_at timestamptz DEFAULT now()
);

-- ── jobs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  title_mm text,
  company text,
  job_type text,
  province text,
  salary text,
  salary_min numeric DEFAULT 0,
  salary_max numeric DEFAULT 0,
  description text,
  contact text,
  contact_phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ── chat_messages ─────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- otp_codes table was removed when auth switched to LINE LIFF (no more phone+OTP).
-- If migrating an existing DB, run: DROP TABLE IF EXISTS otp_codes;

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE topup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow all operations (app uses anon key + manual auth via localStorage)
-- Tighten these policies for production with proper auth

CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_resumes" ON resumes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_topup" ON topup_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_jobs" ON jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_chat" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Storage bucket: resume-files
-- Run in Supabase Dashboard > Storage > New bucket
-- Name: resume-files
-- Public: YES
-- =============================================

-- Or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resume-files', 'resume-files', true);
-- CREATE POLICY "allow_all_storage" ON storage.objects FOR ALL USING (true) WITH CHECK (true);
