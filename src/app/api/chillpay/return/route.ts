// ChillPay POSTs to this endpoint after payment (ReturnUrl)
// We return an HTML page directly so we don't depend on Next.js client routing or localStorage

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://aung-app.vercel.app').trim()

function successHtml(credits: number, orderNo: string) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>ชำระเงินสำเร็จ</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;background:#F4F5FB;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;padding:16px}
    .card{background:#fff;border-radius:24px;padding:32px 24px;max-width:360px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .emoji{font-size:64px;margin-bottom:16px}
    h1{font-size:22px;font-weight:900;color:#1a1a2e;margin-bottom:12px}
    .box{background:#E8EBFF;border-radius:16px;padding:16px 24px;margin:16px 0}
    .credits{font-size:32px;font-weight:900;color:#2B3FBE}
    .sub{font-size:13px;color:#555;margin-top:4px}
    .mm{font-size:12px;color:#888;margin-top:4px}
    .order{font-size:11px;color:#aaa;margin:12px 0;font-family:monospace}
    .btn{display:block;width:100%;background:#2B3FBE;color:#fff;border:none;border-radius:16px;padding:16px;font-size:16px;font-weight:900;cursor:pointer;text-decoration:none;margin-top:8px}
    .progress{height:4px;background:#E8EBFF;border-radius:2px;margin-top:16px;overflow:hidden}
    .bar{height:100%;background:#2B3FBE;border-radius:2px;animation:shrink 4s linear forwards}
    @keyframes shrink{from{width:100%}to{width:0%}}
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">🎉</div>
    <h1>ชำระเงินสำเร็จ!</h1>
    <div class="box">
      <div class="credits">⭐ +${credits}</div>
      <div class="sub">เครดิตถูกเพิ่มเข้าบัญชีแล้ว</div>
      <div class="mm">ခရက်ဒစ် ${credits} ထည့်သွင်းပြီး</div>
    </div>
    ${orderNo ? `<div class="order">Order: ${orderNo}</div>` : ''}
    <a class="btn" href="${APP_URL}/dashboard">กลับหน้าหลัก</a>
    <div class="progress"><div class="bar"></div></div>
    <div style="font-size:11px;color:#aaa;margin-top:6px">กลับอัตโนมัติใน 4 วินาที</div>
  </div>
  <script>setTimeout(()=>location.href='${APP_URL}/dashboard',4000)</script>
</body>
</html>`
}

function pendingHtml(orderNo: string) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>กำลังตรวจสอบ</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;background:#F4F5FB;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;padding:16px}
    .card{background:#fff;border-radius:24px;padding:32px 24px;max-width:360px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .emoji{font-size:56px;margin-bottom:16px}
    h1{font-size:20px;font-weight:900;color:#1a1a2e;margin-bottom:8px}
    .sub{font-size:13px;color:#666;margin:8px 0}
    .order{font-size:11px;color:#aaa;margin:12px 0;font-family:monospace}
    .btn{display:block;width:100%;background:#2B3FBE;color:#fff;border:none;border-radius:16px;padding:16px;font-size:16px;font-weight:900;cursor:pointer;text-decoration:none;margin-top:12px}
    #status{font-size:13px;color:#2B3FBE;margin-top:12px;min-height:20px}
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji" id="icon">💳</div>
    <h1 id="title">กำลังตรวจสอบการชำระเงิน…</h1>
    <div class="sub">ระบบกำลังยืนยัน — รอสักครู่</div>
    <div class="sub" style="font-family:sans-serif">ငွေပေးချေမှု အတည်ပြုနေသည်…</div>
    ${orderNo ? `<div class="order">Order: ${orderNo}</div>` : ''}
    <div id="status"></div>
    <a class="btn" href="${APP_URL}/dashboard" id="btn" style="display:none">กลับหน้าหลัก</a>
  </div>
  <script>
    var orderNo = '${orderNo}';
    var tries = 0;
    var maxTries = 24;
    function poll() {
      if (!orderNo) { done(false); return; }
      fetch('/api/chillpay/status?order_no=' + orderNo)
        .then(function(r){ return r.json(); })
        .then(function(d){
          if (d.status === 'paid') {
            document.getElementById('icon').textContent = '🎉';
            document.getElementById('title').textContent = 'ชำระเงินสำเร็จ! ⭐ +' + (d.credits || '');
            document.getElementById('status').textContent = 'เครดิตถูกเพิ่มเข้าบัญชีแล้ว';
            document.getElementById('btn').style.display = 'block';
            setTimeout(function(){ location.href = '${APP_URL}/dashboard'; }, 3000);
          } else {
            tries++;
            if (tries < maxTries) {
              document.getElementById('status').textContent = 'ลอง ' + tries + '/' + maxTries + '…';
              setTimeout(poll, 5000);
            } else {
              done(false);
            }
          }
        })
        .catch(function(){ tries++; if(tries<maxTries) setTimeout(poll,5000); else done(false); });
    }
    function done(paid) {
      if (!paid) {
        document.getElementById('icon').textContent = '⏳';
        document.getElementById('title').textContent = 'ยังไม่ได้รับการยืนยัน';
        document.getElementById('status').textContent = 'หากโอนแล้ว เครดิตจะเพิ่มภายใน 15-30 นาที';
        document.getElementById('btn').style.display = 'block';
      }
    }
    setTimeout(poll, 3000);
  </script>
</body>
</html>`
}

async function handleReturn(req: Request): Promise<Response> {
  try {
    let orderNo = ''
    const method = req.method

    if (method === 'POST') {
      const contentType = req.headers.get('content-type') || ''
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await req.formData()
        orderNo = String(formData.get('OrderNo') || formData.get('order_no') || '')
      } else if (contentType.includes('application/json')) {
        const json = await req.json()
        orderNo = String(json.OrderNo || json.order_no || '')
      } else {
        try {
          const text = await req.text()
          const params = new URLSearchParams(text)
          orderNo = params.get('OrderNo') || params.get('order_no') || ''
        } catch { /* ignore */ }
      }
    } else {
      const url = new URL(req.url)
      orderNo = url.searchParams.get('OrderNo') || url.searchParams.get('order_no') || ''
    }

    console.log('[ChillPay return] method:', method, 'OrderNo:', orderNo)

    // If we have an order_no, look up the topup to get credits
    if (orderNo) {
      // Wait briefly for the notify webhook to finish processing (it runs in parallel)
      await new Promise(r => setTimeout(r, 2000))

      const { data: topup } = await supabase
        .from('topup_requests')
        .select('status, credits')
        .eq('order_no', orderNo)
        .single()

      console.log('[ChillPay return] topup lookup:', topup)

      if (topup?.status === 'paid') {
        return new Response(successHtml(topup.credits, orderNo), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
    }

    // Not yet paid — show polling page
    return new Response(pendingHtml(orderNo), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })

  } catch (e) {
    console.error('[ChillPay return] error:', e)
    // Fallback: just redirect to dashboard
    return new Response(null, {
      status: 303,
      headers: { Location: `${APP_URL}/dashboard` },
    })
  }
}

export async function POST(req: Request) {
  return handleReturn(req)
}

export async function GET(req: Request) {
  return handleReturn(req)
}
