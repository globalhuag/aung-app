import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MERCHANT_CODE = (process.env.CHILLPAY_MERCHANT_CODE || '').trim()
const API_KEY       = (process.env.CHILLPAY_API_KEY     || '').trim()
const MD5_KEY       = (process.env.CHILLPAY_MD5_KEY     || '').trim()
const DIRECT_URL    = (process.env.CHILLPAY_DIRECT_URL  || '').trim()
const APP_URL       = (process.env.NEXT_PUBLIC_APP_URL  || 'https://aung-app.vercel.app').trim()

// Packages: amount in satang (1 baht = 100 satang)
const PACKAGES: Record<string, { price: number; amount: number; credits: number }> = {
  a: { price: 20,  amount: 2000,  credits: 4  },
  b: { price: 50,  amount: 5000,  credits: 11 },
  c: { price: 100, amount: 10000, credits: 24 },
}

export async function POST(req: Request) {
  try {
    const { user_id, phone, package_id } = await req.json()

    if (!user_id || !phone || !package_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const pkg = PACKAGES[package_id]
    if (!pkg) {
      return Response.json({ error: 'Invalid package' }, { status: 400 })
    }

    // Generate unique OrderNo: WP + yyyyMMddHHmmss + 4 random HEX
    const now      = new Date()
    const ts       = now.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14)
    const rand     = crypto.randomBytes(2).toString('hex').toUpperCase()
    const order_no = `WP${ts}${rand}`

    // Clean phone — digits only
    const phone_clean   = phone.replace(/\D/g, '').slice(0, 10) || '0812345678'
    const customer_id   = phone_clean
    const amount_str    = String(pkg.amount)  // e.g. "2000"
    const description   = 'Aung Credit'
    const channel_code  = 'bank_qrcode'
    const currency      = '764'
    const lang_code     = 'TH'
    const route_no      = '1'
    const ip_address    = '127.0.0.1'

    // Checksum = MD5(MerchantCode+OrderNo+CustomerId+Amount+PhoneNumber+Description
    //             +ChannelCode+Currency+LangCode+RouteNo+IPAddress+ApiKey
    //             +"" x8 (reserved fields) +MD5Key)
    const raw = MERCHANT_CODE + order_no + customer_id + amount_str +
      phone_clean + description + channel_code + currency +
      lang_code + route_no + ip_address + API_KEY +
      '' + '' + '' + '' + '' + '' + '' + '' +   // 8 reserved empty fields
      MD5_KEY

    const checksum = crypto.createHash('md5').update(raw, 'utf8').digest('hex')

    // Build form body
    const form = new URLSearchParams({
      MerchantCode:  MERCHANT_CODE,
      OrderNo:       order_no,
      CustomerId:    customer_id,
      Amount:        amount_str,
      PhoneNumber:   phone_clean,
      Description:   description,
      ChannelCode:   channel_code,
      Currency:      currency,
      LangCode:      lang_code,
      RouteNo:       route_no,
      IPAddress:     ip_address,
      ApiKey:        API_KEY,
      CheckSum:      checksum,
      ReturnUrl:     `${APP_URL}/api/chillpay/return`,
      BackgroundUrl: `${APP_URL}/api/chillpay/notify`,
    })

    console.log('[ChillPay create] OrderNo:', order_no, 'Amount:', amount_str, 'Phone:', phone_clean)
    console.log('[ChillPay create] MerchantCode:', JSON.stringify(MERCHANT_CODE), 'KeyLen:', API_KEY.length, 'Md5Len:', MD5_KEY.length)
    console.log('[ChillPay create] raw checksum string length:', raw.length)
    console.log('[ChillPay create] checksum:', checksum)
    console.log('[ChillPay create] ReturnUrl:', `${APP_URL}/api/chillpay/return`)
    console.log('[ChillPay create] BackgroundUrl:', `${APP_URL}/api/chillpay/notify`)

    const cpResp = await fetch(DIRECT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    form.toString(),
    })

    const cpData = await cpResp.json()
    console.log('[ChillPay create] response:', JSON.stringify(cpData))

    if (cpData.Status !== 0) {
      return Response.json(
        { error: cpData.Message || 'ChillPay error', code: cpData.Code, status: cpData.Status },
        { status: 400 }
      )
    }

    const transaction_id = String(cpData.TransactionId || '')
    const payment_url    = String(cpData.PaymentUrl    || '')

    // Save pending topup request to Supabase
    const { error: dbErr } = await supabase.from('topup_requests').insert({
      user_id,
      package_id,
      amount:         pkg.price,
      credits:        pkg.credits,
      status:         'pending',
      order_no,
      transaction_id,
      payment_url,
    })

    if (dbErr) {
      console.error('[ChillPay create] DB error:', dbErr.message)
    }

    return Response.json({ payment_url, order_no, transaction_id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ChillPay create] error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
