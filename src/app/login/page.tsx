'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const formatPhone = (digits: string) => {
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return digits.slice(0,3) + '-' + digits.slice(3)
    return digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6)
  }

  const handleNum = (n: string) => {
    if (phone.length < 10) setPhone(p => p + n)
  }
  const handleDel = () => setPhone(p => p.slice(0, -1))
  const handleClear = () => setPhone('')

  const handlePinNum = (n: string) => {
    if (pin.length < 6) setPin(p => p + n)
  }
  const handlePinDel = () => setPin(p => p.slice(0, -1))

  const handleLogin = async () => {
    if (phone.length !== 10) { setError('กรอกเบอร์ให้ครบ 10 หลัก'); return }
    if (pin.length !== 6) { setError('กรอกรหัสผ่านให้ครบ 6 หลัก'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single()
      if (err || !data) { setError('ไม่พบเบอร์นี้ในระบบ'); setLoading(false); return }
      const match = await bcrypt.compare(pin, data.password_hash)
      if (!match) { setError('รหัสผ่านไม่ถูกต้อง'); setLoading(false); return }
      localStorage.setItem('aung_user', JSON.stringify(data))
      router.push('/dashboard')
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
    setLoading(false)
  }

  const isPhoneDone = phone.length === 10
  const isPinDone = pin.length === 6
  const step = isPhoneDone ? 'pin' : 'phone'

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-[#F4F5FB]">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 py-6 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Aung" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <div className="text-white font-black text-3xl tracking-wide leading-none">Aung</div>
              <div className="text-white/60 text-xs mt-1" style={{fontFamily:'Noto Sans Myanmar, sans-serif'}}>အောင်</div>
            </div>
          </div>
          <div className="text-white/50 text-xs tracking-wide">Super App · แรงงานพม่าในไทย</div>
        </div>

        <div className="px-5 py-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4 text-center">
              {error}
            </div>
          )}

          {/* Phone step */}
          {step === 'phone' && (
            <>
              <div className="text-sm font-bold text-gray-500 mb-1">
                เบอร์มือถือ / <span style={{fontFamily:'Noto Sans Myanmar'}}>ဖုန်းနံပါတ်</span>
              </div>
              <div className={`bg-white rounded-xl border-2 py-3 px-4 text-center text-2xl font-black tracking-widest mb-1 ${isPhoneDone ? 'border-green-500' : 'border-[#2B3FBE]'}`}>
                {phone ? formatPhone(phone) : <span className="text-gray-300">088-888-8888</span>}
              </div>
              {isPhoneDone
                ? <div className="text-green-600 text-xs font-bold text-center mb-4">✓ รูปแบบถูกต้อง</div>
                : <div className="text-gray-400 text-xs text-center mb-4">{phone.length}/10 หลัก</div>
              }
              <Numpad onNum={handleNum} onDel={handleDel} onClear={handleClear} />
              <div className="flex gap-3 mt-4">
                <button onClick={() => router.push('/register')} className="flex-1 bg-[#4A4845] text-white rounded-xl py-3 text-sm font-bold">
                  สมัครสมาชิก
                  <span className="block text-xs opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>အကောင့်ဖွင့်</span>
                </button>
                <button
                  onClick={() => isPhoneDone && setPhone(p => p)}
                  disabled={!isPhoneDone}
                  className={`flex-[1.3] rounded-xl py-3 text-sm font-bold text-white transition-opacity ${isPhoneDone ? 'bg-[#2B3FBE]' : 'bg-[#2B3FBE] opacity-40 cursor-not-allowed'}`}
                >
                  ถัดไป →
                  <span className="block text-xs opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>ရှေ့ဆက်</span>
                </button>
              </div>
            </>
          )}

          {/* Pin step */}
          {step === 'pin' && (
            <>
              <div className="text-sm font-bold text-gray-500 mb-1">
                รหัสผ่าน 6 หลัก / <span style={{fontFamily:'Noto Sans Myanmar'}}>စကားဝှက်</span>
              </div>
              <div className="bg-white rounded-xl border-2 border-[#2B3FBE] py-4 px-4 flex justify-center gap-3 mb-1">
                {Array.from({length:6}).map((_,i) => (
                  <div key={i} className={`w-4 h-4 rounded-full ${i < pin.length ? 'bg-[#2B3FBE]' : 'bg-gray-200'} ${i === pin.length ? 'border-2 border-[#2B3FBE]' : ''}`} />
                ))}
              </div>
              <div className="text-gray-400 text-xs text-center mb-1">{pin.length}/6 หลัก</div>
              <div className="text-right mb-4">
                <button onClick={() => router.push('/forgot')} className="text-xs text-[#2B3FBE] font-bold">ลืมรหัสผ่าน?</button>
              </div>
              <Numpad onNum={handlePinNum} onDel={handlePinDel} onClear={() => setPin('')} />
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setPhone(''); setPin('') }} className="flex-[0.8] bg-[#4A4845] text-white rounded-xl py-3 text-sm font-bold">
                  ← กลับ
                  <span className="block text-xs opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>နောက်သို့</span>
                </button>
                <button
                  onClick={handleLogin}
                  disabled={!isPinDone || loading}
                  className={`flex-[1.2] rounded-xl py-3 text-sm font-bold text-white transition-opacity ${isPinDone && !loading ? 'bg-[#2B3FBE]' : 'bg-[#2B3FBE] opacity-40 cursor-not-allowed'}`}
                >
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ →'}
                  <span className="block text-xs opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>ဝင်ရောက်</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Numpad({ onNum, onDel, onClear }: { onNum:(n:string)=>void, onDel:()=>void, onClear:()=>void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','ล้าง','0','⌫']
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map(k => (
        <button
          key={k}
          onClick={() => k === '⌫' ? onDel() : k === 'ล้าง' ? onClear() : onNum(k)}
          className={`rounded-xl py-3.5 text-center font-bold text-xl active:scale-95 transition-transform
            ${k === '⌫' ? 'bg-red-50 text-red-500 text-base' : k === 'ล้าง' ? 'bg-gray-100 text-gray-500 text-sm' : 'bg-white border border-gray-200 text-gray-800'}`}
        >
          {k}
        </button>
      ))}
    </div>
  )
}

