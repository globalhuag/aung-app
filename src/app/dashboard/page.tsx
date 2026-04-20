'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User   = { id: string; phone: string; credits: number }

function formatPhone(p: string) {
  const d = p.replace(/\D/g, '')
  if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`
  return p
}
type Resume = { id: string; name: string; job_type: string; province: string; suit_status: string; is_public: boolean; created_at: string; photo_url: string; suit_photo_url: string }

export default function DashboardPage() {
  const router = useRouter()
  const [user,    setUser]    = useState<User|null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [toast,   setToast]   = useState('')       // notification text
  const pollRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userIdRef = useRef('')

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (!u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    setUser(parsed)
    userIdRef.current = parsed.id
    loadFreshData(parsed.id)

    return () => { if (pollRef.current) clearTimeout(pollRef.current) }
  }, [])

  // Auto-poll every 5s while any resume is pending/processing
  const schedulePoll = (userId: string) => {
    if (pollRef.current) clearTimeout(pollRef.current)
    pollRef.current = setTimeout(() => pollStatus(userId), 5000)
  }

  const pollStatus = async (userId: string) => {
    const { data } = await supabase
      .from('resumes')
      .select('id, suit_status, name')
      .eq('user_id', userId)

    if (!data) return

    const stillProcessing = data.some(r => r.suit_status === 'pending' || r.suit_status === 'processing')
    const justDone        = data.find(r => r.suit_status === 'done')

    // Refresh full resume list to pick up new statuses
    setResumes(prev => {
      const prevPending = prev.some(r => r.suit_status === 'pending' || r.suit_status === 'processing')
      const nowDone     = data.find(r => {
        const old = prev.find(p => p.id === r.id)
        return old && (old.suit_status === 'pending' || old.suit_status === 'processing') && r.suit_status === 'done'
      })
      if (nowDone) {
        setToast(`✅ ชุดสูทของ ${nowDone.name || 'คนงาน'} สร้างเสร็จแล้ว!`)
        setTimeout(() => setToast(''), 5000)
      }
      return prev
    })

    // Reload full list
    const { data: full } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (full) setResumes(full)

    // Keep polling if still processing
    if (stillProcessing) schedulePoll(userId)
  }

  const loadFreshData = async (userId: string) => {
    const [{ data: freshUser }, { data: resumeData }] = await Promise.all([
      supabase.from('users').select('id, phone, credits').eq('id', userId).single(),
      supabase.from('resumes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ])
    if (freshUser) {
      setUser(freshUser as User)
      localStorage.setItem('aung_user', JSON.stringify({ ...JSON.parse(localStorage.getItem('aung_user') || '{}'), ...freshUser }))
    }
    const list = resumeData || []
    setResumes(list)
    setLoading(false)

    // Start polling if any resume is pending/processing
    if (list.some((r: Resume) => r.suit_status === 'pending' || r.suit_status === 'processing')) {
      schedulePoll(userId)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('aung_user')
    router.push('/login')
  }

  const togglePublic = async (resume: Resume) => {
    await supabase.from('resumes').update({ is_public: !resume.is_public }).eq('id', resume.id)
    setResumes(rs => rs.map(r => r.id === resume.id ? {...r, is_public: !r.is_public} : r))
  }

  const deleteResume = async (id: string) => {
    if (!confirm('ลบเรซูเม่นี้?')) return
    await supabase.from('resumes').delete().eq('id', id)
    setResumes(rs => rs.filter(r => r.id !== id))
  }

  if (!user) return null

  const noCredit = user.credits <= 0

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#F4F5FB]">
      <div className="w-full max-w-sm">

        {/* Toast notification */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-lg animate-bounce max-w-xs text-center">
            {toast}
          </div>
        )}

        {/* Header: โลโก้ + ชื่อแอพ */}
        <div className="bg-[#2B3FBE] px-4 py-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Aung" className="w-10 h-10 flex-shrink-0 rounded-2xl" style={{ mixBlendMode: 'multiply' }} />
          <div>
            <div className="text-white font-black text-xl tracking-wide leading-none">Aung</div>
            <div className="text-white/60 text-xs" style={{fontFamily:'Noto Sans Myanmar'}}>အောင်</div>
          </div>
        </div>

        {/* User bar: ชื่อ + เครดิต */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400 font-semibold">สวัสดี / <span style={{fontFamily:'Noto Sans Myanmar'}}>မင်္ဂလာပါ</span></div>
            <div className="text-base font-extrabold text-gray-800 truncate">{formatPhone(user.phone)}</div>
          </div>
          <button onClick={() => router.push('/topup')}
            className="flex items-center rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
            <div className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 ${noCredit ? 'bg-red-50 text-red-500' : 'bg-[#E8EBFF] text-[#2B3FBE]'}`}>
              ⭐ {user.credits} เครดิต
            </div>
            <div className="px-2.5 py-1.5 bg-[#C9A84C] text-white text-xs font-extrabold">+ เติม</div>
          </button>
        </div>

        {/* Resume section */}
        <div className="px-4 py-4 pb-24">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold text-gray-800">เรซูเม่ของฉัน</div>
              <div className="text-xs text-gray-400" style={{fontFamily:'Noto Sans Myanmar'}}>ကျွန်ုပ်၏ Resume များ</div>
            </div>
            <button
              onClick={() => noCredit ? router.push('/topup') : router.push('/resume/create')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white ${noCredit ? 'bg-[#C9A84C]' : 'bg-[#2B3FBE]'}`}>
              {noCredit ? '⚡ เติมเครดิต' : '+ สร้างใหม่'}
            </button>
          </div>

          {/* Processing banner — shown while suit generating */}
          {resumes.some(r => r.suit_status === 'pending' || r.suit_status === 'processing') && (
            <div className="mb-3 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#2B3FBE,#6a11cb)', boxShadow: '0 4px 18px rgba(43,63,190,0.35)' }}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* spinning gear */}
                <span className="inline-block animate-spin text-2xl flex-shrink-0" style={{ animationDuration: '1.2s' }}>⚙️</span>
                <div className="flex-1">
                  <div className="text-white font-black text-sm animate-pulse">กำลังสร้างชุดสูทด้วย AI...</div>
                  <div className="text-white/70 text-xs mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>AI ဖြင့် suit ပြုလုပ်နေပါသည် — ခဏစောင့်ပါ</div>
                </div>
                {/* ping dot */}
                <span className="relative flex h-3 w-3 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">กำลังโหลด...<div className="text-xs mt-1" style={{fontFamily:'Noto Sans Myanmar'}}>ဆောင်ရွက်နေသည်</div></div>
          ) : resumes.length === 0 ? (
            /* Empty state */
            <div className="text-center py-10">
              <div className="text-5xl mb-3">📄</div>
              <div className="text-sm font-bold text-gray-700 mb-1">ยังไม่มีเรซูเม่</div>
              <div className="text-xs text-gray-400 mb-1">สร้างเรซูเม่แรกได้เลย ใช้ 1 เครดิต</div>
              <div className="text-xs text-gray-400 mb-5" style={{fontFamily:'Noto Sans Myanmar'}}>Resume ပထမဆုံး ပြုလုပ်ပါ</div>
              {!noCredit && (
                <button onClick={() => router.push('/resume/create')}
                  className="bg-[#2B3FBE] text-white rounded-xl px-8 py-3 text-sm font-bold">
                  + สร้างเรซูเม่เลย
                  <span className="block text-xs opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>Resume ပြုလုပ်မည်</span>
                </button>
              )}
            </div>
          ) : (
            /* Resume cards */
            resumes.map(r => {
              const photoSrc = r.suit_photo_url || r.photo_url || ''
              const accentColor = r.suit_status==='done' ? '#16a34a' : r.suit_status==='error' ? '#dc2626' : r.suit_status==='processing' ? '#2B3FBE' : '#d97706'
              return (
              <div key={r.id} className="bg-white rounded-2xl mb-3 overflow-hidden"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderLeft: `4px solid ${accentColor}` }}>
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#E8EBFF] flex items-center justify-center text-xl flex-shrink-0 border border-gray-100">
                    {photoSrc
                      ? <img src={photoSrc} alt={r.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 20%' }} />
                      : (r.job_type?.includes('หญิง') ? '👩' : '👨')
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800 truncate">{r.name || 'ไม่ระบุชื่อ'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{r.job_type} · {r.province} · {new Date(r.created_at).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'})}</div>
                  </div>
                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    {(r.suit_status === 'processing' || r.suit_status === 'pending') ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#2B3FBE] text-white flex items-center gap-1 animate-pulse">
                        <span className="inline-block animate-spin" style={{ animationDuration: '1.2s' }}>⚙️</span>
                        {r.suit_status === 'processing' ? 'กำลังสร้าง' : 'รอดำเนินการ'}
                      </span>
                    ) : (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.suit_status==='done'?'bg-green-50 text-green-600':'bg-red-50 text-red-500'}`}>
                        {r.suit_status==='done'?'✓ สูทเสร็จ · ပြုလုပ်ပြီး':'✕ ผิดพลาด · အမှား'}
                      </span>
                    )}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.is_public?'bg-blue-50 text-blue-600':'bg-gray-100 text-gray-500'}`}>
                      {r.is_public?'🌐 สาธารณะ':'🔒 ส่วนตัว'}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-100 flex">
                  <button onClick={() => router.push(`/resume/${r.id}`)} className="flex-1 py-2 text-xs font-bold text-[#2B3FBE] border-r border-gray-100">⬇️ ดู<span className="block text-gray-400 font-normal" style={{fontFamily:'Noto Sans Myanmar',fontSize:'9px'}}>ကြည့်မည်</span></button>
                  <button onClick={() => togglePublic(r)} className="flex-1 py-2 text-xs font-bold text-gray-500 border-r border-gray-100">
                    {r.is_public?'🔒':'🌐'}
                  </button>
                  <button onClick={() => deleteResume(r.id)} className="flex-1 py-2 text-xs font-bold text-red-400">🗑️</button>
                </div>
              </div>
            )})
          )}
        </div>

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center bg-white border-t border-gray-100">
          <div className="w-full max-w-sm flex px-3 py-2 pb-4">
            {[
              {icon:'📄', label:'เรซูเม่', active:true, path:'/dashboard'},
              {icon:'📢', label:'งาน', active:false, path:'/jobs'},
              {icon:'💬', label:'แชท', active:false, path:'/chat'},
              {icon:'👤', label:'โปรไฟล์', active:false, path:'/profile'},
            ].map(item => (
              <button key={item.label} onClick={() => router.push(item.path)}
                className="flex-1 flex flex-col items-center gap-0.5">
                <span className="text-lg">{item.icon}</span>
                <span className={`text-xs font-bold ${item.active ? 'text-[#2B3FBE]' : 'text-gray-400'}`}>{item.label}</span>
                {item.active && <div className="w-1 h-1 rounded-full bg-[#2B3FBE]" />}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

