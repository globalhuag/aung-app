'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Job = {
  id: string
  title: string
  company: string
  job_type: string
  province: string
  salary_min: number
  salary_max: number
  description: string
  contact: string
  created_at: string
  is_active: boolean
}

const JOB_TYPE_FILTERS = ['ทั้งหมด', 'โรงงาน', 'ก่อสร้าง', 'เกษตร/ประมง', 'แม่บ้าน/ดูแลผู้สูงอายุ', 'ร้านอาหาร/บริการ', 'ขับรถ/ส่งของ', 'อื่นๆ']

const JOB_ICONS: Record<string, string> = {
  'โรงงาน': '🏭',
  'ก่อสร้าง': '🏗️',
  'เกษตร/ประมง': '🌾',
  'แม่บ้าน/ดูแลผู้สูงอายุ': '🏠',
  'ร้านอาหาร/บริการ': '🍽️',
  'ขับรถ/ส่งของ': '🚚',
  'ช่างซ่อม/อิเล็กทรอนิกส์': '🔧',
  'อื่นๆ': '💼',
}

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ทั้งหมด')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (!u) { router.push('/login'); return }
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

  const filtered = jobs.filter(j => {
    const matchType = filter === 'ทั้งหมด' || j.job_type === filter
    const matchSearch = search === '' ||
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.company?.toLowerCase().includes(search.toLowerCase()) ||
      j.province?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const fmt = (n: number) => n?.toLocaleString('th-TH') || '?'

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')}
            className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            ←
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base">ประกาศงาน</div>
            <div className="text-white/70 text-xs" style={{ fontFamily: 'Noto Sans Myanmar' }}>အလုပ်ကြော်ငြာများ</div>
          </div>
          <div className="bg-white/20 rounded-full px-3 py-1 text-white text-xs font-bold">
            {filtered.length} งาน
          </div>
        </div>

        {/* Search */}
        <div className="bg-white px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหางาน บริษัท จังหวัด..."
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2B3FBE] bg-[#F4F5FB]"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="bg-white border-b border-gray-100 px-3 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {JOB_TYPE_FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filter === f ? 'bg-[#2B3FBE] text-white' : 'bg-gray-100 text-gray-500'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Job list */}
        <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🔍</div>
              <div className="text-sm font-bold text-gray-700">ไม่พบประกาศงาน</div>
              <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Noto Sans Myanmar' }}>အလုပ်ကြော်ငြာ မတွေ့ပါ</div>
            </div>
          ) : (
            filtered.map(job => (
              <div key={job.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#E8EBFF] flex items-center justify-center text-xl flex-shrink-0">
                      {JOB_ICONS[job.job_type] || '💼'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-gray-800 leading-tight">{job.title || 'รับสมัครงาน'}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-semibold">{job.company || 'บริษัท'}</div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="bg-[#E8EBFF] text-[#2B3FBE] text-xs font-bold px-2 py-0.5 rounded-full">{job.job_type}</span>
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">📍 {job.province}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-black text-green-600">{fmt(job.salary_min)}</div>
                      {job.salary_max > job.salary_min && (
                        <div className="text-xs text-gray-400">ถึง {fmt(job.salary_max)}</div>
                      )}
                      <div className="text-xs text-gray-400">บาท/เดือน</div>
                    </div>
                  </div>

                  {/* Expand/collapse */}
                  {expanded === job.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {job.description && (
                        <div className="text-xs text-gray-600 leading-relaxed mb-2">{job.description}</div>
                      )}
                      {job.contact && (
                        <div className="bg-[#E8EBFF] rounded-xl px-3 py-2 text-xs">
                          <span className="font-bold text-[#2B3FBE]">📞 ติดต่อ: </span>
                          <span className="text-gray-700">{job.contact}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 flex">
                  <button onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                    className="flex-1 py-2.5 text-xs font-bold text-gray-500 border-r border-gray-100">
                    {expanded === job.id ? '▲ ย่อ' : '▼ ดูเพิ่ม'}
                  </button>
                  <a href={`tel:${job.contact}`}
                    className="flex-1 py-2.5 text-xs font-bold text-[#2B3FBE] text-center">
                    📞 โทรสมัคร
                  </a>
                </div>
              </div>
            ))
          )}
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
