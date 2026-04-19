// ChillPay POSTs to this endpoint after payment (ReturnUrl)
// We read OrderNo from body and redirect to the return page as GET

export async function POST(req: Request) {
  try {
    let orderNo = ''

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      orderNo = String(formData.get('OrderNo') || formData.get('order_no') || '')
    } else if (contentType.includes('application/json')) {
      const json = await req.json()
      orderNo = String(json.OrderNo || json.order_no || '')
    } else {
      // Try form data as default
      try {
        const text = await req.text()
        const params = new URLSearchParams(text)
        orderNo = params.get('OrderNo') || params.get('order_no') || ''
      } catch { /* ignore */ }
    }

    console.log('[ChillPay return] POST received, OrderNo:', orderNo)

    // Redirect to the return page as GET (303 = change method to GET)
    const base = new URL(req.url)
    const returnUrl = `${base.origin}/topup/return${orderNo ? `?order_no=${orderNo}` : ''}`
    return Response.redirect(returnUrl, 303)

  } catch (e) {
    console.error('[ChillPay return] error:', e)
    return Response.redirect(new URL('/topup/return', req.url).toString(), 303)
  }
}

// Also handle GET (in case ChillPay redirects with GET)
export async function GET(req: Request) {
  const url = new URL(req.url)
  const orderNo = url.searchParams.get('OrderNo') || url.searchParams.get('order_no') || ''
  const returnUrl = `${url.origin}/topup/return${orderNo ? `?order_no=${orderNo}` : ''}`
  return Response.redirect(returnUrl, 303)
}
