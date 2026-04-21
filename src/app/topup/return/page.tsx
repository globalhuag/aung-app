'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function ReturnContent() {
  const router     = useRouter()
  const [count, setCount] = useState(4)   // countdown seconds before redirect

  useEffect(() => {
    // Clear any pending order ref
    localStorage.removeItem('pending_order_no')

    // Countdown then go to dashboard
    const id = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(id)
          router.push('/dashboard')
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [router])

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Card popup */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl">

          {/* Top accent */}
          <div style={{ background: 'linear-gradient(135deg,#2B3FBE,#6a11cb)', padding: '32px 24px', textAlign: 'center' }}>
            <div className="text-6xl mb-3">✅</div>
            <div className="text-white font-black text-xl leading-snug">สแกน QR สำเร็จแล้ว!</div>
            <div className="text-white/70 text-sm mt-1" style={{ fontFamily: 'Noto Sans Myanmar' }}>QR code ဖတ်ပြီးပါပြီ</div>
          </div>

          {/* Message */}
          <div className="px-6 py-6 text-center space-y-3">
            <div className="text-4xl">⭐</div>
            <div className="text-base font-black text-gray-800 leading-snug">
              เครดิตจะเพิ่มในระบบ<br />ภายในไม่เกิน 2 นาที
            </div>
            <div className="text-sm text-gray-500">
              ไม่ต้องรอในหน้านี้ กลับไปใช้งานแอปได้เลย
            </div>
            <div className="text-xs text-gray-400" style={{ fontFamily: 'Noto Sans Myanmar' }}>
              ခရက်ဒစ် မိနစ် ၂ အတွင်း ဖြည့်မည် — အက်ပ် ဆက်သုံးနိုင်သည်
            </div>

            {/* Countdown */}
            <div className="bg-[#F4F5FB] rounded-2xl px-4 py-3 mt-2">
              <div className="text-xs text-gray-400">กลับหน้าหลักในอีก</div>
              <div className="text-[10px] text-gray-400" style={{fontFamily:'Noto Sans Myanmar'}}>ပင်မ ပြန်သွားမည်</div>
              <div className="text-2xl font-black text-[#2B3FBE]">{count}</div>
              <div className="text-xs text-gray-400">วินาที · <span style={{fontFamily:'Noto Sans Myanmar'}}>စက္ကန့်</span></div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#2B3FBE] text-white rounded-2xl py-3.5 font-extrabold text-sm mt-1 flex flex-col items-center leading-tight"
            >
              <span>กลับหน้าหลักเลย →</span>
              <span className="text-[10px] font-normal opacity-80" style={{fontFamily:'Noto Sans Myanmar'}}>ပင်မ ပြန်သွားရန်</span>
            </button>
          </div>
        </div>

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
