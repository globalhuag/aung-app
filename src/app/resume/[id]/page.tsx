'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Resume = {
  id: string; user_id: string; name: string; birthday: string; gender: string; race: string; province: string;
  smart_card: string; bank_account: string; drive_car: string; car_license: string; drive_moto: string; moto_license: string;
  thai_listen: string; thai_read: string; eng_listen: string; eng_read: string;
  skills: string; w1_name: string; w1_duration: string; w1_salary: string;
  w2_name: string; w2_duration: string; w2_salary: string; w3_name: string; w3_duration: string; w3_salary: string;
  want_job: string; want_area: string; want_salary: string; strengths: string;
  photo_url: string; suit_status: string; is_public: boolean; created_at: string;
}

type UserRow = { id: string; phone: string }

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-28 flex-shrink-0">{label}</span>
      <span className="text-xs font-semibold text-gray-700 flex-1">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div className="bg-[#2B3FBE]/5 px-4 py-2 border-b border-gray-100">
        <span className="text-xs font-extrabold text-[#2B3FBE] uppercase tracking-wide">{title}</span>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  )
}

function LevelBadge({ value }: { value?: string }) {
  if (!value) return <span className="text-xs text-gray-300">—</span>
  const colors: Record<string, string> = {
    ดี: 'bg-green-100 text-green-700',
    ดีมาก: 'bg-emerald-100 text-emerald-700',
    พอใช้: 'bg-yellow-100 text-yellow-700',
    น้อย: 'bg-red-100 text-red-600',
    ไม่ได้: 'bg-gray-100 text-gray-500',
  }
  const cls = colors[value] || 'bg-blue-100 text-blue-700'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{value}</span>
}

