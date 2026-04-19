'use client'
import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type PollStatus = 'polling' | 'paid' | 'timeout'

function ReturnContent() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  // ดึง order_no จาก URL ก่อน ถ้าไม่มีให้ดึงจาก localStorage (ChillPay อาจตัด query params)
  const order_no      = searchParams.get('order_no')
                     || searchParams.get('OrderNo')
                     || (typeof window !== 'undefined' ? localStorage.getItem('pending_order_no') : '')
                     || ''
  const [status, setStatus]   = useState<PollStatus>('polling')
  const [credits, setCredits] = useState(0)
  const [dots, setDots]       = useState('.')
  const tries   = useRef(0)
  const maxTries = 24 // 24 × 5s = 2 minutes

  // Animate dots
  useEffect(() => {
    if (status !== 'polling') return
    const id = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 600)
    return () => clearInterval(id)
  }, [status])

  // Poll /api/chillpay/status every 5 seconds
  useEffect(() => {
    if (!order_no || status !== 'polling') return

    const poll = async () => {
      tries.current += 1
      try {
        const res  = await fetch(`/api/chillpay/status?order_no=${order_no}`)
        const data = await res.json()

        if (data.status === 'paid') {
          setCredits(data.credits ?? 0)
          setStatus('paid')
          localStorage.removeItem('pending_order_no')

          // Update localStorage credits
          try {
            const raw = localStorage.getItem('aung_user')
            if (raw) {
              const u = JSON.parse(raw)
              const { data: fresh } = await supabase
                .from('users')
                .select('credits')
                .eq('id', u.id)
                .single()
              if (fresh) {
                localStorage.setItem('aung_user', JSON.stringify({ ...u, credits: fresh.credits }))
              }
            }
          } catch (_) { /* non-critical */ }

          return
        }
      } catch (_) { /* keep polling */ }

      if (tries.current >= maxTries) {
        setStatus('timeout')
        localStorage.removeItem('pending_order_no')
        return
      }
      setTimeout(poll, 5000)
    }

    setTimeout(poll, 3000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order_no])

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        {/* POLLING */}
        {status === 'polling' && (
          <div className="space-y-5">
            <div className="text-5xl animate-pulse">💳</div>
            <div className="text-xl font-black text-gray-800">กำลังตรวจสอบการชำระเงิน{dots}</div>
            <div className="text-sm text-gray-500">รอสักครู่ ระบบกำลังยืนยันการชำระเงินของคุณ</div>
            <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Noto Sans Myanmar' }}>
              ငွေပေးချေမှု အတည်ပြုနေသည်{dots}
            </div>
            <div className="mt-4 bg-white rounded-2xl border border-gray-100 px-4 py-3 text-xs text-gray-400">
              Order: <span className="font-mono text-gray-600">{order_no}</span>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'paid' && (
          <div className="space-y-5">
            <div className="text-6xl">🎉</div>
            <div className="text-2xl font-black text-gray-800">ชำระเงินสำเร็จ!</div>
            <div className="bg-[#E8EBFF] rounded-2xl px-6 py-4">
              <div className="text-3xl font-black text-[#2B3FBE]">⭐ +{credits}</div>
              <div className="text-sm text-gray-600 mt-1">เครดิตถูกเพิ่มเข้าบัญชีแล้ว</div>
              <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>
                ခရက်ဒစ် {credits} ထည့်သွင်းပြီး
              </div>
            </div>
            <button onClick={() => router.push('/dashboard')}
              className="w-full bg-[#2B3FBE] text-white rounded-2xl py-4 font-extrabold text-base">
              กลับหน้าหลัก
            </button>
          </div>
        )}

        {/* TIMEOUT */}
        {status === 'timeout' && (
          <div className="space-y-5">
            <div className="text-5xl">⏳</div>
            <div className="text-xl font-black text-gray-800">ยังไม่ได้รับการยืนยัน</div>
            <div className="text-sm text-gray-500">
              ระบบยังไม่ได้รับการยืนยันจาก ChillPay<br />
              หากโอนเงินแล้ว เครดิตจะเพิ่มภายใน 15-30 นาที
            </div>
            <div className="text-xs text-gray-400" style={{ fontFamily: 'Noto Sans Myanmar' }}>
              ChillPay မှ အတည်ပြုချက် မရသေးပါ<br />
              ငွေလွှဲပြီးပါက မိနစ် ၁၅-၃၀ အတွင်း ခရက်ဒစ် ဖြည့်မည်
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-xs text-gray-400">
              Order: <span className="font-mono text-gray-600">{order_no}</span>
            </div>
            <button onClick={() => router.push('/dashboard')}
              className="w-full bg-[#2B3FBE] text-white rounded-2xl py-4 font-extrabold text-base">
              กลับหน้าหลัก
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default function TopupReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F5FB] flex items-center justify-center">
        <div className="text-4xl animate-pulse">💳</div>
      </div>
    }>
      <ReturnContent />
    </Suspense>
  )
}
