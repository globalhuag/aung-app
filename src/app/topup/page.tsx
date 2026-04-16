'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User = { id: string; phone: string; credits: number }

const PACKAGES = [
  { id: 'a', price: 20,  credits: 4,  label: 'เริ่มต้น',  mm: 'အစပျိုး',    popular: false },
  { id: 'b', price: 50,  credits: 11, label: 'ยอดนิยม',  mm: 'လူကြိုက်များ', popular: true  },
  { id: 'c', price: 100, credits: 24, label: 'คุ้มสุด',   mm: 'သက်သာဆုံး',   popular: false },
]

export default function TopupPage() {
  const router   = useRouter()
  const [user, setUser]         = useState<User | null>(null)
  const [selected, setSelected] = useState('b')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
  }, [])

  const pkg = PACKAGES.find(p => p.id === selected)!

  const handlePay = async () => {
    if (!user) return
    setError('')
    setLoading(true)

    try {
      const res  = await fetch('/api/chillpay/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          user_id:    user.id,
          phone:      user.phone,
          package_id: selected,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
        setLoading(false)
        return
      }

      // Redirect to ChillPay payment page
      // After payment, ChillPay redirects to /topup/return?order_no=XXX
      const returnUrl = `${window.location.origin}/topup/return?order_no=${data.order_no}`

      // Open ChillPay payment URL (in same tab)
      // ChillPay's ReturnUrl is already set to /topup/return in the API
      window.location.href = data.payment_url

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || 'เกิดข้อผิดพลาด')
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            ←
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base">เติมเครดิต</div>
            <div className="text-white/70 text-xs" style={{ fontFamily: 'Noto Sans Myanmar' }}>ခရက်ဒစ်ဖြည့်ရန်</div>
          </div>
          <div className="bg-white/20 rounded-full px-3 py-1 text-white text-xs font-bold">
            ⭐ {user.credits} เครดิต
          </div>
        </div>

        <div className="flex-1 px-4 py-5 space-y-4">

          <div>
            <div className="text-base font-extrabold text-gray-800">เลือกแพ็กเกจ</div>
            <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>Package ရွေးချယ်ပါ</div>
          </div>

          {/* Package list */}
          <div className="space-y-3">
            {PACKAGES.map(p => (
              <button key={p.id} onClick={() => setSelected(p.id)}
                className={`w-full rounded-2xl border-2 px-4 py-4 text-left transition-all relative ${selected === p.id ? 'border-[#2B3FBE] bg-white' : 'border-gray-200 bg-white/60'}`}>
                {p.popular && (
                  <span className="absolute -top-2.5 left-4 bg-[#C9A84C] text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    ⭐ {p.label}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-[#2B3FBE]">{p.price} <span className="text-sm font-bold text-gray-500">บาท</span></div>
                    <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{p.mm}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-gray-800">⭐ {p.credits}</div>
                    <div className="text-xs text-gray-400">เครดิต</div>
                    <div className="text-xs text-green-600 font-bold mt-0.5">≈ {p.credits} เรซูเม่</div>
                  </div>
                </div>
                {selected === p.id && (
                  <div className="absolute right-3 top-3 w-5 h-5 bg-[#2B3FBE] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Info box */}
          <div className="bg-[#E8EBFF] rounded-xl px-4 py-3 text-xs text-[#2B3FBE]">
            <div className="font-bold mb-1">💳 ชำระผ่าน QR PromptPay</div>
            <div>ระบบจะพาไปหน้าชำระเงิน — สแกน QR แล้วเครดิตจะเพิ่มอัตโนมัติ</div>
            <div className="mt-0.5 opacity-70" style={{ fontFamily: 'Noto Sans Myanmar' }}>
              QR PromptPay ဖြင့် ပေးချေပြီး ခရက်ဒစ် အလိုအလျောက် ဖြည့်မည်
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">
              ⚠️ {error}
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-[#C9A84C] disabled:bg-gray-300 disabled:text-gray-400 text-white rounded-2xl py-4 font-extrabold text-base transition-colors">
            {loading ? (
              <span className="animate-pulse">กำลังสร้าง QR...</span>
            ) : (
              <>
                💳 จ่ายด้วย QR PromptPay — {pkg.price} บาท
                <div className="text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>
                  QR PromptPay ဖြင့် ပေးချေမည်
                </div>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  )
}
