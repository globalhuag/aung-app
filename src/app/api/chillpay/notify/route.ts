import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ChillPay sends POST form-data with: OrderNo, PaymentStatus, TransactionId
// PaymentStatus = "0" means SUCCESS
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let orderNo = '', paymentStatus = '', transactionId = ''

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text   = await req.text()
      const params = new URLSearchParams(text)
      orderNo        = params.get('OrderNo')        || ''
      paymentStatus  = params.get('PaymentStatus')  || ''
      transactionId  = params.get('TransactionId')  || ''
    } else {
      // JSON fallback (in case Cloudflare worker forwarded as JSON)
      const body   = await req.json()
      orderNo        = body.OrderNo        || ''
      paymentStatus  = body.PaymentStatus  || ''
      transactionId  = body.TransactionId  || ''
    }

    console.log('[ChillPay notify] OrderNo:', orderNo, 'Status:', paymentStatus, 'TxId:', transactionId)

    if (!orderNo) {
      return new Response('OK', { status: 200 }) // always 200 to ChillPay
    }

    // Only process successful payments (PaymentStatus = "0")
    if (String(paymentStatus) !== '0') {
      console.log('[ChillPay notify] Not success, ignored')
      return new Response('OK', { status: 200 })
    }

    // Find the pending topup request
    const { data: topup, error: findErr } = await supabase
      .from('topup_requests')
      .select('*')
      .eq('order_no', orderNo)
      .eq('status', 'pending')
      .single()

    if (findErr || !topup) {
      console.log('[ChillPay notify] No pending order found for:', orderNo)
      return new Response('OK', { status: 200 })
    }

    // Idempotency check — might get called twice
    if (topup.status === 'paid') {
      console.log('[ChillPay notify] Already processed:', orderNo)
      return new Response('OK', { status: 200 })
    }

    // Update topup request to paid
    await supabase
      .from('topup_requests')
      .update({ status: 'paid', transaction_id: transactionId, paid_at: new Date().toISOString() })
      .eq('id', topup.id)

    // Add credits to user
    const { data: user } = await supabase
      .from('users')
      .select('credits')
      .eq('id', topup.user_id)
      .single()

    const newCredits = (user?.credits || 0) + topup.credits
    await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', topup.user_id)

    console.log('[ChillPay notify] ✅ Credited', topup.credits, 'to user', topup.user_id, '→ total:', newCredits)

    return new Response('OK', { status: 200 }) // ChillPay expects "OK"
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ChillPay notify] error:', msg)
    return new Response('OK', { status: 200 }) // always 200 to prevent retries
  }
}

// ChillPay might also GET this endpoint as a health check
export async function GET() {
  return new Response('OK', { status: 200 })
}
