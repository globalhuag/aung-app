import { createClient } from '@supabase/supabase-js'

// Server-only client using the service_role key. NEVER import this from client code.
// The service_role key bypasses RLS, so this is how we read/write tables that anon
// users must not touch directly (e.g. otp_codes).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
