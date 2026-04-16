import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/chillpay/status?order_no=WP...
// Returns { status: 'pending' | 'paid' | 'failed', credits?: number }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const order_no = searchParams.get('order_no') || ''

  if (!order_no) {
    return Response.json({ error: 'Missing order_no' }, { status: 400 })
  }

  const { data: topup, error } = await supabase
    .from('topup_requests')
    .select('status, credits, paid_at')
    .eq('order_no', order_no)
    .single()

  if (error || !topup) {
    return Response.json({ status: 'not_found' }, { status: 404 })
  }

  return Response.json({
    status:   topup.status,
    credits:  topup.credits,
    paid_at:  topup.paid_at ?? null,
  })
}
