'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User = { id: string; phone: string; credits: number }

// ── Provinces ──────────────────────────────────────────────────────────
const QUICK_PROVINCES = [
  { th: 'กรุงเทพฯ', mm: 'ဘန်ကောက်' },
  { th: 'สมุทรปราการ', mm: 'သမုတ်ပရာကာန်' },
  { th: 'ชลบุรี', mm: 'ချောင်ဘူရီ' },
  { th: 'สมุทรสาคร', mm: 'သမုတ်သာခရ' },
  { th: 'นนทบุรี', mm: 'နွန်တဘူရီ' },
  { th: 'ปทุมธานี', mm: 'ပဋိမ်တာနီ' },
  { th: 'ระยอง', mm: 'ရသောင်' },
  { th: 'พระนครศรีอยุธยา', mm: 'အယုဒ္ဓယ' },
  { th: 'นครปฐม', mm: 'နကောင်ပတ်' },
  { th: 'เชียงใหม่', mm: 'ချင်းမိုင်' },
  { th: 'ภูเก็ต', mm: 'ဘူးကက်' },
  { th: 'สงขลา', mm: 'သောင်ဘလာ' },
  { th: 'นครราชสีมา', mm: 'ကိုရတ်' },
  { th: 'ขอนแก่น', mm: 'ကွန်ကဲင်' },
]
const ALL_PROVINCES = [
  { th: 'กรุงเทพฯ', mm: 'ဘန်ကောက်' }, { th: 'สมุทรปราการ', mm: 'သမုတ်ပရာကာန်' },
  { th: 'นนทบุรี', mm: 'နွန်တဘူရီ' }, { th: 'ปทุมธานี', mm: 'ပဋိမ်တာနီ' },
  { th: 'พระนครศรีอยุธยา', mm: 'အယုဒ္ဓယ' }, { th: 'ชลบุรี', mm: 'ချောင်ဘူရီ' },
  { th: 'ระยอง', mm: 'ရသောင်' }, { th: 'จันทบุรี', mm: 'ဂျန်ဒဘူရီ' },
  { th: 'ตราด', mm: 'တြတ်' }, { th: 'ฉะเชิงเทรา', mm: 'ဆာချောင်သြ' },
  { th: 'สมุทรสาคร', mm: 'သမုတ်သာခရ' }, { th: 'นครปฐม', mm: 'နကောင်ပတ်' },
  { th: 'ราชบุรี', mm: 'ရာဇဘူရီ' }, { th: 'เพชรบุรี', mm: 'ဖက်ချဘူရီ' },
  { th: 'ประจวบคีรีขันธ์', mm: 'ပြာဂျွပ်ကီရီကန်' }, { th: 'เชียงใหม่', mm: 'ချင်းမိုင်' },
  { th: 'เชียงราย', mm: 'ချင်းရိုင်' }, { th: 'ลำพูน', mm: 'လမ်ဖုန်' },
  { th: 'ลำปาง', mm: 'လမ်ပါင်' }, { th: 'แม่ฮ่องสอน', mm: 'မဲဟောင်းသောင်' },
  { th: 'พิษณุโลก', mm: 'ဖိသနုလောက်' }, { th: 'สุโขทัย', mm: 'သုခသိုင်' },
  { th: 'ตาก', mm: 'တာက်' }, { th: 'นครสวรรค์', mm: 'နကောင်ဆောင်' },
  { th: 'สุราษฎร์ธานี', mm: 'သုရတ်သာနီ' }, { th: 'ภูเก็ต', mm: 'ဘူးကက်' },
  { th: 'กระบี่', mm: 'ကြာဘီ' }, { th: 'พังงา', mm: 'ဖင်ငာ' },
  { th: 'นครศรีธรรมราช', mm: 'နကောင်ရှီတမ်' }, { th: 'สงขลา', mm: 'သောင်ဘလာ' },
  { th: 'ตรัง', mm: 'တြာင်' }, { th: 'สตูล', mm: 'သတွူ' },
  { th: 'ปัตตานี', mm: 'ပတ္တာနီ' }, { th: 'นครราชสีมา', mm: 'ကိုရတ်' },
  { th: 'ขอนแก่น', mm: 'ကွန်ကဲင်' }, { th: 'อุดรธานี', mm: 'အုဒ်တြာသာနီ' },
  { th: 'หนองคาย', mm: 'နောင်ကိုင်' }, { th: 'อุบลราชธานี', mm: 'အုဘောင်ရာဇ' },
  { th: 'สุรินทร์', mm: 'သုရင်' }, { th: 'บุรีรัมย์', mm: 'ဘူရီရမ်' },
  { th: 'ชัยภูมิ', mm: 'ချင်ဘူမိ' },
]

// ── Options ────────────────────────────────────────────────────────────
const LANG_OPTS = [
  { v: 'ดีมาก', mm: 'အလွန်ကောင်း' },
  { v: 'ดี', mm: 'ကောင်း' },
  { v: 'พอใช้', mm: 'အသင့်အတင့်' },
  { v: 'ไม่ได้', mm: 'မရပါ' },
]
const YES_NO = [
  { v: 'มี', mm: 'ရှိသည်' },
  { v: 'ไม่มี', mm: 'မရှိပါ' },
]
const CAN_CANNOT = [
  { v: 'ได้', mm: 'တတ်သည်' },
  { v: 'ไม่ได้', mm: 'မတတ်ပါ' },
]
const RACE_OPTS = [
  { v: 'พม่า', mm: 'ဗမာ' },
  { v: 'กะเหรี่ยง', mm: 'ကရင်' },
  { v: 'มอญ', mm: 'မွန်' },
  { v: 'ไทใหญ่', mm: 'ရှမ်း' },
]
const SKILL_OPTS = [
  { v: 'เชื่อมเหล็ก', mm: 'သံဆက်', emoji: '🔧' },
  { v: 'เย็บผ้า', mm: 'အချုပ်', emoji: '✂️' },
  { v: 'โฟล์คลิฟท์', mm: 'ဖိုကလစ်', emoji: '🚜' },
  { v: 'ทำอาหาร', mm: 'ချက်ပြုတ်', emoji: '🍳' },
  { v: 'คอมพิวเตอร์', mm: 'ကွန်ပျူတာ', emoji: '💻' },
  { v: 'เกษตร', mm: 'လယ်ယာ', emoji: '🌾' },
  { v: 'งานไม้', mm: 'သစ်သားလုပ်', emoji: '🪵' },
  { v: 'ไฟฟ้า', mm: 'လျှပ်စစ်', emoji: '⚡' },
  { v: 'อื่นๆ', mm: 'အခြား', emoji: '✏️' },
  { v: 'ไม่มี', mm: 'မရှိပါ', emoji: '' },
]
const JOB_OPTS = [
  { v: 'โรงงาน', mm: 'စက်ရုံ', emoji: '🏭' },
  { v: 'ก่อสร้าง', mm: 'ဆောက်လုပ်ရေး', emoji: '🏗️' },
  { v: 'แม่บ้าน', mm: 'အိမ်အကူ', emoji: '🏠' },
  { v: 'พนักงานขาย', mm: 'အရောင်းဝန်', emoji: '🛍️' },
  { v: 'ขับรถ/ส่งของ', mm: 'ယာဉ်မောင်း', emoji: '🚚' },
  { v: 'เกษตร', mm: 'လယ်ယာ', emoji: '🌾' },
  { v: 'อื่นๆ', mm: 'အခြား', emoji: '✏️' },
]
const STRENGTH_OPTS = [
  { v: 'ขยันอดทน', mm: 'ကြိုးစား', emoji: '💪' },
  { v: 'ซื่อสัตย์', mm: 'သစ္စာရှိ', emoji: '🤝' },
  { v: 'เรียนรู้งานไว', mm: 'သင်ယူမြန်', emoji: '⚡' },
  { v: 'ตรงต่อเวลา', mm: 'အချိန်တိကျ', emoji: '⏰' },
  { v: 'ทำงานล่วงเวลาได้', mm: 'OT ဆင်းနိုင်', emoji: '🌙' },
]
const GENDER_OPTS = [
  { v: 'ชาย', mm: 'ကျား', emoji: '👨' },
  { v: 'หญิง', mm: 'မ', emoji: '👩' },
]

