'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone'|'otp'|'pin'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const formatPhone = (d: string) => {
    if (d.length <= 3) return d
    if (d.length <= 6) return d.slice(0,3)+'-'+d.slice(3)
    return d.slice(0,3)+'-'+d.slice(3,6)+'-'+d.slice(6)
  }

  const handlePhoneNext = async () => {
    if (phone.length !== 10) { setError('กรอกเบอร์ให้ครบ 10 หลัก'); return }
    setError('')
    setLoading(true)
    // ตรวจว่าเบอร์ซ้ำไหม
    const { data } = await supabase.from('users').select('id').eq('phone', phone).single()
    if (data) { setError('เบอร์นี้มีบัญชีแล้ว กรุณา Login'); setLoading(false); return }
    // Mock OTP — ระบบยังไม่เชื่อม Thaibulksms
    setStep('otp')
    window.scrollTo(0, 0)
    setLoading(false)
  }

  const handleOtpNext = () => {
    // Mock: รับ OTP อะไรก็ผ่าน
    if (otp.length !== 6) { setError('กรอก OTP ให้ครบ 6 หลัก'); return }
    setError('')
    setStep('pin')
    window.scrollTo(0, 0)
  }

  const handleRegister = async () => {
    if (pin.length !== 6) { setError('กรอกรหัสผ่านให้ครบ 6 หลัก'); return }
    if (pin !== pinConfirm) { setError('รหัสผ่านไม่ตรงกัน'); return }
    setLoading(true)
    setError('')
    try {
      const hash = await bcrypt.hash(pin, 10)
      const { data, error: err } = await supabase
        .from('users')
        .insert({ phone, password_hash: hash, credits: 1 })
        .select()
        .single()
      if (err) throw err
      localStorage.setItem('aung_user', JSON.stringify(data))
      router.push('/dashboard')
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#F4F5FB]">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 py-4 flex items-center gap-3">
          <button onClick={() => { if (step === 'phone') { router.push('/login') } else { setStep(s => s === 'otp' ? 'phone' : 'otp'); window.scrollTo(0, 0) } }}
            className="text-white text-xl font-bold">←</button>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Aung" style={{ width: 36, height: 36, objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
            <div>
              <div className="text-white font-black text-lg tracking-wide leading-none">Aung</div>
              <div className="text-white/60 text-xs" style={{fontFamily:'Noto Sans Myanmar'}}>အောင်</div>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-white/60 text-xs">สมัครสมาชิก</div>
            <div className="text-white/40 text-xs" style={{fontFamily:'Noto Sans Myanmar'}}>အကောင့်ဖွင့်</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#1E2D9E]">
          <div className="h-1 bg-white transition-all duration-300"
            style={{width: step==='phone'?'33%':step==='otp'?'66%':'100%'}} />
        </div>

        <div className="px-5 py-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4 text-center">{error}</div>
          )}

          {/* Step 1: Phone */}
          {step === 'phone' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 mb-4 flex gap-2">
                <span>🎁</span>
                <span>สมัครวันนี้รับ <strong>1 เครดิตฟรี!</strong><br/>
                  <span style={{fontFamily:'Noto Sans Myanmar'}}>မှတ်ပုံတင်လျှင် ခရက်ဒစ် ၁ ခု အခမဲ့</span>
                </span>
              </div>
              <div className="text-sm font-bold text-gray-500 mb-1">
                เบอร์มือถือ / <span style={{fontFamily:'Noto Sans Myanmar'}}>ဖုန်းနံပါတ်</span>
              </div>
              <div className={`bg-white rounded-xl border-2 py-3 px-4 text-center text-2xl font-black tracking-widest mb-1 ${phone.length===10?'border-green-500':'border-[#2B3FBE]'}`}>
                {phone ? formatPhone(phone) : <span className="text-gray-300">088-888-8888</span>}
              </div>
              {phone.length===10
                ? <div className="text-green-600 text-xs font-bold text-center mb-4">✓ รูปแบบถูกต้อง · <span style={{fontFamily:'Noto Sans Myanmar'}}>ပုံစံမှန်ပါသည်</span></div>
                : <div className="text-gray-400 text-xs text-center mb-4">{phone.length}/10 หลัก · <span style={{fontFamily:'Noto Sans Myanmar'}}>လုံး</span></div>
              }
              <Numpad onNum={n=>phone.length<10&&setPhone(p=>p+n)} onDel={()=>setPhone(p=>p.slice(0,-1))} onClear={()=>setPhone('')} />
              <div className="flex gap-3 mt-4">
                <button onClick={()=>router.push('/login')} className="flex-[0.8] bg-[#4A4845] text-white rounded-xl py-3 text-sm font-bold">
                  ← กลับ<span className="block text-xs opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>နောက်သို့</span>
                </button>
                <button onClick={handlePhoneNext} disabled={phone.length!==10||loading}
                  className={`flex-[1.2] rounded-xl py-3 text-sm font-bold text-white ${phone.length===10&&!loading?'bg-[#2B3FBE]':'bg-[#2B3FBE] opacity-40 cursor-not-allowed'}`}>
                  ส่ง OTP →<span className="block text-xs opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>OTP ပို့မည်</span>
                </button>
              </div>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-4">
                <div className="text-sm font-bold text-gray-700 mb-1">กรอกรหัส OTP 6 หลัก</div>
                <div className="text-xs text-gray-400 mb-1" style={{fontFamily:'Noto Sans Myanmar'}}>OTP ကုဒ် ၆ လုံး ရိုက်ထည့်ပါ</div>
                <div className="text-xs text-gray-500">ส่งไปที่ · <span style={{fontFamily:'Noto Sans Myanmar'}}>ပို့ဆောင်ခဲ့သည်</span> <strong>{formatPhone(phone)}</strong></div>
              </div>
              <div className="flex justify-center gap-2 mb-2">
                {Array.from({length:6}).map((_,i)=>(
                  <div key={i} className={`w-11 h-13 rounded-xl border-2 flex items-center justify-center text-xl font-black
                    ${i<otp.length?'bg-[#F5E6C0] border-[#C9A84C] text-[#8A6A1E]':i===otp.length?'border-[#2B3FBE]':'border-gray-200 bg-white'}`}>
                    {i<otp.length?otp[i]:''}
                  </div>
                ))}
              </div>
              <div className="text-gray-400 text-xs text-center mb-4">{otp.length}/6 หลัก · <span style={{fontFamily:'Noto Sans Myanmar'}}>လုံး</span></div>
              <Numpad onNum={n=>otp.length<6&&setOtp(p=>p+n)} onDel={()=>setOtp(p=>p.slice(0,-1))} onClear={()=>setOtp('')} />
              <div className="flex gap-3 mt-4">
                <button onClick={()=>{setStep('phone');setOtp('');window.scrollTo(0,0)}} className="flex-[0.8] bg-[#4A4845] text-white rounded-xl py-3 text-sm font-bold">
                  ← กลับ<span className="block text-xs opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>နောက်သို့</span>
                </button>
                <button onClick={handleOtpNext} disabled={otp.length!==6}
                  className={`flex-[1.2] rounded-xl py-3 text-sm font-bold text-white ${otp.length===6?'bg-[#2B3FBE]':'bg-[#2B3FBE] opacity-40 cursor-not-allowed'}`}>
                  ยืนยัน →<span className="block text-xs opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>အတည်ပြု</span>
                </button>
              </div>
            </>
          )}

          {/* Step 3: PIN */}
          {step === 'pin' && (
            <>
              <div className="text-sm font-bold text-gray-500 mb-1">
                ตั้งรหัสผ่าน 6 หลัก / <span style={{fontFamily:'Noto Sans Myanmar'}}>စကားဝှက်</span>
              </div>
              <div className="bg-white rounded-xl border-2 border-[#2B3FBE] py-4 px-4 flex justify-center gap-3 mb-3">
                {Array.from({length:6}).map((_,i)=>(
                  <div key={i} className={`w-4 h-4 rounded-full ${i<pin.length?'bg-[#2B3FBE]':'bg-gray-200'}`} />
                ))}
              </div>
              {pin.length===6 && (
                <>
                  <div className="text-sm font-bold text-gray-500 mb-1 mt-3">ยืนยันรหัสผ่านอีกครั้ง · <span style={{fontFamily:'Noto Sans Myanmar'}}>စကားဝှက် ထပ်မံ အတည်ပြု</span></div>
                  <div className={`bg-white rounded-xl border-2 py-4 px-4 flex justify-center gap-3 mb-3 ${pinConfirm.length===6?(pin===pinConfirm?'border-green-500':'border-red-400'):'border-gray-200'}`}>
                    {Array.from({length:6}).map((_,i)=>(
                      <div key={i} className={`w-4 h-4 rounded-full ${i<pinConfirm.length?(pin.slice(0,i+1)===pinConfirm.slice(0,i+1)?'bg-[#2B3FBE]':'bg-red-400'):'bg-gray-200'}`} />
                    ))}
                  </div>
                </>
              )}
              <Numpad
                onNum={n => {
                  if (pin.length < 6) setPin(p=>p+n)
                  else if (pinConfirm.length < 6) setPinConfirm(p=>p+n)
                }}
                onDel={() => {
                  if (pinConfirm.length > 0) setPinConfirm(p=>p.slice(0,-1))
                  else if (pin.length > 0) setPin(p=>p.slice(0,-1))
                }}
                onClear={() => { setPin(''); setPinConfirm('') }}
              />
              <div className="flex gap-3 mt-4">
                <button onClick={()=>{setStep('otp');setPin('');setPinConfirm('');window.scrollTo(0,0)}} className="flex-[0.8] bg-[#4A4845] text-white rounded-xl py-3 text-sm font-bold">
                  ← กลับ<span className="block text-xs opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>နောက်သို့</span>
                </button>
                <button onClick={handleRegister} disabled={pin.length!==6||pinConfirm.length!==6||pin!==pinConfirm||loading}
                  className={`flex-[1.2] rounded-xl py-3 text-sm font-bold text-white ${pin.length===6&&pinConfirm.length===6&&pin===pinConfirm&&!loading?'bg-green-600':'bg-green-600 opacity-40 cursor-not-allowed'}`}>
                  {loading?'กำลังสมัคร...':'✅ สมัครสมาชิก'}
                  <span className="block text-xs opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>အကောင့်ဖွင့်</span>
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
        <button key={k} onClick={() => k==='⌫'?onDel():k==='ล้าง'?onClear():onNum(k)}
          className={`rounded-xl py-3.5 text-center font-bold text-xl active:scale-95 transition-transform
            ${k==='⌫'?'bg-red-50 text-red-500 text-base':k==='ล้าง'?'bg-gray-100 text-gray-500 text-sm':'bg-white border border-gray-200 text-gray-800'}`}>
          {k}
        </button>
      ))}
    </div>
  )
}

