'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User = { id: string; phone: string; credits: number; avatar_url?: string }

// Resize image file to square, return base64 data URL
function resizeToBase64(file: File, size: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width  = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      // center-crop to square
      const s   = Math.min(img.width, img.height)
      const sx  = (img.width  - s) / 2
      const sy  = (img.height - s) / 2
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

function formatPhone(p: string) {
  const d = p.replace(/\D/g, '')
  if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`
  return p
}

export default function ProfilePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [user,           setUser]           = useState<User | null>(null)
  const [resumeCount,    setResumeCount]    = useState(0)
  const [loading,        setLoading]        = useState(true)
  const [uploadingAvatar,setUploadingAvatar]= useState(false)

  // sheet states
  const [showChangePass, setShowChangePass] = useState(false)
  const [showHowTo,      setShowHowTo]      = useState(false)
  const [showTerms,      setShowTerms]      = useState(false)

  // password change
  const [oldPass,      setOldPass]      = useState('')
  const [newPass,      setNewPass]      = useState('')
  const [confirmPass,  setConfirmPass]  = useState('')
  const [changingPass, setChangingPass] = useState(false)
  const [passMsg,      setPassMsg]      = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (!u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    setUser(parsed)
    loadStats(parsed.id)
    loadAvatar(parsed.id)
  }, [])

  const loadAvatar = async (userId: string) => {
    const { data } = await supabase.from('users').select('avatar_url').eq('id', userId).single()
    if (data?.avatar_url) {
      setUser(prev => prev ? { ...prev, avatar_url: data.avatar_url } : prev)
    }
  }

  const loadStats = async (userId: string) => {
    const { count } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    setResumeCount(count || 0)
    setLoading(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      // Resize + compress to ~150×150 JPEG via canvas
      const avatar_url = await resizeToBase64(file, 150, 0.75)

      // 1. Update UI + localStorage immediately (always works)
      setUser(prev => prev ? { ...prev, avatar_url } : prev)
      const stored = JSON.parse(localStorage.getItem('aung_user') || '{}')
      localStorage.setItem('aung_user', JSON.stringify({ ...stored, avatar_url }))

      // 2. Try saving to Supabase silently (needs avatar_url column in users table)
      //    If column doesn't exist yet, fail silently — photo still shows in session
      supabase.from('users').update({ avatar_url }).eq('id', user.id)
        .then(({ error }) => { if (error) console.warn('avatar DB save skipped:', error.message) })
    } catch (err) {
      console.error('avatar resize failed', err)
      alert('ไม่สามารถอ่านรูปได้ กรุณาลองรูปอื่น')
    } finally {
      setUploadingAvatar(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleChangePassword = async () => {
    setPassMsg(null)
    if (!newPass || !oldPass) { setPassMsg({ ok: false, text: 'กรุณากรอกรหัสผ่านให้ครบ' }); return }
    if (newPass !== confirmPass) { setPassMsg({ ok: false, text: 'รหัสผ่านใหม่ไม่ตรงกัน' }); return }
    if (newPass.length < 6)     { setPassMsg({ ok: false, text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัว' }); return }
    setChangingPass(true)
    try {
      // Verify old password first
      const { data: found } = await supabase
        .from('users')
        .select('id')
        .eq('id', user!.id)
        .eq('password', oldPass)
        .single()
      if (!found) { setPassMsg({ ok: false, text: 'รหัสผ่านเดิมไม่ถูกต้อง' }); return }
      const { error } = await supabase.from('users').update({ password: newPass }).eq('id', user!.id)
      if (error) throw error
      setPassMsg({ ok: true, text: 'เปลี่ยนรหัสผ่านสำเร็จ ✅' })
      setOldPass(''); setNewPass(''); setConfirmPass('')
    } catch {
      setPassMsg({ ok: false, text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setChangingPass(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('aung_user')
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 pt-4 pb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1">
              <div className="text-white font-black text-lg leading-none">โปรไฟล์</div>
              <div className="text-white/60 text-xs" style={{fontFamily:'Noto Sans Myanmar'}}>ကိုယ်ရေးအချက်အလက်</div>
            </div>
            <div className="text-right">
              <div className="text-white font-black text-sm leading-none">Aung</div>
              <div className="text-white/50 text-xs" style={{fontFamily:'Noto Sans Myanmar'}}>အောင်</div>
            </div>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            {/* Tappable avatar */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/40 flex items-center justify-center flex-shrink-0 active:opacity-80"
            >
              {user.avatar_url
                ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl">👤</span>
              }
              {/* overlay camera icon */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-white text-lg">{uploadingAvatar ? '⏳' : '📷'}</span>
              </div>
              {/* always-visible camera badge */}
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#C9A84C] rounded-tl-lg flex items-center justify-center">
                <span style={{ fontSize: 10 }}>{uploadingAvatar ? '…' : '📷'}</span>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            <div>
              <div className="text-white font-black text-lg">{formatPhone(user.phone)}</div>
              <div className="text-white/70 text-xs mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>ဖုန်းနံပါတ်</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">⭐ {user.credits} เครดิต · <span style={{fontFamily:'Noto Sans Myanmar'}} className="font-normal">ခရက်ဒစ်</span></span>
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">📄 {loading ? '…' : resumeCount} <span style={{fontFamily:'Noto Sans Myanmar'}} className="font-normal">Resume</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats — 2 cols only */}
        <div className="px-4 -mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 grid grid-cols-2 divide-x divide-gray-100 overflow-hidden shadow-sm">
            {[
              { label: 'เครดิต · ခရက်ဒစ်', value: user.credits, icon: '⭐' },
              { label: 'เรซูเม่ · Resume', value: loading ? '…' : resumeCount, icon: '📄' },
            ].map(s => (
              <div key={s.label} className="py-3 flex flex-col items-center gap-0.5">
                <div className="text-lg">{s.icon}</div>
                <div className="text-base font-black text-gray-800">{s.value}</div>
                <div className="text-xs text-gray-400 text-center px-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top-up CTA */}
        <div className="px-4 mt-4">
          <button onClick={() => router.push('/topup')}
            className="w-full bg-[#C9A84C] rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm active:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center text-2xl flex-shrink-0">⭐</div>
            <div className="flex-1 text-left">
              <div className="text-white font-black text-base leading-none">เติมเครดิต</div>
              <div className="text-white/75 text-xs mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>ခရက်ဒစ်ဖြည့်ရန်</div>
            </div>
            <div className="bg-white/20 rounded-full px-3 py-1.5 flex items-center gap-1">
              <span className="text-white text-sm font-black">{user.credits}</span>
              <span className="text-white/80 text-xs">เครดิต · <span style={{fontFamily:'Noto Sans Myanmar'}}>ခရက်ဒစ်</span></span>
            </div>
            <span className="text-white font-black text-lg ml-1">→</span>
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 px-4 py-5 pb-24 space-y-4">

          {/* บัญชี */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">บัญชี / အကောင့်</div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
              <button onClick={() => { setPassMsg(null); setShowChangePass(true) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 text-left">
                <span className="text-lg flex-shrink-0">🔑</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-800">เปลี่ยนรหัสผ่าน</div>
                  <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>စကားဝှက်ပြောင်းရန်</div>
                </div>
                <span className="text-gray-300 font-bold">›</span>
              </button>
            </div>
          </div>

          {/* ความช่วยเหลือ */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">ความช่วยเหลือ / အကူအညီ</div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
              {[
                { icon: '💬', label: 'ติดต่อเรา', mm: 'ကျွန်ုပ်တို့ဆက်သွယ်ရန်', action: () => router.push('/chat') },
                { icon: '❓', label: 'วิธีใช้งาน', mm: 'အသုံးပြုနည်း', action: () => setShowHowTo(true) },
                { icon: '📋', label: 'เงื่อนไขการใช้งาน & PDPA', mm: 'သတ်မှတ်ချက်နှင့် ကိုယ်ရေးအချက်', action: () => setShowTerms(true) },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 text-left">
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{item.mm}</div>
                  </div>
                  <span className="text-gray-300 font-bold">›</span>
                </button>
              ))}
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="w-full bg-red-50 border border-red-200 text-red-500 font-bold rounded-2xl py-4 text-sm">
            ออกจากระบบ
            <div className="text-xs font-normal opacity-70 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>အကောင့်ထွက်မည်</div>
          </button>
        </div>

        {/* Bottom Nav */}
        <BottomNav active="profile" router={router} />
      </div>

      {/* ── Change Password Sheet ── */}
      {showChangePass && (
        <Sheet title="เปลี่ยนรหัสผ่าน" titleMM="စကားဝှက်ပြောင်းရန်" onClose={() => setShowChangePass(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">รหัสผ่านเดิม · <span style={{fontFamily:'Noto Sans Myanmar'}}>မူရင်း စကားဝှက်</span></label>
              <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)}
                placeholder="••••••" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2B3FBE]" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">รหัสผ่านใหม่ · <span style={{fontFamily:'Noto Sans Myanmar'}}>စကားဝှက်အသစ်</span></label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                placeholder="••••••" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2B3FBE]" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">ยืนยันรหัสผ่านใหม่ · <span style={{fontFamily:'Noto Sans Myanmar'}}>စကားဝှက်အသစ် အတည်ပြု</span></label>
              <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                placeholder="••••••" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2B3FBE]" />
            </div>
            {passMsg && (
              <div className={`text-xs font-bold px-3 py-2 rounded-xl ${passMsg.ok ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {passMsg.text}
              </div>
            )}
            <button onClick={handleChangePassword} disabled={changingPass}
              className="w-full bg-[#2B3FBE] text-white font-bold rounded-xl py-3 text-sm disabled:opacity-60 mt-1 flex flex-col items-center leading-tight">
              <span>{changingPass ? '⏳ กำลังบันทึก...' : '🔑 บันทึกรหัสผ่านใหม่'}</span>
              <span className="text-[10px] font-normal opacity-80" style={{fontFamily:'Noto Sans Myanmar'}}>{changingPass ? 'သိမ်းနေ...' : 'စကားဝှက်အသစ် သိမ်းမည်'}</span>
            </button>
          </div>
        </Sheet>
      )}

      {/* ── How-To Sheet ── */}
      {showHowTo && (
        <Sheet title="วิธีใช้งาน" titleMM="အသုံးပြုနည်း" onClose={() => setShowHowTo(false)}>
          <div className="space-y-4 text-sm text-gray-700">
            {[
              { step: '1', icon: '📝', th: 'สร้างเรซูเม่', mm: 'Resume ပြုလုပ်ခြင်း', desc: 'กดปุ่ม + สร้างใหม่ กรอกข้อมูลส่วนตัว ทักษะ และประวัติการทำงาน ใช้ 1 เครดิตต่อเรซูเม่' },
              { step: '2', icon: '🤖', th: 'AI สร้างชุดสูท', mm: 'AI Suit ပြုလုပ်ခြင်း', desc: 'ถ่ายรูปหน้าตรง AI จะตัดต่อใส่ชุดสูทให้อัตโนมัติ ใช้เวลาประมาณ 1–3 นาที' },
              { step: '3', icon: '📤', th: 'แชร์หรือบันทึก', mm: 'မျှဝေ / သိမ်းဆည်းခြင်း', desc: 'เปิดโหมดสาธารณะเพื่อให้นายจ้างค้นหาได้ หรือบันทึกเป็นรูปภาพส่งเองได้เลย' },
              { step: '4', icon: '⭐', th: 'เติมเครดิต', mm: 'ခရက်ဒစ်ဖြည့်ခြင်း', desc: 'เครดิตซื้อครั้งเดียวใช้ได้ตลอด ไม่มีค่าสมัครรายเดือน กดเติมได้ที่ปุ่ม + เติม' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8EBFF] flex items-center justify-center text-sm font-black text-[#2B3FBE] flex-shrink-0">{s.step}</div>
                <div>
                  <div className="font-black text-gray-800">{s.icon} {s.th}</div>
                  <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'Noto Sans Myanmar' }}>{s.mm}</div>
                  <div className="text-xs text-gray-600 leading-relaxed">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Sheet>
      )}

      {/* ── Terms & PDPA Sheet ── */}
      {showTerms && (
        <Sheet title="เงื่อนไขการใช้งาน & PDPA" titleMM="သတ်မှတ်ချက်နှင့် ကိုယ်ရေးအချက်" onClose={() => setShowTerms(false)}>
          <div className="space-y-4 text-xs text-gray-600 leading-relaxed">

            <section>
              <div className="font-black text-sm text-gray-800 mb-1">📋 เงื่อนไขการใช้งาน</div>
              <p>แอป Aung ให้บริการสร้างเรซูเม่ดิจิทัลและจัดหางานสำหรับแรงงานข้ามชาติในประเทศไทย การใช้งานแอปหมายความว่าท่านยอมรับเงื่อนไขเหล่านี้</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>เครดิตที่ซื้อแล้วไม่สามารถคืนเป็นเงินสดได้</li>
                <li>ผู้ใช้ต้องรับผิดชอบต่อความถูกต้องของข้อมูลที่กรอก</li>
                <li>ห้ามใช้แอปเพื่อวัตถุประสงค์ที่ผิดกฎหมาย</li>
                <li>เราขอสงวนสิทธิ์ระงับบัญชีที่ละเมิดเงื่อนไข</li>
              </ul>
            </section>

            <div className="border-t border-gray-100" />

            <section>
              <div className="font-black text-sm text-gray-800 mb-1">🔒 นโยบายความเป็นส่วนตัว (PDPA)</div>
              <p className="text-[10px] text-gray-400 mb-2" style={{ fontFamily: 'Noto Sans Myanmar' }}>ကိုယ်ရေးအချက်အလက် ကာကွယ်ရေးမူဝါဒ</p>

              <div className="font-bold text-gray-700 mb-1">ข้อมูลที่เก็บรวบรวม (ม.23)</div>
              <ul className="list-disc pl-4 space-y-0.5 mb-3">
                <li>ชื่อ วันเกิด เพศ เชื้อชาติ จังหวัด</li>
                <li>เบอร์โทรศัพท์และรหัสผ่าน</li>
                <li>ข้อมูลทักษะและประวัติการทำงาน</li>
                <li>รูปถ่ายหน้าตรง</li>
                <li>หมายเลข Smart Card และบัญชีธนาคาร</li>
              </ul>

              <div className="font-bold text-gray-700 mb-1">วัตถุประสงค์การใช้ข้อมูล</div>
              <ul className="list-disc pl-4 space-y-0.5 mb-3">
                <li>สร้างและแสดงเรซูเม่ให้นายจ้าง</li>
                <li>สร้างรูปภาพชุดสูทด้วย AI</li>
                <li>จัดหางานที่เหมาะสม</li>
              </ul>

              <div className="font-bold text-gray-700 mb-1">ระยะเวลาเก็บข้อมูล</div>
              <p className="mb-3">เก็บข้อมูลไว้ <span className="font-black text-gray-800">2 ปี</span> นับจากวันลงทะเบียน หรือจนกว่าท่านจะขอลบบัญชี</p>

              <div className="font-bold text-gray-700 mb-1">ผู้ควบคุมข้อมูล</div>
              <p className="mb-3">บริษัท Aung (อองค์) เป็นผู้ควบคุมข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562</p>

              <div className="font-bold text-gray-700 mb-1">สิทธิ์ของท่าน (ม.30–37)</div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>สิทธิ์เข้าถึงและรับสำเนาข้อมูล (ม.30)</li>
                <li>สิทธิ์แก้ไขข้อมูลที่ไม่ถูกต้อง (ม.35)</li>
                <li>สิทธิ์ลบหรือทำลายข้อมูล (ม.33)</li>
                <li>สิทธิ์คัดค้านการประมวลผล (ม.36)</li>
                <li>สิทธิ์ระงับการใช้ข้อมูล (ม.34)</li>
              </ul>
              <p className="mt-3 text-gray-500">ใช้สิทธิ์ได้โดยติดต่อผ่านเมนู <span className="font-bold">💬 ติดต่อเรา</span></p>
            </section>
          </div>
        </Sheet>
      )}
    </div>
  )
}

