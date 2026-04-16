'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User = { id: string; phone: string; credits: number }
type Job = {
  id: string
  title: string
  title_mm: string
  job_type: string
  province: string
  salary: string
  description: string
  contact_phone: string
  is_active: boolean
  created_at: string
}

export default function JobsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    loadJobs()
  }, [])

  const loadJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setJobs(data || [])
    setLoading(false)
  }

  const JOB_TYPES = ['โรงงาน', 'ก่อสร้าง', 'แม่บ้าน', 'พนักงานขาย', 'ขับรถ/ส่งของ', 'เกษตร']

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchSearch = !q || j.title?.toLowerCase().includes(q) || j.province?.toLowerCase().includes(q) || j.job_type?.toLowerCase().includes(q)
    const matchType = !filterType || j.job_type === filterType
    return matchSearch && matchType
  })

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 py-3">
          <div className="text-white font-black text-base mb-0.5">ประกาศงาน</div>
          <div className="text-white/70 text-xs" style={{ fontFamily: 'Noto Sans Myanmar' }}>အလုပ်ကြော်ငြာများ</div>
        </div>

        {/* Search + Filter */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 bg-[#F4F5FB] rounded-xl px-3 py-2.5">
            <span className="text-gray-400">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหางาน... / အလုပ်ရှာမည်..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setFilterType('')}
              className={`flex-shrink-0 rounded-full border-2 px-3 py-1 text-xs font-bold transition-all ${!filterType ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
              ทั้งหมด
            </button>
            {JOB_TYPES.map(t => (
              <button key={t} onClick={() => setFilterType(filterType === t ? '' : t)}
                className={`flex-shrink-0 rounded-full border-2 px-3 py-1 text-xs font-bold transition-all ${filterType === t ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Job list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📢</div>
              <div className="text-sm font-bold text-gray-600">ยังไม่มีประกาศงาน</div>
              <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Noto Sans Myanmar' }}>အလုပ်ကြော်ငြာ မရှိသေးပါ</div>
            </div>
          ) : filtered.map(j => (
            <div key={j.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <button onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                className="w-full px-4 py-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8EBFF] flex items-center justify-center text-lg flex-shrink-0">
                    {j.job_type === 'โรงงาน' ? '🏭' : j.job_type === 'ก่อสร้าง' ? '🏗️' : j.job_type === 'แม่บ้าน' ? '🏠' : j.job_type === 'เกษตร' ? '🌾' : j.job_type === 'ขับรถ/ส่งของ' ? '🚚' : '💼'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-gray-800">{j.title || j.job_type}</div>
                    {j.title_mm && <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{j.title_mm}</div>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {j.job_type && <span className="text-xs bg-[#E8EBFF] text-[#2B3FBE] font-bold px-2 py-0.5 rounded-full">{j.job_type}</span>}
                      {j.province && <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">📍 {j.province}</span>}
                      {j.salary && <span className="text-xs bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">💰 {j.salary}</span>}
                    </div>
                  </div>
                  <span className="text-gray-400 font-bold">{expanded === j.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expanded === j.id && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                  {j.description && (
                    <p className="text-xs text-gray-600 leading-relaxed">{j.description}</p>
                  )}
                  {j.contact_phone && (
                    <a href={`tel:${j.contact_phone}`}
                      className="flex items-center justify-center gap-2 bg-[#C9A84C] text-white rounded-xl py-3 font-extrabold text-sm">
                      📞 โทรสมัคร {j.contact_phone}
                      <span style={{ fontFamily: 'Noto Sans Myanmar' }} className="text-xs font-normal opacity-80">ဖုန်းဆက်မည်</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Nav */}
        <BottomNav active="jobs" router={router} />
      </div>
    </div>
  )
}

function BottomNav({ active, router }: { active: string; router: ReturnType<typeof useRouter> }) {
  const items = [
    { icon: '📄', label: 'เรซูเม่', key: 'resume', path: '/dashboard' },
    { icon: '📢', label: 'งาน', key: 'jobs', path: '/jobs' },
    { icon: '💬', label: 'แชท', key: 'chat', path: '/chat' },
    { icon: '👤', label: 'โปรไฟล์', key: 'profile', path: '/profile' },
  ]
  return (
    <div className="bg-white border-t border-gray-100 flex px-3 py-2 pb-4 sticky bottom-0">
      {items.map(item => (
        <button key={item.key} onClick={() => router.push(item.path)}
          className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-lg">{item.icon}</span>
          <span className={`text-xs font-bold ${active === item.key ? 'text-[#2B3FBE]' : 'text-gray-400'}`}>{item.label}</span>
          {active === item.key && <div className="w-1 h-1 rounded-full bg-[#2B3FBE]" />}
        </button>
      ))}
    </div>
  )
}
