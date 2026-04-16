'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User = { id: string; phone: string; credits: number }

const PACKAGES = [
  { id: 'a', price: 20, credits: 4, label: 'เริ่มต้น', mm: 'အစပျိုး', popular: false },
  { id: 'b', price: 50, credits: 11, label: 'ยอดนิยม', mm: 'လူကြိုက်များ', popular: true },
  { id: 'c', price: 100, credits: 24, label: 'คุ้มสุด', mm: 'သက်သာဆုံး', popular: false },
]

export default function TopupPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [selected, setSelected] = useState('b')
  const [step, setStep] = useState<'select' | 'payment' | 'done'>('select')
  const [uploading, setUploading] = useState(false)
  const [slipFile, setSlipFile] = useState<File | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
  }, [])

  const pkg = PACKAGES.find(p => p.id === selected)!

  const handleUploadSlip = async () => {
    if (!slipFile || !user) return
    setUploading(true)
    const ext = slipFile.name.split('.').pop()
    const path = `slips/${user.id}_${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('payment-slips').upload(path, slipFile)
    if (!uploadErr) {
      await supabase.from('topup_requests').insert({
        user_id: user.id,
        package_id: selected,
        amount: pkg.price,
        credits: pkg.credits,
        slip_path: path,
        status: 'pending',
      })
    }
    setUploading(false)
    setStep('done')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 py-3 flex items-center gap-3">
          <button onClick={() => step !== 'select' ? setStep('select') : router.back()}
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

          {step === 'select' && (
            <>
              <div>
                <div className="text-base font-extrabold text-gray-800">เลือกแพ็กเกจ</div>
                <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>Package ရွေးချယ်ပါ</div>
              </div>

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

              <div className="bg-[#E8EBFF] rounded-xl px-4 py-3 text-xs text-[#2B3FBE]">
                <div className="font-bold mb-1">ℹ️ วิธีการชำระเงิน</div>
                <div>โอนผ่าน PromptPay หรือธนาคาร แล้วแนบสลิป</div>
                <div className="mt-0.5 opacity-70" style={{ fontFamily: 'Noto Sans Myanmar' }}>PromptPay သို့မဟုတ် ဘဏ်မှလွှဲ၍ ဘောင်ချာတင်ပါ</div>
              </div>

              <button onClick={() => setStep('payment')}
                className="w-full bg-[#C9A84C] text-white rounded-2xl py-4 font-extrabold text-base">
                ถัดไป — ชำระ {pkg.price} บาท →
                <div className="text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>ဆက်လက်ဆောင်ရွက်မည်</div>
              </button>
            </>
          )}

          {step === 'payment' && (
            <>
              <div>
                <div className="text-base font-extrabold text-gray-800">ชำระเงิน</div>
                <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>ငွေပေးချေရန်</div>
              </div>

              {/* QR / PromptPay */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <div className="text-sm font-bold text-gray-700 mb-3">PromptPay</div>
                <div className="w-40 h-40 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                  <div className="text-5xl">📱</div>
                </div>
                <div className="text-lg font-black text-[#2B3FBE]">066-XXX-XXXX</div>
                <div className="text-xs text-gray-400 mt-1">ชื่อ: บริษัท Aung จำกัด</div>
                <div className="mt-3 bg-[#FFF8E8] rounded-xl px-3 py-2 text-sm font-black text-[#C9A84C]">
                  โอน {pkg.price} บาท → รับ ⭐ {pkg.credits} เครดิต
                </div>
              </div>

              {/* Upload slip */}
              <div>
                <div className="text-sm font-bold text-gray-700 mb-2">แนบสลิปโอนเงิน <span className="text-red-400">*</span></div>
                <label className={`w-full rounded-2xl border-2 border-dashed px-4 py-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${slipFile ? 'border-[#2B3FBE] bg-[#E8EBFF]' : 'border-gray-300 bg-white'}`}>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => setSlipFile(e.target.files?.[0] || null)} />
                  {slipFile ? (
                    <>
                      <div className="text-3xl">✅</div>
                      <div className="text-sm font-bold text-[#2B3FBE] text-center">{slipFile.name}</div>
                      <div className="text-xs text-gray-400">กดเพื่อเปลี่ยนไฟล์</div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl">📤</div>
                      <div className="text-sm font-bold text-gray-600">แตะเพื่ออัปโหลดสลิป</div>
                      <div className="text-xs text-gray-400" style={{ fontFamily: 'Noto Sans Myanmar' }}>ဘောင်ချာတင်ရန် နှိပ်ပါ</div>
                    </>
                  )}
                </label>
              </div>

              <button onClick={handleUploadSlip} disabled={!slipFile || uploading}
                className="w-full bg-[#2B3FBE] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl py-4 font-extrabold text-base">
                {uploading ? 'กำลังส่ง...' : '✓ ส่งสลิปยืนยัน'}
                {!uploading && <div className="text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>ဘောင်ချာပေးပို့မည်</div>}
              </button>
            </>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <div className="text-6xl">🎉</div>
              <div className="text-xl font-black text-gray-800">ส่งสลิปสำเร็จ!</div>
              <div className="text-sm text-gray-500">รอตรวจสอบ 15-30 นาที แล้วเครดิตจะเพิ่มอัตโนมัติ</div>
              <div className="text-xs text-gray-400" style={{ fontFamily: 'Noto Sans Myanmar' }}>
                မိနစ် ၁၅-၃၀ ခန့် စောင့်ဆိုင်းပါ၊ ထို့နောက် ခရက်ဒစ် အလိုအလျောက် ဖြည့်သွင်းမည်
              </div>
              <button onClick={() => router.push('/dashboard')}
                className="mt-4 bg-[#2B3FBE] text-white rounded-2xl px-8 py-3 font-extrabold text-sm">
                กลับหน้าหลัก
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
