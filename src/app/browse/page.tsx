'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Resume = {
  id: string; name: string; want_job: string; province: string;
  skills: string; want_salary: string; gender: string; race: string;
  is_public: boolean; created_at: string;
}

const PROVINCES = [
  '', 'กรุงเทพมหานคร', 'เชียงใหม่', 'สมุทรปราการ', 'นนทบุรี', 'ปทุมธานี',
  'อยุธยา', 'ชลบุรี', 'ระยอง', 'นครราชสีมา', 'ขอนแก่น', 'อื่นๆ',
]
const JOB_TYPES = [
  '', 'ก่อสร้าง', 'เกษตร', 'โรงงาน', 'ร้านอาหาร', 'แม่บ้าน',
  'ดูแลผู้สูงอายุ', 'ขับรถ', 'อื่นๆ',
]

export default function BrowsePage() {
  const router = useRouter()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterProvince, setFilterProvince] = useState('')
  const [filterJobType, setFilterJobType] = useState('')

  useEffect(() => { loadResumes() }, [])

  const loadResumes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('resumes')
      .select('id,name,want_job,province,skills,want_salary,gender,race,is_public,created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    setResumes((data || []) as Resume[])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return resumes.filter(r => {
      const q = search.toLowerCase()
      const matchSearch = !q || (
        r.name?.toLowerCase().includes(q) ||
        r.want_job?.toLowerCase().includes(q) ||
        r.skills?.toLowerCase().includes(q) ||
        r.province?.toLowerCase().includes(q)
      )
      const matchProvince = !filterProvince || r.province === filterProvince
      const matchJobType = !filterJobType || r.want_job?.includes(filterJobType)
      return matchSearch && matchProvince && matchJobType
    })
  }, [resumes, search, filterProvince, filterJobType])

  const selectCls = 'flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-[#C9A84C] text-gray-700'

  return (
    <div className="min-h-screen bg-[#F4F5FB]">

      {/* Gold header */}
      <div className="bg-[#C9A84C] px-4 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <div className="text-white font-extrabold text-xl leading-snug">
            ค้นหาแรงงาน
          </div>
          <div className="text-white font-extrabold text-base" style={{ fontFamily: 'Noto Sans Myanmar, sans-serif' }}>
            အလုပ်သမားရှာဖွေ
          </div>
          <div className="text-white/70 text-xs mt-1">เรซูเม่ที่เผยแพร่สาธารณะ</div>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-3">

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 -mt-4 mb-4 flex flex-col gap-2 shadow-sm">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 ค้นหาชื่อ, งาน, ทักษะ..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#C9A84C]"
          />
          <div className="flex gap-2">
            <select value={filterJobType} onChange={e => setFilterJobType(e.target.value)} className={selectCls}>
              <option value="">ประเภทงานทั้งหมด</option>
              {JOB_TYPES.filter(Boolean).map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)} className={selectCls}>
              <option value="">ทุกจังหวัด</option>
              {PROVINCES.filter(Boolean).map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          {(search || filterProvince || filterJobType) && (
            <button
              onClick={() => { setSearch(''); setFilterProvince(''); setFilterJobType('') }}
              className="text-xs text-gray-400 text-right">
              ✕ ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Result count */}
        {!loading && (
          <div className="text-xs text-gray-400 mb-3 px-1">
            พบ {filtered.length} เรซูเม่
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <div className="text-sm font-bold text-gray-600 mb-1">ไม่พบเรซูเม่</div>
            <div className="text-xs text-gray-400 mb-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</div>
            <div className="text-xs text-gray-400" style={{ fontFamily: 'Noto Sans Myanmar, sans-serif' }}>
              Resume မတွေ့ပါ — ရှာဖွေမှု ပြောင်းကြည့်ပါ
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-10">
            {filtered.map(r => {
              const avatar = r.gender === 'หญิง' ? '👩' : '👨'
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                    <div className="w-12 h-12 rounded-full bg-[#E8EBFF] flex items-center justify-center text-2xl flex-shrink-0">
                      {avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-extrabold text-gray-800 truncate">
                        {r.name || 'ไม่ระบุชื่อ'}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {r.want_job && (
                          <span className="text-xs bg-[#E8EBFF] text-[#2B3FBE] font-bold px-2 py-0.5 rounded-full">
                            {r.want_job}
                          </span>
                        )}
                        {r.province && (
                          <span className="text-xs text-gray-400">📍 {r.province}</span>
                        )}
                      </div>
                      {r.skills && (
                        <div className="text-xs text-gray-500 mt-1.5 line-clamp-2">{r.skills}</div>
                      )}
                      {r.want_salary && (
                        <div className="text-xs font-bold text-[#C9A84C] mt-1">
                          💰 {r.want_salary}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => router.push(`/resume/${r.id}`)}
                      className="w-full bg-[#2B3FBE] text-white font-bold py-2.5 rounded-xl text-xs">
                      ดูเรซูเม่
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