// ── Reusable bottom sheet ────────────────────────────────────────────────────
function Sheet({ title, titleMM, onClose, children }: {
  title: string; titleMM: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-t-3xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        {/* Header */}
        <div className="flex items-center gap-2 px-5 pb-3 flex-shrink-0">
          <div className="flex-1">
            <div className="font-black text-gray-800 text-base">{title}</div>
            <div className="text-xs text-gray-400" style={{ fontFamily: 'Noto Sans Myanmar' }}>{titleMM}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">✕</button>
        </div>
        <div className="border-t border-gray-100 flex-shrink-0" />
        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 py-4 pb-8">
          {children}
        </div>
      </div>
    </div>
  )
}

function BottomNav({ active, router }: { active: string; router: ReturnType<typeof useRouter> }) {
  const items = [
    { icon: '📄', label: 'เรซูเม่',  mm: 'Resume',   key: 'resume',  path: '/dashboard' },
    { icon: '📢', label: 'งาน',     mm: 'အလုပ်',    key: 'jobs',    path: '/jobs' },
    { icon: '💬', label: 'แชท',     mm: 'ချက်တ်',   key: 'chat',    path: '/chat' },
    { icon: '👤', label: 'โปรไฟล์', mm: 'ပရိုဖိုင်', key: 'profile', path: '/profile' },
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center bg-white border-t border-gray-100">
      <div className="w-full max-w-sm flex px-3 py-2 pb-4">
        {items.map(item => (
          <button key={item.key} onClick={() => router.push(item.path)}
            className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-lg leading-none">{item.icon}</span>
            <span className={`text-xs font-bold leading-tight ${active === item.key ? 'text-[#2B3FBE]' : 'text-gray-400'}`}>{item.label}</span>
            <span className={`text-[9px] leading-none ${active === item.key ? 'text-[#2B3FBE]/70' : 'text-gray-400/70'}`} style={{fontFamily:'Noto Sans Myanmar'}}>{item.mm}</span>
            {active === item.key && <div className="w-1 h-1 rounded-full bg-[#2B3FBE] mt-0.5" />}
          </button>
        ))}
      </div>
    </div>
  )
}
