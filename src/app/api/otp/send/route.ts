import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

const API_KEY    = (process.env.THAIBULKSMS_API_KEY    || '').trim()
const API_SECRET = (process.env.THAIBULKSMS_API_SECRET || '').trim()
const SENDER     = (process.env.THAIBULKSMS_SENDER     || 'Aung').trim()
const FORCE      = (process.env.THAIBULKSMS_FORCE      || 'standard').trim()  // standard | corporate
const SMS_URL    = 'https://api-v2.thaibulksms.com/sms'

const OTP_TTL_MS    = 5 * 60 * 1000          // 5 minutes
const RESEND_GAP_MS = 60 * 1000              // 60s between sends

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    if (typeof phone !== 'string' || !/^0\d{9}$/.test(phone)) {
      return Response.json({ error: 'เบอร์ไม่ถูกต้อง' }, { status: 400 })
    }

    // Reject if phone already registered
    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()
    if (userRow) {
      return Response.json({ error: 'เบอร์นี้มีบัญชีแล้ว กรุณา Login' }, { status: 409 })
    }

    // Rate-limit resend
    const { data: existing } = await supabase
      .from('otp_codes')
      .select('last_sent_at')
      .eq('phone', phone)
      .maybeSingle()
    if (existing) {
      const elapsed = Date.now() - new Date(existing.last_sent_at).getTime()
      if (elapsed < RESEND_GAP_MS) {
        const wait = Math.ceil((RESEND_GAP_MS - elapsed) / 1000)
        return Response.json({ error: `ขอรหัสถี่เกินไป รออีก ${wait} วินาที` }, { status: 429 })
      }
    }

    // Generate 6-digit code
    const code       = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
    const code_hash  = await bcrypt.hash(code, 10)
    const now        = new Date()
    const expires_at = new Date(now.getTime() + OTP_TTL_MS)

    // Save first — prevents attacker from sidestepping rate limit on SMS-provider errors
    const { error: upErr } = await supabase.from('otp_codes').upsert({
      phone,
      code_hash,
      attempts:     0,
      verified:     false,
      expires_at:   expires_at.toISOString(),
      last_sent_at: now.toISOString(),
    }, { onConflict: 'phone' })
    if (upErr) {
      console.error('[OTP send] DB error:', upErr.message)
      return Response.json({ error: 'บันทึกข้อมูลไม่สำเร็จ' }, { status: 500 })
    }

    // Send SMS via Thaibulksms
    // Format phone as 66XXXXXXXXX per API docs
    const msisdn  = '66' + phone.slice(1)
    const message = `รหัส OTP ของคุณคือ ${code} (ใช้ได้ ${OTP_TTL_MS / 60000} นาที) - Aung App`
    const auth    = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')
    const form    = new URLSearchParams({
      msisdn,
      message,
      sender: SENDER,
      force:  FORCE,
    })

    const smsResp = await fetch(SMS_URL, {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })
    const smsData = await smsResp.json().catch(() => ({}))

    if (!smsResp.ok || smsData.error) {
      console.error('[OTP send] SMS error:', smsResp.status, JSON.stringify(smsData))
      return Response.json({
        error: smsData?.error?.description || 'ส่ง SMS ไม่สำเร็จ',
      }, { status: 502 })
    }

    console.log('[OTP send] sent to', msisdn, 'remaining_credit:', smsData.remaining_credit)
    return Response.json({ ok: true, expires_at: expires_at.toISOString() })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[OTP send] error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