export default function ResumeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [resume, setResume] = useState<Resume | null>(null)
  const [phone, setPhone] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    loadResume()
  }, [id])

  const loadResume = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setResume(data as Resume)

    const { data: userData } = await supabase
      .from('users')
      .select('id, phone')
      .eq('id', data.user_id)
      .single()

    if (userData) setPhone((userData as UserRow).phone)
    setLoading(false)
  }

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5FB] flex items-center justify-center">
        <div className="text-gray-400 text-sm">กำลังโหลด...</div>
      </div>
    )
  }

  if (notFound || !resume) {
    return (
      <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl">😕</div>
        <div className="text-base font-bold text-gray-700">ไม่พบเรซูเม่นี้</div>
        <div className="text-xs text-gray-400">อาจถูกลบหรือลิงก์ไม่ถูกต้อง</div>
        <button
          onClick={() => router.back()}
          className="mt-2 bg-[#2B3FBE] text-white rounded-xl px-6 py-2.5 text-sm font-bold">
          ← ย้อนกลับ
        </button>
      </div>
    )
  }

  const avatarEmoji = resume.gender === 'หญิง' ? '👩' : '👨'
  const statusColors: Record<string, string> = {
    done: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-600',
    pending: 'bg-yellow-100 text-yellow-700',
  }
  const statusLabels: Record<string, string> = {
    done: '✓ เสร็จแล้ว',
    error: '✕ ผิดพลาด',
    pending: '⏳ รอตรวจสอบ',
  }

  return (
    <div className="min-h-screen bg-[#F4F5FB]">
      <style>{`@media print { .no-print { display: none } }`}</style>

      {/* Action bar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center gap-2 px-3 py-2 max-w-sm mx-auto">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 text-sm font-bold">
          ← กลับ
        </button>
        <div className="flex-1" />
        <button
          onClick={handleShare}
          className="bg-[#F4F5FB] text-[#2B3FBE] border border-[#2B3FBE]/20 rounded-xl px-3 py-1.5 text-xs font-bold">
          {copied ? '✓ คัดลอกแล้ว!' : '🔗 แชร์'}
        </button>
        <button
          onClick={() => window.print()}
          className="bg-[#C9A84C] text-white rounded-xl px-3 py-1.5 text-xs font-bold">
          🖨️ พิมพ์
        </button>
      </div>

      <div className="max-w-sm mx-auto px-3 pt-4 pb-10">

        {/* Gold header */}
        <div className="bg-gradient-to-br from-[#C9A84C] to-[#a8872e] rounded-2xl p-5 mb-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center text-4xl flex-shrink-0">
            {avatarEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-extrabold text-lg leading-tight truncate">
              {resume.name || 'ไม่ระบุชื่อ'}
            </div>
            {phone && (
              <div className="text-white/80 text-xs mt-0.5">📞 {phone}</div>
            )}
            <div className="text-white/70 text-xs mt-0.5">
              {resume.province && `📍 ${resume.province}`}
            </div>
            <div className="mt-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[resume.suit_status] || 'bg-white/20 text-white'}`}>
                {statusLabels[resume.suit_status] || resume.suit_status}
              </span>
            </div>
          </div>
        </div>

        {/* ส่วนตัว */}
        <Section title="ส่วนตัว / ကိုယ်ရေး">
          <InfoRow label="วันเกิด" value={resume.birthday} />
          <InfoRow label="เพศ" value={resume.gender} />
          <InfoRow label="เชื้อชาติ" value={resume.race} />
          <InfoRow label="จังหวัด" value={resume.province} />
        </Section>

        {/* เอกสาร */}
        <Section title="เอกสาร / စာရွက်စာတမ်း">
          <InfoRow label="บัตรแรงงาน" value={resume.smart_card} />
          <InfoRow label="บัญชีธนาคาร" value={resume.bank_account} />
          <InfoRow label="ขับรถได้" value={resume.drive_car} />
          <InfoRow label="ใบขับขี่รถ" value={resume.car_license} />
          <InfoRow label="ขับมอไซค์ได้" value={resume.drive_moto} />
          <InfoRow label="ใบขับขี่มอไซค์" value={resume.moto_license} />
        </Section>

        {/* ภาษา */}
        <Section title="ภาษา / ဘာသာစကား">
          <div className="grid grid-cols-2 gap-2 py-1">
            <div className="text-xs text-gray-500">ภาษาไทย — ฟัง</div>
            <LevelBadge value={resume.thai_listen} />
            <div className="text-xs text-gray-500">ภาษาไทย — อ่าน</div>
            <LevelBadge value={resume.thai_read} />
            <div className="text-xs text-gray-500">ภาษาอังกฤษ — ฟัง</div>
            <LevelBadge value={resume.eng_listen} />
            <div className="text-xs text-gray-500">ภาษาอังกฤษ — อ่าน</div>
            <LevelBadge value={resume.eng_read} />
          </div>
        </Section>

        {/* ทักษะ */}
        <Section title="ทักษะ / ကျွမ်းကျင်မှု">
          {resume.skills && (
            <div className="py-2">
              <div className="text-xs text-gray-400 mb-1">ทักษะ</div>
              <div className="text-xs font-semibold text-gray-700 whitespace-pre-wrap">{resume.skills}</div>
            </div>
          )}
          {resume.strengths && (
            <div className="py-2 border-t border-gray-50">
              <div className="text-xs text-gray-400 mb-1">จุดแข็ง</div>
              <div className="text-xs font-semibold text-gray-700 whitespace-pre-wrap">{resume.strengths}</div>
            </div>
          )}
        </Section>

        {/* ประวัติงาน */}
        {(resume.w1_name || resume.w2_name || resume.w3_name) && (
          <Section title="ประวัติงาน / အလုပ်သမိုင်း">
            {resume.w1_name && (
              <div className="py-2 border-b border-gray-50">
                <div className="text-xs font-bold text-gray-700 mb-1">งานที่ 1: {resume.w1_name}</div>
                <div className="text-xs text-gray-400">ระยะเวลา: {resume.w1_duration || '—'}</div>
                <div className="text-xs text-gray-400">เงินเดือน: {resume.w1_salary || '—'}</div>
              </div>
            )}
            {resume.w2_name && (
              <div className="py-2 border-b border-gray-50">
                <div className="text-xs font-bold text-gray-700 mb-1">งานที่ 2: {resume.w2_name}</div>
                <div className="text-xs text-gray-400">ระยะเวลา: {resume.w2_duration || '—'}</div>
                <div className="text-xs text-gray-400">เงินเดือน: {resume.w2_salary || '—'}</div>
              </div>
            )}
            {resume.w3_name && (
              <div className="py-2">
                <div className="text-xs font-bold text-gray-700 mb-1">งานที่ 3: {resume.w3_name}</div>
                <div className="text-xs text-gray-400">ระยะเวลา: {resume.w3_duration || '—'}</div>
                <div className="text-xs text-gray-400">เงินเดือน: {resume.w3_salary || '—'}</div>
              </div>
            )}
          </Section>
        )}

        {/* งานที่ต้องการ */}
        <Section title="งานที่ต้องการ / လိုချင်သောအလုပ်">
          <InfoRow label="ต้องการงาน" value={resume.want_job} />
          <InfoRow label="พื้นที่ทำงาน" value={resume.want_area} />
          <InfoRow label="เงินเดือนที่ต้องการ" value={resume.want_salary} />
        </Section>

        <div className="text-center text-xs text-gray-300 pt-2">
          สร้างเมื่อ {new Date(resume.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  )
}