// ── Birthday ───────────────────────────────────────────────────────────
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
const MONTHS = [
  { v: '01', th: 'มกราคม' }, { v: '02', th: 'กุมภาพันธ์' }, { v: '03', th: 'มีนาคม' },
  { v: '04', th: 'เมษายน' }, { v: '05', th: 'พฤษภาคม' }, { v: '06', th: 'มิถุนายน' },
  { v: '07', th: 'กรกฎาคม' }, { v: '08', th: 'สิงหาคม' }, { v: '09', th: 'กันยายน' },
  { v: '10', th: 'ตุลาคม' }, { v: '11', th: 'พฤศจิกายน' }, { v: '12', th: 'ธันวาคม' },
]
const YEARS = Array.from({ length: 42 }, (_, i) => String(2007 - i)) // 2007→1966 (อายุ 19-60)

const TOTAL_STEPS = 7
const STEP_LABELS = ['ส่วนตัว', 'เอกสาร', 'ภาษา', 'ประวัติงาน', 'ต้องการ', 'รูปถ่าย', 'ยืนยัน']

type FormData = {
  name: string
  bday: string; bmonth: string; byear: string
  gender: string
  race: string; race_other: string
  province: string; province_other: string
  smart_card: string; bank_account: string
  drive_car: string; car_license: string
  drive_moto: string; moto_license: string
  thai_listen: string; thai_read: string
  eng_listen: string; eng_read: string
  skills: string[]; skill_other: string
  w1_name: string; w1_duration: string; w1_salary: string
  w2_name: string; w2_duration: string; w2_salary: string
  w3_name: string; w3_duration: string; w3_salary: string
  want_job: string; want_job_other: string
  want_area: string; want_area_other: string
  want_salary: string
  strengths: string[]
  is_public: boolean
}

const INIT: FormData = {
  name: '', bday: '', bmonth: '', byear: '',
  gender: '', race: '', race_other: '',
  province: '', province_other: '',
  smart_card: '', bank_account: '',
  drive_car: '', car_license: '',
  drive_moto: '', moto_license: '',
  thai_listen: '', thai_read: '',
  eng_listen: '', eng_read: '',
  skills: [], skill_other: '',
  w1_name: '', w1_duration: '', w1_salary: '',
  w2_name: '', w2_duration: '', w2_salary: '',
  w3_name: '', w3_duration: '', w3_salary: '',
  want_job: '', want_job_other: '',
  want_area: '', want_area_other: '',
  want_salary: '', strengths: [],
  is_public: false,
}

// ── Small components ───────────────────────────────────────────────────

function QHeader({ num, th, mm }: { num: string; th: string; mm: string }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-4 mb-3 shadow-sm">
      <div className="text-xs font-bold text-[#C9A84C] mb-1">{num}</div>
      <div className="text-lg font-black text-gray-800">{th}</div>
      <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{mm}</div>
    </div>
  )
}

function Pill({ label, sublabel, selected, onClick, className = '' }: {
  label: string; sublabel?: string; selected: boolean; onClick: () => void; className?: string
}) {
  return (
    <button onClick={onClick} type="button"
      className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-all flex-shrink-0 ${className}
        ${selected ? 'border-[#C9A84C] bg-[#C9A84C] text-white' : 'border-gray-200 bg-white text-gray-700'}`}>
      {label}
      {sublabel && <span className="block text-xs font-normal opacity-80" style={{ fontFamily: 'Noto Sans Myanmar' }}>{sublabel}</span>}
    </button>
  )
}

function YesNoPills({ opts, value, onChange }: {
  opts: { v: string; mm: string }[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-3">
      {opts.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} type="button"
          className={`flex-1 rounded-full border-2 py-3 text-sm font-bold transition-all
            ${value === o.v ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
          {o.v}
          <span className="block text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{o.mm}</span>
        </button>
      ))}
    </div>
  )
}

