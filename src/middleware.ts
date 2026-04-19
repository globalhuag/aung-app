import { NextRequest, NextResponse } from 'next/server'

// Intercept POST requests to /topup/return (ChillPay may POST directly here
// instead of our /api/chillpay/return route). Forward as 307 so the POST body
// is preserved and our API handler can process it.
export function middleware(request: NextRequest) {
  if (request.method === 'POST' && request.nextUrl.pathname === '/topup/return') {
    const url = request.nextUrl.clone()
    url.pathname = '/api/chillpay/return'
    return NextResponse.redirect(url, 307)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/topup/return'],
}
