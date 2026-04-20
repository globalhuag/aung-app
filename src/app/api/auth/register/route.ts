import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

// Caller must have already passed /api/otp/verify which sets otp_codes.verified = true.
// This route double-checks verified flag before inserting the user, so someone who skips
// the OTP step cannot register directly via the Supabase anon client.
export async function POST(req: Request) {
  try {
    const { phone, pin } = await req.json()
    if (typeof phone !== 'string' || !/^0\d{9}$/.test(phone)) {
      return Response.json({ error: 'เบอร์ไม่ถูกต้อง' }, { status: 400 })
    }
    if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
      return Response.json({ error: 'รหัสผ่านต้องเป็นตัวเลข 6 หลัก' }, { status: 400 })
    }

    // Gate: must have a verified, unexpired OTP
    const { data: otp } = await supabase
      .from('otp_codes')
      .select('verified, expires_at')
      .eq('phone', phone)
      .maybeSingle()

    if (!otp || !otp.verified) {
      return Response.json({ error: 'กรุณายืนยัน OTP ก่อนสมัครสมาชิก' }, { status: 403 })
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return Response.json({ error: 'OTP หมดอายุ กรุณาขอรหัสใหม่' }, { status: 403 })
    }

    // Reject duplicate phone (race against another tab)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()
    if (existingUser) {
      return Response.json({ error: 'เบอร์นี้มีบัญชีแล้ว กรุณา Login' }, { status: 409 })
    }

    const hash = await bcrypt.hash(pin, 10)
    const { data: user, error: insErr } = await supabase
      .from('users')
      .insert({ phone, password_hash: hash, credits: 1 })
      .select()
      .single()
    if (insErr || !user) {
      console.error('[Register] insert error:', insErr?.message)
      return Response.json({ error: 'สมัครสมาชิกไม่สำเร็จ' }, { status: 500 })
    }

    // Burn the OTP so it cannot be reused
    await supabase.from('otp_codes').delete().eq('phone', phone)

    return Response.json({ ok: true, user })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Register] error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
