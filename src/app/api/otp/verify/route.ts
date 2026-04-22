import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

const MAX_ATTEMPTS = 5

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json()
    if (typeof phone !== 'string' || !/^0\d{9}$/.test(phone)) {
      return Response.json({ error: 'เบอร์ไม่ถูกต้อง' }, { status: 400 })
    }
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return Response.json({ error: 'รหัส OTP ต้องเป็นตัวเลข 6 หลัก' }, { status: 400 })
    }

    const { data: row } = await supabase
      .from('otp_codes')
      .select('code_hash, attempts, expires_at, verified')
      .eq('phone', phone)
      .maybeSingle()

    if (!row) {
      return Response.json({ error: 'ไม่พบรหัส OTP กรุณาขอรหัสใหม่' }, { status: 400 })
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return Response.json({ error: 'รหัส OTP หมดอายุ กรุณาขอรหัสใหม่' }, { status: 400 })
    }

    if (row.attempts >= MAX_ATTEMPTS) {
      return Response.json({ error: 'ลองผิดเกินจำนวนที่กำหนด กรุณาขอรหัสใหม่' }, { status: 429 })
    }

    // Always consume an attempt before checking, to rate-limit brute force
    await supabase
      .from('otp_codes')
      .update({ attempts: row.attempts + 1 })
      .eq('phone', phone)

    const match = await bcrypt.compare(code, row.code_hash)
    if (!match) {
      const left = MAX_ATTEMPTS - (row.attempts + 1)
      return Response.json({
        error: left > 0 ? `รหัส OTP ไม่ถูกต้อง (เหลือ ${left} ครั้ง)` : 'รหัส OTP ไม่ถูกต้อง',
      }, { status: 400 })
    }

    await supabase
      .from('otp_codes')
      .update({ verified: true })
      .eq('phone', phone)

    return Response.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[OTP verify] error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