function LangPills({ opts, value, onChange }: {
  opts: { v: string; mm: string }[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {opts.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} type="button"
          className={`rounded-full border-2 py-2.5 text-xs font-bold transition-all text-center
            ${value === o.v ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
          {o.v}
          <span className="block text-[10px] font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{o.mm}</span>
        </button>
      ))}
    </div>
  )
}

function OtherInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'ระบุ... / ရေးထည့်ပါ...'}
      className="mt-2 w-full border-2 border-[#C9A84C] rounded-full px-4 py-2.5 text-sm focus:outline-none bg-amber-50 placeholder-amber-300 font-medium" />
  )
}

function TxtInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C] bg-white" />
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-400 text-xs w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="font-bold text-gray-800 text-right flex-1">{value}</span>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────

export default function ResumeCreatePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormData>(INIT)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [docFiles, setDocFiles] = useState<File[]>([])
  const [pdpaConfirmed, setPdpaConfirmed] = useState(false)
  const [fillingForOther, setFillingForOther] = useState(false)
  const [pdpaMain, setPdpaMain] = useState(false)
  const [pdpaProxy, setPdpaProxy] = useState(false)
  const scrollTop = () => window.scrollTo(0, 0)

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
  }, [])

  useEffect(() => {
    if (!photoFile) { setPhotoPreview(''); return }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }))

  const toggleMulti = (field: 'skills' | 'strengths', value: string) =>
    setForm(f => {
      const arr = f[field] as string[]
      return { ...f, [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] }
    })

  const raceVal = form.race === 'อื่นๆ' ? (form.race_other || 'อื่นๆ') : form.race
  const provinceVal = form.province === 'อื่นๆ' ? (form.province_other || 'อื่นๆ') : form.province
  const wantAreaVal = form.want_area === 'อื่นๆ' ? (form.want_area_other || 'อื่นๆ') : form.want_area
  const wantJobVal = form.want_job === 'อื่นๆ' ? (form.want_job_other || 'อื่นๆ') : form.want_job
  const skillsVal = form.skills.map(s => s === 'อื่นๆ' ? (form.skill_other || 'อื่นๆ') : s).filter(s => s !== 'ไม่มี').join(', ')
  const birthday = form.bday && form.bmonth && form.byear ? `${form.bday}/${form.bmonth}/${form.byear}` : ''

  const handleSubmit = async (isPublic: boolean) => {
    if (!user) return
    setSaving(true)

    // Upload photo
    let photoUrl = ''
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `photos/${user.id}_${Date.now()}.${ext}`
      const { data: upData } = await supabase.storage.from('resume-files').upload(path, photoFile, { upsert: true })
      if (upData) {
        const { data: urlData } = supabase.storage.from('resume-files').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }
    }

    // Upload docs
    const docUrls: string[] = []
    for (const doc of docFiles) {
      const ext = doc.name.split('.').pop()
      const path = `docs/${user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { data: upData } = await supabase.storage.from('resume-files').upload(path, doc, { upsert: true })
      if (upData) {
        const { data: urlData } = supabase.storage.from('resume-files').getPublicUrl(path)
        docUrls.push(urlData.publicUrl)
      }
    }

    const { data: insertedResume } = await supabase.from('resumes').insert({
      user_id: user.id,
      name: form.name,
      birthday: birthday || null,
      gender: form.gender || null,
      race: raceVal || null,
      province: provinceVal || null,
      smart_card: form.smart_card || null,
      bank_account: form.bank_account || null,
      drive_car: form.drive_car || null,
      car_license: form.car_license || null,
      drive_moto: form.drive_moto || null,
      moto_license: form.moto_license || null,
      thai_listen: form.thai_listen || null,
      thai_read: form.thai_read || null,
      eng_listen: form.eng_listen || null,
      eng_read: form.eng_read || null,
      skills: skillsVal || null,
      w1_name: form.w1_name || null, w1_duration: form.w1_duration || null, w1_salary: form.w1_salary || null,
      w2_name: form.w2_name || null, w2_duration: form.w2_duration || null, w2_salary: form.w2_salary || null,
      w3_name: form.w3_name || null, w3_duration: form.w3_duration || null, w3_salary: form.w3_salary || null,
      want_job: wantJobVal || null,
      want_area: wantAreaVal || null,
      want_salary: form.want_salary || null,
      strengths: form.strengths.join(', ') || null,
      job_type: wantJobVal || null,
      photo_url: photoUrl || null,
      doc_urls: docUrls.length ? docUrls : null,
      suit_status: 'pending',
      is_public: isPublic,
    }).select('id').single()

    await supabase.from('users').update({ credits: user.credits - 1 }).eq('id', user.id)
    localStorage.setItem('aung_user', JSON.stringify({ ...user, credits: user.credits - 1 }))

    setSaving(false)
    // ไปหน้า resume โดยตรง — resume page จะ auto-generate suit เอง
    router.push(`/resume/${insertedResume?.id}`)
  }

  if (!user) return null

  const canNext = step !== 1 || form.name.trim().length > 0
  const canConfirmPdpa = pdpaMain && (!fillingForOther || pdpaProxy)

  // ── PDPA Gate Screen ──
  if (!pdpaConfirmed) return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">

        {/* PDPA Header */}
        <div className="bg-[#2B3FBE] px-4 pt-4 pb-5">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold mb-3">
            ←
          </button>
          <div className="text-white font-black text-xl leading-tight">ข้อตกลงการเก็บข้อมูล<br/>ส่วนบุคคล (PDPA)</div>
          <div className="text-white/70 text-xs mt-1" style={{fontFamily:'Noto Sans Myanmar'}}>ကိုယ်ရေးအချက်အလက် သဘောတူညီချက်</div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-32">

          {/* Intro */}
          <div className="text-center py-1">
            <div className="text-5xl mb-2">🔐</div>
            <div className="text-base font-black text-gray-800">ก่อนเริ่มกรอกข้อมูล</div>
            <div className="text-xs text-gray-500 mt-1 leading-relaxed">
              Aung จำเป็นต้องได้รับความยินยอมของคุณในการเก็บข้อมูล<br/>
              ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
            </div>
            <div className="text-xs text-gray-400 mt-1" style={{fontFamily:'Noto Sans Myanmar'}}>
              ကိုယ်ရေးအချက်အလက် ကာကွယ်ရေးဥပဒေ (PDPA 2019)
            </div>
          </div>

          {/* What we collect */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-black text-gray-800 mb-3">📋 ข้อมูลที่เราเก็บรวบรวม</div>
            {[
              { th: 'ชื่อ-นามสกุล, วันเกิด, เพศ, เชื้อชาติ', mm: 'အမည်၊ မွေးသက္ကရာဇ်၊ ကျား/မ၊ လူမျိုး' },
              { th: 'จังหวัดที่อยู่ปัจจุบัน, เบอร์โทรศัพท์', mm: 'နေရပ်လိပ်စာ၊ ဖုန်းနံပါတ်' },
              { th: 'Smart Card, Work Permit, พาสปอร์ต', mm: 'Smart Card၊ Work Permit၊ နိုင်ငံကူးလက်မှတ်' },
              { th: 'บัญชีธนาคาร, ใบขับขี่', mm: 'ဘဏ်အကောင့်၊ မောင်းနှင်လိုင်စင်' },
              { th: 'ประวัติการทำงาน, ทักษะ, ความสามารถทางภาษา', mm: 'အလုပ်သမိုင်း၊ ကျွမ်းကျင်မှု၊ ဘာသာစကား' },
              { th: 'รูปถ่าย และสำเนาเอกสาร', mm: 'ဓာတ်ပုံ နှင့် စာရွက်မိတ္တူ' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 mb-2.5 last:mb-0">
                <span className="text-[#2B3FBE] font-black text-sm flex-shrink-0 mt-0.5">•</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">{item.th}</div>
                  <div className="text-xs text-gray-400 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>{item.mm}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Purpose */}
          <div className="bg-[#E8EBFF] rounded-2xl p-4">
            <div className="text-xs font-black text-[#2B3FBE] mb-1.5">🎯 วัตถุประสงค์การใช้ข้อมูล</div>
            <div className="text-xs text-[#2B3FBE]/80 leading-relaxed">
              เพื่อจัดทำเรซูเม่และจับคู่กับนายจ้าง/นายหน้าที่สนใจ
              ข้อมูลจะถูกแชร์เฉพาะเมื่อคุณเลือก <span className="font-black">เผยแพร่เรซูเม่</span> เท่านั้น
            </div>
            <div className="text-xs text-[#2B3FBE]/60 mt-1.5" style={{fontFamily:'Noto Sans Myanmar'}}>
              Resume ပြုလုပ်ပြီး အလုပ်ရှင်နှင့် ချိတ်ဆက်ရန်သာ — ထုတ်ဝေမှသာ မျှဝေမည်
            </div>
          </div>

          {/* Retention + Controller */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <div>
              <div className="text-xs font-black text-gray-800 mb-1">🗓️ ระยะเวลาเก็บข้อมูล</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                เก็บข้อมูลไว้ <span className="font-black text-gray-800">2 ปี</span> นับจากวันที่สร้างเรซูเม่
                หรือจนกว่าคุณจะขอลบ หลังจากนั้นข้อมูลจะถูกทำลายอย่างถาวร
              </div>
              <div className="text-xs text-gray-400 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>
                Resume ပြုလုပ်သည့်နေ့မှ နှစ် ၂ နှစ် — ဖျက်တောင်းဆိုနိုင်သည်
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="text-xs font-black text-gray-800 mb-1">🏢 ผู้ควบคุมข้อมูลส่วนบุคคล</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                <span className="font-bold">Aung (အောင်)</span> — ผู้ให้บริการแพลตฟอร์มจัดหางาน<br/>
                ติดต่อ: แชทในแอป (เมนู ติดต่อเรา)
              </div>
              <div className="text-xs text-gray-400 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>
                Aung — အလုပ်ရှာဖွေရေး ပလက်ဖောင်း · အပ်တွင်း ချတ်မှ ဆက်သွယ်နိုင်
              </div>
            </div>
          </div>

          {/* Your rights */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-black text-gray-800 mb-3">⚖️ สิทธิ์ของคุณ (ม.30-37)</div>
            {[
              { icon: '👁️', th: 'เข้าถึงและขอสำเนาข้อมูล', mm: 'ဒေတာကြည့်ရှု/မိတ္တူတောင်းနိုင်' },
              { icon: '✏️', th: 'แก้ไขข้อมูลให้ถูกต้อง', mm: 'အချက်အလက်ပြင်ဆင်နိုင်' },
              { icon: '🗑️', th: 'ลบ / ขอทำลายข้อมูล', mm: 'ဒေတာဖျက်ရန် တောင်းဆိုနိုင်' },
              { icon: '🚫', th: 'คัดค้านการประมวลผลข้อมูล', mm: 'ဒေတာအသုံးပြုမှုကန့်ကွက်နိုင်' },
              { icon: '↩️', th: 'ถอนความยินยอมได้ทุกเมื่อ', mm: 'သဘောတူညီချက် မည်သည့်အချိန်မဆို ရုပ်သိမ်းနိုင်' },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                <span className="text-sm flex-shrink-0 mt-0.5">{r.icon}</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">{r.th}</div>
                  <div className="text-xs text-gray-400 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>{r.mm}</div>
                </div>
              </div>
            ))}
            <div className="mt-3 text-xs text-gray-400 border-t border-gray-100 pt-2">
              ใช้สิทธิ์ได้ผ่าน: แชทในแอป (เมนู ติดต่อเรา)
              <span className="block mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>အပ်တွင်း ချတ်မှ အခွင့်အရေး တောင်းဆိုနိုင်</span>
            </div>
          </div>

          {/* Who is filling */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-black text-gray-800 mb-1">👤 กรอกข้อมูลให้ใคร?</div>
            <div className="text-xs text-gray-400 mb-3" style={{fontFamily:'Noto Sans Myanmar'}}>ဘယ်သူ့အတွက် ဖြည့်သွင်းနေသလဲ?</div>
            <div className="flex gap-2">
              <button onClick={() => { setFillingForOther(false); setPdpaProxy(false) }}
                className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all
                  ${!fillingForOther ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                ตัวเอง
                <span className="block text-xs font-normal opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>ကိုယ်တိုင်</span>
              </button>
              <button onClick={() => setFillingForOther(true)}
                className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all
                  ${fillingForOther ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                แทนผู้อื่น
                <span className="block text-xs font-normal opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>သူများအတွက်</span>
              </button>
            </div>
            {fillingForOther && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                <div className="font-bold mb-0.5">ℹ️ กรอกแทนเพื่อน / ครอบครัว</div>
                <div className="leading-relaxed">กรุณาตรวจสอบว่าเจ้าของข้อมูลรับรู้และยินยอมให้คุณกรอกข้อมูลแทนแล้ว หากไม่ได้รับความยินยอม อาจผิด พ.ร.บ. PDPA</div>
                <div className="mt-1 opacity-80" style={{fontFamily:'Noto Sans Myanmar'}}>မိတ်ဆွေ/မိသားစု၏ ခွင့်ပြုချက်ရပြီးမှ ဖြည့်သွင်းပါ</div>
              </div>
            )}
          </div>

          {/* Consent checkboxes */}
          <div className="space-y-3">
            {/* Main consent */}
            <label className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm cursor-pointer active:bg-gray-50">
              <input type="checkbox" checked={pdpaMain} onChange={e => setPdpaMain(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-[#2B3FBE] flex-shrink-0 cursor-pointer" />
              <div>
                <div className="text-sm font-black text-gray-800">
                  {fillingForOther ? '✅ เจ้าของข้อมูลยินยอมแล้ว *' : '✅ ข้าพเจ้ายินยอม *'}
                </div>
                <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {fillingForOther
                    ? 'เจ้าของข้อมูลได้รับทราบและยินยอมให้ Aung เก็บรวบรวมและใช้ข้อมูลส่วนบุคคลตามที่ระบุข้างต้นแล้ว'
                    : 'ข้าพเจ้าได้อ่านและเข้าใจข้อกำหนดข้างต้น และยินยอมให้ Aung เก็บรวบรวมและใช้ข้อมูลส่วนบุคคลของข้าพเจ้าตามที่ระบุ'
                  }
                </div>
                <div className="text-xs text-gray-400 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>
                  {fillingForOther
                    ? 'ဒေတာပိုင်ရှင်သည် Aung အား ကိုယ်ရေးအချက်အလက် သိမ်းဆည်းခွင့် ပေးပြီးဖြစ်သည်'
                    : 'ကျွန်ုပ် Aung အား ကိုယ်ရေးအချက်အလက် စုဆောင်းပြီး အလုပ်ရှာဖွေရာတွင် အသုံးပြုခွင့် ပေးသည်'
                  }
                </div>
              </div>
            </label>

            {/* Proxy consent — only when filling for other */}
            {fillingForOther && (
              <label className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm cursor-pointer border-2 border-amber-200 active:bg-amber-50">
                <input type="checkbox" checked={pdpaProxy} onChange={e => setPdpaProxy(e.target.checked)}
                  className="mt-0.5 w-5 h-5 accent-[#C9A84C] flex-shrink-0 cursor-pointer" />
                <div>
                  <div className="text-sm font-black text-gray-800">⚖️ ข้าพเจ้ามีสิทธิ์ดำเนินการแทน *</div>
                  <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                    ข้าพเจ้าได้รับความยินยอมจากเจ้าของข้อมูลโดยตรงแล้ว และรับทราบว่าการให้ข้อมูลอันเป็นเท็จอาจมีผลทางกฎหมายตาม พ.ร.บ. PDPA
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>
                    ဒေတာပိုင်ရှင်ထံမှ တိုက်ရိုက်ခွင့်ပြုချက်ရပြီး — မှားယွင်းသောအချက်အလက်ပေးခြင်းသည် ဥပဒေနှင့်ဆန့်ကျင်သည်
                  </div>
                </div>
              </label>
            )}
          </div>

        </div>

        {/* PDPA Confirm Button */}
        <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center bg-[#F4F5FB] border-t border-gray-200">
          <div className="w-full max-w-sm px-4 pb-6 pt-3">
            <button onClick={() => { setPdpaConfirmed(true); scrollTop() }} disabled={!canConfirmPdpa}
              className="w-full rounded-full bg-[#2B3FBE] disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 font-extrabold text-base transition-colors">
              ✅ ยินยอมและเริ่มกรอกข้อมูล
              <span className="block text-xs font-normal opacity-80 mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>သဘောတူပြီး ဖြည့်သွင်းမည်</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <div className="w-full max-w-sm">

        {/* ── Header (gold, sticky) ── */}
        <div className="sticky top-0 z-10 bg-[#C9A84C] px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => { if (step > 1) { setStep(s => s - 1); scrollTop() } else { router.back() } }}
              className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white font-bold">
              ←
            </button>
            <div className="text-white/80 text-xs font-bold">ข้อ {step} จาก {TOTAL_STEPS}</div>
            <div className="ml-auto text-right">
              <div className="text-white font-black text-xs leading-none">Aung</div>
              <div className="text-white/60 text-xs" style={{fontFamily:'Noto Sans Myanmar'}}>အောင်</div>
            </div>
          </div>
          {/* Progress */}
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < step ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {STEP_LABELS.map((l, i) => (
              <span key={i} className={`text-[9px] font-bold ${i + 1 === step ? 'text-white' : 'text-white/40'}`}>{l}</span>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-4 py-4 space-y-4 pb-36">

          {/* ══ STEP 1: ส่วนตัว ══ */}
          {step === 1 && <>
            {/* ชื่อ */}
            <QHeader num="ข้อ 1 / 25" th="ชื่อ-นามสกุล ภาษาอังกฤษ *" mm="အမည် အင်္ဂလိပ်ဘာသာ" />
            <TxtInput value={form.name} onChange={v => set('name', v.toUpperCase())} placeholder="FIRSTNAME LASTNAME" />

            {/* วันเกิด */}
            <QHeader num="ข้อ 2 / 25" th="วันเกิด" mm="မွေးသက္ကရာဇ်" />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs font-bold text-gray-500 mb-1.5 ml-1">วัน / ရက်</div>
                <select value={form.bday} onChange={e => set('bday', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:border-[#C9A84C]">
                  <option value="">--</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 mb-1.5 ml-1">เดือน / လ</div>
                <select value={form.bmonth} onChange={e => set('bmonth', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:border-[#C9A84C]">
                  <option value="">--</option>
                  {MONTHS.map(m => <option key={m.v} value={m.v}>{m.th}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 mb-1.5 ml-1">ปี / နှစ်</div>
                <select value={form.byear} onChange={e => set('byear', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:border-[#C9A84C]">
                  <option value="">--</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* เพศ */}
            <QHeader num="ข้อ 3 / 25" th="เพศ" mm="ကျား/မ" />
            <div className="flex gap-3">
              {GENDER_OPTS.map(g => (
                <button key={g.v} onClick={() => set('gender', g.v)} type="button"
                  className={`flex-1 rounded-full border-2 py-3 font-bold text-sm transition-all
                    ${form.gender === g.v ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                  {g.emoji} {g.v}
                  <span className="block text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{g.mm}</span>
                </button>
              ))}
            </div>

            {/* เชื้อชาติ */}
            <QHeader num="ข้อ 4 / 25" th="เชื้อชาติ?" mm="လူမျိုး?" />
            <div className="grid grid-cols-2 gap-2">
              {RACE_OPTS.map(r => {
                const isSel = form.race === r.v
                return (
                  <button key={r.v} onClick={() => set('race', r.v)} type="button"
                    className={`rounded-full border-2 py-3 text-sm font-bold transition-all
                      ${isSel ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {r.v}
                    <span className="block text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{r.mm}</span>
                  </button>
                )
              })}
              {/* อื่นๆ - full width */}
              <button onClick={() => set('race', 'อื่นๆ')} type="button"
                className={`col-span-2 rounded-full border-2 py-3 text-sm font-bold transition-all
                  ${form.race === 'อื่นๆ' ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                อื่นๆ โปรดระบุ
                <span className="block text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>အခြား ဖော်ပြပါ</span>
              </button>
            </div>
            {form.race === 'อื่นๆ' && (
              <OtherInput value={form.race_other} onChange={v => set('race_other', v)} placeholder="ระบุเชื้อชาติ... / လူမျိုးရေးပါ..." />
            )}

            {/* จังหวัด */}
            <QHeader num="ข้อ 5 / 25" th="จังหวัดที่อยู่ปัจจุบัน?" mm="လက်ရှိနေထိုင်သည့် ခရိုင်?" />
            <div className="flex flex-wrap gap-2">
              {QUICK_PROVINCES.map(p => (
                <button key={p.th} onClick={() => set('province', p.th)} type="button"
                  className={`rounded-full border-2 px-4 py-2 text-xs font-bold transition-all
                    ${form.province === p.th ? 'bg-[#C9A84C] border-[#C9A84C] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                  {p.th}
                  <span className="block text-[10px] font-normal opacity-70" style={{ fontFamily: 'Noto Sans Myanmar' }}>{p.mm}</span>
                </button>
              ))}
              <button onClick={() => set('province', 'อื่นๆ')} type="button"
                className={`rounded-full border-2 px-4 py-2 text-xs font-bold transition-all
                  ${form.province === 'อื่นๆ' ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                อื่นๆ ระบุเอง
                <span className="block text-[10px] font-normal opacity-70" style={{ fontFamily: 'Noto Sans Myanmar' }}>အခြားခရိုင်</span>
              </button>
            </div>
            {form.province === 'อื่นๆ' && (
              <select value={form.province_other} onChange={e => set('province_other', e.target.value)}
                className="w-full border-2 border-[#C9A84C] rounded-xl px-4 py-3 text-sm bg-amber-50 focus:outline-none">
                <option value="">-- เลือกจังหวัด --</option>
                {ALL_PROVINCES.map(p => <option key={p.th} value={p.th}>{p.th} / {p.mm}</option>)}
              </select>
            )}
          </>}

          {/* ══ STEP 2: เอกสาร ══ */}
          {step === 2 && <>
            {[
              { num: '6/25', th: 'มี Smart Card / Work Permit ไหม?', mm: 'Smart Card Work Permit ရှိပါသလား?', field: 'smart_card' as const, opts: YES_NO },
              { num: '7/25', th: 'มีบัญชีธนาคารไทยไหม?', mm: 'ထိုင်းဘဏ်အကောင့် ရှိပါသလား?', field: 'bank_account' as const, opts: YES_NO },
              { num: '8/25', th: 'ขับรถยนต์ได้ไหม?', mm: 'ကားမောင်းတတ်ပါသလား?', field: 'drive_car' as const, opts: CAN_CANNOT },
              { num: '9/25', th: 'มีใบขับขี่รถยนต์ไทยไหม?', mm: 'ထိုင်းကားမောင်းလိုင်စင် ရှိပါသလား?', field: 'car_license' as const, opts: YES_NO },
              { num: '10/25', th: 'ขับรถจักรยานยนต์ได้ไหม?', mm: 'ဆိုင်ကယ်မောင်းတတ်ပါသလား?', field: 'drive_moto' as const, opts: CAN_CANNOT },
              { num: '11/25', th: 'มีใบขับขี่จักรยานยนต์ไทยไหม?', mm: 'ထိုင်းဆိုင်ကယ်လိုင်စင် ရှိပါသလား?', field: 'moto_license' as const, opts: YES_NO },
            ].map(q => (
              <div key={q.num}>
                <QHeader num={`ข้อ ${q.num}`} th={q.th} mm={q.mm} />
                <YesNoPills opts={q.opts} value={form[q.field]} onChange={v => set(q.field, v)} />
              </div>
            ))}
          </>}

          {/* ══ STEP 3: ภาษา & ทักษะ ══ */}
          {step === 3 && <>
            {[
              { num: '12/25', th: 'ภาษาไทย (ฟัง+พูด)', mm: 'ထိုင်း (နားထောင်+ပြောဆို)', field: 'thai_listen' as const },
              { num: '13/25', th: 'ภาษาไทย (อ่าน+เขียน)', mm: 'ထိုင်း (ဖတ်+ရေး)', field: 'thai_read' as const },
              { num: '14/25', th: 'ภาษาอังกฤษ (ฟัง+พูด)', mm: 'အင်္ဂလိပ် (နားထောင်+ပြောဆို)', field: 'eng_listen' as const },
              { num: '15/25', th: 'ภาษาอังกฤษ (อ่าน+เขียน)', mm: 'အင်္ဂလိပ် (ဖတ်+ရေး)', field: 'eng_read' as const },
            ].map(q => (
              <div key={q.num}>
                <QHeader num={`ข้อ ${q.num}`} th={q.th} mm={q.mm} />
                <LangPills opts={LANG_OPTS} value={form[q.field]} onChange={v => set(q.field, v)} />
              </div>
            ))}

            {/* ทักษะพิเศษ */}
            <QHeader num="ข้อ 16 / 25" th="ทักษะพิเศษ?" mm="ထူးချွန်သည့်ကျွမ်းကျင်မှုများ (တစ်ခုထက်ပိုရွေးနိုင်)" />
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTS.map(s => {
                const isSel = form.skills.includes(s.v)
                return (
                  <button key={s.v} onClick={() => toggleMulti('skills', s.v)} type="button"
                    className={`rounded-full border-2 px-3 py-2 text-xs font-bold transition-all flex items-center gap-1.5
                      ${isSel ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {s.emoji && <span>{s.emoji}</span>}
                    <span>{s.v}</span>
                    <span className="opacity-70" style={{ fontFamily: 'Noto Sans Myanmar' }}>{s.mm}</span>
                  </button>
                )
              })}
            </div>
            {form.skills.length > 0 && !form.skills.every(s => s === 'ไม่มี') && (
              <div className="text-xs text-gray-500 font-semibold">
                เลือกแล้ว: <span className="text-[#C9A84C] font-bold">{form.skills.filter(s => s !== 'ไม่มี').join(', ')}</span>
              </div>
            )}
            {form.skills.includes('อื่นๆ') && (
              <OtherInput value={form.skill_other} onChange={v => set('skill_other', v)} placeholder="ระบุทักษะ... / ကျွမ်းကျင်မှုရေးပါ..." />
            )}
          </>}

          {/* ══ STEP 4: ประวัติงาน ══ */}
          {step === 4 && <>
            {([
              { num: '17/25', label: 'ประวัติงาน 1', mm: 'အလုပ်အကိုင်သမိုင်း ၁', n: 'w1_name' as const, d: 'w1_duration' as const, s: 'w1_salary' as const },
              { num: '18/25', label: 'ประวัติงาน 2', mm: 'အလုပ်အကိုင်သမိုင်း ၂', n: 'w2_name' as const, d: 'w2_duration' as const, s: 'w2_salary' as const },
              { num: '19/25', label: 'ประวัติงาน 3', mm: 'အလုပ်အကိုင်သမိုင်း ၃', n: 'w3_name' as const, d: 'w3_duration' as const, s: 'w3_salary' as const },
            ]).map(w => (
              <div key={w.num} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                <div>
                  <div className="text-xs font-bold text-[#C9A84C]">ข้อ {w.num}</div>
                  <div className="text-base font-extrabold text-gray-800">{w.label}</div>
                  <div className="text-xs text-gray-400" style={{ fontFamily: 'Noto Sans Myanmar' }}>{w.mm}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1">ชื่อบริษัท/โรงงาน <span style={{ fontFamily: 'Noto Sans Myanmar' }}>/ ကုမ္ပဏီ/စက်ရုံ</span></div>
                  <TxtInput value={form[w.n]} onChange={v => set(w.n, v)} placeholder="ชื่อบริษัท..." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1">ทำมากี่ปี <span style={{ fontFamily: 'Noto Sans Myanmar' }}>/ နှစ်</span></div>
                    <TxtInput value={form[w.d]} onChange={v => set(w.d, v)} placeholder="เช่น 2" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1">รายได้/เดือน <span style={{ fontFamily: 'Noto Sans Myanmar' }}>/ လစာ</span></div>
                    <TxtInput value={form[w.s]} onChange={v => set(w.s, v)} placeholder="เช่น 12000" />
                  </div>
                </div>
              </div>
            ))}
          </>}

          {/* ══ STEP 5: ต้องการ ══ */}
          {step === 5 && <>
            {/* งานที่ต้องการ */}
            <QHeader num="ข้อ 20 / 25" th="ประเภทงานที่ต้องการ?" mm="ဘယ်လိုအလုပ်အမျိုးအစားလုပ်ချင်လဲ?" />
            <div className="flex flex-wrap gap-2">
              {JOB_OPTS.map(j => (
                <button key={j.v} onClick={() => set('want_job', j.v)} type="button"
                  className={`rounded-full border-2 px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5
                    ${form.want_job === j.v ? 'bg-[#C9A84C] border-[#C9A84C] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                  <span>{j.emoji}</span>
                  <span>{j.v}</span>
                  <span className="opacity-70" style={{ fontFamily: 'Noto Sans Myanmar' }}>{j.mm}</span>
                </button>
              ))}
            </div>
            {form.want_job === 'อื่นๆ' && (
              <OtherInput value={form.want_job_other} onChange={v => set('want_job_other', v)} placeholder="ระบุประเภทงาน..." />
            )}

            {/* พื้นที่ต้องการ */}
            <QHeader num="ข้อ 21 / 25" th="บริเวณที่ต้องการทำงาน?" mm="အလုပ်လုပ်လိုသည့် နေရာ?" />
            <div className="flex flex-wrap gap-2">
              {QUICK_PROVINCES.map(p => (
                <button key={p.th} onClick={() => set('want_area', p.th)} type="button"
                  className={`rounded-full border-2 px-4 py-2 text-xs font-bold transition-all
                    ${form.want_area === p.th ? 'bg-[#C9A84C] border-[#C9A84C] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                  {p.th}
                  <span className="block text-[10px] font-normal opacity-70" style={{ fontFamily: 'Noto Sans Myanmar' }}>{p.mm}</span>
                </button>
              ))}
              <button onClick={() => set('want_area', 'อื่นๆ')} type="button"
                className={`rounded-full border-2 px-4 py-2 text-xs font-bold transition-all
                  ${form.want_area === 'อื่นๆ' ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                อื่นๆ ระบุเอง
              </button>
            </div>
            {form.want_area === 'อื่นๆ' && (
              <select value={form.want_area_other} onChange={e => set('want_area_other', e.target.value)}
                className="w-full border-2 border-[#C9A84C] rounded-xl px-4 py-3 text-sm bg-amber-50 focus:outline-none">
                <option value="">-- เลือกจังหวัด --</option>
                {ALL_PROVINCES.map(p => <option key={p.th} value={p.th}>{p.th} / {p.mm}</option>)}
              </select>
            )}

            {/* เงินเดือน */}
            <QHeader num="ข้อ 22 / 25" th="รายได้ที่คาดหวัง (บาท/เดือน)" mm="မျှော်မှန်းထားသည့် လစဉ်ဝင်ငွေ" />
            <TxtInput value={form.want_salary} onChange={v => set('want_salary', v)} placeholder="เช่น 15000" />

            {/* จุดเด่น */}
            <QHeader num="ข้อ 23 / 25" th="จุดเด่นของคุณ (เลือกได้หลายข้อ)" mm="သင်၏ ထူးချွန်ချက်" />
            <div className="flex flex-wrap gap-2">
              {STRENGTH_OPTS.map(s => {
                const isSel = form.strengths.includes(s.v)
                return (
                  <button key={s.v} onClick={() => toggleMulti('strengths', s.v)} type="button"
                    className={`rounded-full border-2 px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5
                      ${isSel ? 'bg-[#2B3FBE] border-[#2B3FBE] text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {s.emoji} {s.v}
                    <span className="opacity-70" style={{ fontFamily: 'Noto Sans Myanmar' }}>{s.mm}</span>
                  </button>
                )
              })}
            </div>
          </>}

          {/* ══ STEP 6: รูปถ่าย ══ */}
          {step === 6 && <>
            <QHeader num="ข้อ 24 / 25" th="รูปถ่ายหน้าตรง" mm="မျက်နှာတည့်တည့် ဓာတ်ပုံ" />
            <label className={`w-full rounded-2xl border-2 border-dashed px-4 py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${photoFile ? 'border-[#C9A84C] bg-amber-50' : 'border-gray-300 bg-white'}`}>
              <input type="file" accept="image/*" className="hidden" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
              {photoPreview ? (
                <img src={photoPreview} className="w-24 h-24 rounded-xl object-cover shadow" />
              ) : (
                <div className="text-4xl">📷</div>
              )}
              <div className="text-sm font-bold text-gray-600">{photoFile ? photoFile.name : 'แตะเพื่ออัปโหลดรูปถ่าย'}</div>
              <div className="text-xs text-gray-400" style={{ fontFamily: 'Noto Sans Myanmar' }}>ဓာတ်ပုံ တင်ရန် နှိပ်ပါ</div>
            </label>

            <QHeader num="ข้อ 25 / 25" th="เอกสาร (พาสปอร์ต, Work Permit ฯลฯ)" mm="နိုင်ငံကူးလက်မှတ်၊ လုပ်ငန်းခွင့်လက်မှတ် စသည်" />
            <label className={`w-full rounded-2xl border-2 border-dashed px-4 py-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${docFiles.length > 0 ? 'border-[#2B3FBE] bg-blue-50' : 'border-gray-300 bg-white'}`}>
              <input type="file" accept="image/*" multiple className="hidden" onChange={e => setDocFiles(Array.from(e.target.files || []))} />
              <div className="text-4xl">📄</div>
              <div className="text-sm font-bold text-gray-600">{docFiles.length > 0 ? `เลือกแล้ว ${docFiles.length} ไฟล์` : 'แตะเพื่ออัปโหลดเอกสาร'}</div>
              <div className="text-xs text-gray-400">เลือกได้หลายไฟล์ / <span style={{ fontFamily: 'Noto Sans Myanmar' }}>ဖိုင်များ ရွေးချယ်နိုင်</span></div>
            </label>
            {docFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {docFiles.map((f, i) => <span key={i} className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{f.name}</span>)}
              </div>
            )}
          </>}

          {/* ══ STEP 7: ยืนยัน ══ */}
          {step === 7 && <>
            {/* Avatar card */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="bg-[#C9A84C] pb-8 pt-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl mb-3 shadow-sm">
                  {form.gender === 'หญิง' ? '👩' : '👨'}
                </div>
                <div className="text-white font-black text-xl">{form.name || '(ไม่ระบุชื่อ)'}</div>
                <div className="text-white/80 text-sm mt-0.5">
                  {[wantJobVal, provinceVal].filter(Boolean).join(' • ') || 'ยังไม่ระบุ'}
                </div>
              </div>

              <div className="px-5 py-4 space-y-1 -mt-4 bg-white rounded-t-3xl">
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">👤 ส่วนตัว</div>
                <SummaryRow label="เบอร์โทร" value={user.phone} />
                <SummaryRow label="วันเกิด" value={birthday} />
                <SummaryRow label="เพศ / ကျား:" value={form.gender} />
                <SummaryRow label="เชื้อชาติ" value={raceVal} />
                <SummaryRow label="จังหวัด" value={provinceVal} />
                <SummaryRow label="Smart Card" value={form.smart_card} />
                <SummaryRow label="บัญชีธนาคาร" value={form.bank_account} />
                <SummaryRow label="ขับรถยนต์" value={form.drive_car} />
                <SummaryRow label="ใบขับขี่รถยนต์" value={form.car_license} />
                <SummaryRow label="ขับมอเตอร์ไซค์" value={form.drive_moto} />
                <SummaryRow label="ใบขับขี่มอเตอร์" value={form.moto_license} />

                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pt-3">🗣️ ภาษา & ทักษะ</div>
                <SummaryRow label="ไทย ฟัง+พูด" value={form.thai_listen} />
                <SummaryRow label="ไทย อ่าน+เขียน" value={form.thai_read} />
                <SummaryRow label="อังกฤษ ฟัง+พูด" value={form.eng_listen} />
                <SummaryRow label="อังกฤษ อ่าน+เขียน" value={form.eng_read} />
                <SummaryRow label="ทักษะพิเศษ" value={skillsVal} />

                {(form.w1_name || form.w2_name || form.w3_name) && <>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pt-3">💼 ประวัติงาน</div>
                  <SummaryRow label="งานที่ 1" value={[form.w1_name, form.w1_duration && `${form.w1_duration} ปี`, form.w1_salary && `${form.w1_salary}฿`].filter(Boolean).join(' · ')} />
                  <SummaryRow label="งานที่ 2" value={[form.w2_name, form.w2_duration && `${form.w2_duration} ปี`, form.w2_salary && `${form.w2_salary}฿`].filter(Boolean).join(' · ')} />
                  <SummaryRow label="งานที่ 3" value={[form.w3_name, form.w3_duration && `${form.w3_duration} ปี`, form.w3_salary && `${form.w3_salary}฿`].filter(Boolean).join(' · ')} />
                </>}

                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pt-3">🎯 งานที่ต้องการ</div>
                <SummaryRow label="ประเภท" value={wantJobVal} />
                <SummaryRow label="เงินเดือน" value={form.want_salary ? `${form.want_salary} บาท` : ''} />
                <SummaryRow label="จุดเด่น" value={form.strengths.join(', ')} />
              </div>
            </div>

            {/* เผยแพร่ banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="text-sm font-black text-blue-800 mb-1">📢 เผยแพร่สู่ตลาดแรงงาน?</div>
              <div className="text-xs text-blue-600 mb-0.5">นายจ้างและนายหน้าจะสามารถค้นหาเรซูเม่ได้</div>
              <div className="text-xs text-blue-400" style={{ fontFamily: 'Noto Sans Myanmar' }}>အလုပ်ရှင်နှင့် နှောင်ကြိုးများ Resume ကို ကြည့်ရှု့နိုင်မည်</div>
            </div>

            <div className="text-center text-xs text-gray-400">
              ⭐ ใช้ 1 เครดิต — คงเหลือ {user.credits} เครดิต
            </div>

          </>}

        </div>

        {/* ── Footer 2-button nav (fixed) ── */}
        <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center bg-gray-100 border-t border-gray-200">
        <div className="w-full max-w-sm px-4 pb-6 pt-3">
          {step < TOTAL_STEPS ? (
            <div className="flex gap-3">
              <button onClick={() => { if (step > 1) { setStep(s => s - 1); scrollTop() } else { router.back() } }}
                className="flex-1 rounded-full border-2 border-gray-400 bg-gray-100 text-gray-700 py-3.5 font-extrabold text-sm">
                ← ย้อนกลับ
                <span className="block text-xs font-normal opacity-60 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>နောက်သို့</span>
              </button>
              <button onClick={() => { setStep(s => s + 1); scrollTop() }} disabled={!canNext}
                className="flex-1 rounded-full bg-[#C9A84C] disabled:bg-gray-200 disabled:text-gray-400 text-white py-3.5 font-extrabold text-sm transition-colors">
                ถัดไป →
                <span className="block text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>ရှေ့ဆက်</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-3">
                <button onClick={() => handleSubmit(false)} disabled={saving}
                  className="flex-1 rounded-full border-2 border-gray-300 bg-white text-gray-600 py-3.5 font-extrabold text-sm disabled:opacity-40">
                  🔒 เก็บไว้ส่วนตัว
                  <span className="block text-xs font-normal opacity-60 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>ကိုယ်ပိုင်သိမ်းမည်</span>
                </button>
                <button onClick={() => handleSubmit(true)} disabled={saving}
                  className="flex-1 rounded-full bg-[#C9A84C] disabled:bg-gray-200 disabled:text-gray-400 text-white py-3.5 font-extrabold text-sm transition-colors">
                  {saving ? '...' : '✅ ยืนยันเผยแพร่'}
                  {!saving && <span className="block text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>အတည်ပြု</span>}
                </button>
              </div>
              <button onClick={() => { setStep(s => s - 1); scrollTop() }} disabled={saving}
                className="w-full rounded-full border-2 border-gray-300 bg-white text-gray-500 py-2.5 font-bold text-sm disabled:opacity-40">
                ← ย้อนกลับแก้ไข
                <span className="ml-1 opacity-60" style={{ fontFamily: 'Noto Sans Myanmar' }}>နောက်သို့</span>
              </button>
            </div>
          )}
        </div>
        </div>

      </div>
    </div>
  )
}
