'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User = { id: string; phone: string; credits: number }

// =============== DATA ===============

const PROVINCES = [
  'กรุงเทพฯ','สมุทรปราการ','นนทบุรี','ปทุมธานี','พระนครศรีอยุธยา',
  'ชลบุรี','ระยอง','จันทบุรี','ตราด','ฉะเชิงเทรา',
  'สมุทรสาคร','นครปฐม','ราชบุรี','เพชรบุรี','ประจวบคีรีขันธ์',
  'เชียงใหม่','เชียงราย','ลำพูน','ลำปาง','พะเยา',
  'แม่ฮ่องสอน','น่าน','แพร่','อุตรดิตถ์','สุโขทัย',
  'พิษณุโลก','พิจิตร','กำแพงเพชร','ตาก','นครสวรรค์',
  'สุราษฎร์ธานี','ภูเก็ต','กระบี่','พังงา','นครศรีธรรมราช',
  'สงขลา','ตรัง','พัทลุง','สตูล','ปัตตานี',
  'นครราชสีมา','ขอนแก่น','อุดรธานี','หนองคาย','สกลนคร',
  'อุบลราชธานี','ศรีสะเกษ','สุรินทร์','บุรีรัมย์','ชัยภูมิ',
  'อื่นๆ/အခြား',
]

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
  { v: 'อื่นๆ', mm: 'အခြား' },
]

const JOB_OPTS = [
  { v: 'โรงงาน', mm: 'စက်ရုံ' },
  { v: 'ก่อสร้าง', mm: 'ဆောက်လုပ်ရေး' },
  { v: 'แม่บ้าน', mm: 'အိမ်အကူ' },
  { v: 'พนักงานขาย', mm: 'အရောင်းဝန်ထမ်း' },
  { v: 'อื่นๆ', mm: 'အခြား' },
]

const SKILL_OPTS = [
  { v: 'เชื่อมเหล็ก', mm: 'သံဆက်' },
  { v: 'เย็บผ้า', mm: 'အချုပ်' },
  { v: 'โฟล์คลิฟท์', mm: 'ဖိုကလစ်' },
  { v: 'ทำอาหาร', mm: 'ချက်ပြုတ်' },
  { v: 'อื่นๆ', mm: 'အခြား' },
  { v: 'ไม่มี', mm: 'မရှိပါ' },
]

const STRENGTH_OPTS = [
  { v: 'ขยันอดทน', mm: 'ကြိုးစားသည်' },
  { v: 'ซื่อสัตย์', mm: 'သစ္စာရှိ' },
  { v: 'เรียนรู้งานไว', mm: 'သင်ယူမှုမြန်' },
  { v: 'ตรงต่อเวลา', mm: 'အချိန်တိကျ' },
  { v: 'ทำงานล่วงเวลาได้', mm: 'OT ဆင်းနိုင်' },
]

const GENDER_OPTS = [
  { v: 'ชาย', mm: 'ကျား' },
  { v: 'หญิง', mm: 'မ' },
]

const TOTAL_STEPS = 6

type FormData = {
  name: string
  birthday: string
  gender: string
  race: string
  province: string
  smart_card: string
  bank_account: string
  drive_car: string
  car_license: string
  drive_moto: string
  moto_license: string
  thai_listen: string
  thai_read: string
  eng_listen: string
  eng_read: string
  skills: string[]
  w1_name: string
  w1_duration: string
  w1_salary: string
  w2_name: string
  w2_duration: string
  w2_salary: string
  w3_name: string
  w3_duration: string
  w3_salary: string
  want_job: string
  want_area: string
  want_salary: string
  strengths: string[]
}

const INIT: FormData = {
  name: '', birthday: '', gender: '', race: '', province: '',
  smart_card: '', bank_account: '', drive_car: '', car_license: '', drive_moto: '', moto_license: '',
  thai_listen: '', thai_read: '', eng_listen: '', eng_read: '',
  skills: [],
  w1_name: '', w1_duration: '', w1_salary: '',
  w2_name: '', w2_duration: '', w2_salary: '',
  w3_name: '', w3_duration: '', w3_salary: '',
  want_job: '', want_area: '', want_salary: '',
  strengths: [],
}

// =============== COMPONENTS ===============

function Q({ num, th, mm, required }: { num: string; th: string; mm: string; required?: boolean }) {
  return (
    <div className="mb-2">
      <div className="text-sm font-extrabold text-gray-800 flex items-baseline gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold text-[#2B3FBE] bg-[#E8EBFF] px-1.5 py-0.5 rounded-full flex-shrink-0">{num}</span>
        {th}{required && <span className="text-red-400 text-xs">*</span>}
      </div>
      <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{mm}</div>
    </div>
  )
}

function BtnGrid({ opts, value, onChange, multi }: {
  opts: { v: string; mm: string }[]
  value: string | string[]
  onChange: (v: string) => void
  multi?: boolean
}) {
  const isSelected = (v: string) => multi
    ? (value as string[]).includes(v)
    : value === v
  return (
    <div className="grid grid-cols-2 gap-2">
      {opts.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} type="button"
          className={`rounded-xl border-2 px-3 py-2.5 text-left text-xs font-bold transition-all
            ${isSelected(o.v) ? 'border-[#2B3FBE] bg-[#E8EBFF] text-[#2B3FBE]' : 'border-gray-200 bg-white text-gray-600'}`}>
          {o.v}
          <div className="font-normal opacity-70 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{o.mm}</div>
        </button>
      ))}
    </div>
  )
}

function TxtInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2B3FBE] bg-white" />
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 text-xs py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 w-28 flex-shrink-0">{label}</span>
      <span className="font-bold text-gray-800 flex-1 break-words">{value}</span>
    </div>
  )
}

// =============== MAIN PAGE ===============

export default function ResumeCreatePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormData>(INIT)

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
  }, [])

  const set = (field: keyof FormData, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const toggleMulti = (field: 'skills' | 'strengths', value: string) =>
    setForm(f => {
      const arr = f[field] as string[]
      return { ...f, [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] }
    })

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('resumes').insert({
      user_id: user.id,
      name: form.name,
      birthday: form.birthday || null,
      gender: form.gender || null,
      race: form.race || null,
      province: form.province || null,
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
      skills: form.skills.length ? form.skills.join(', ') : null,
      w1_name: form.w1_name || null,
      w1_duration: form.w1_duration || null,
      w1_salary: form.w1_salary || null,
      w2_name: form.w2_name || null,
      w2_duration: form.w2_duration || null,
      w2_salary: form.w2_salary || null,
      w3_name: form.w3_name || null,
      w3_duration: form.w3_duration || null,
      w3_salary: form.w3_salary || null,
      want_job: form.want_job || null,
      want_area: form.want_area || null,
      want_salary: form.want_salary || null,
      strengths: form.strengths.length ? form.strengths.join(', ') : null,
      job_type: form.want_job || null,
      suit_status: 'pending',
      is_public: false,
    })
    await supabase.from('users').update({ credits: user.credits - 1 }).eq('id', user.id)
    localStorage.setItem('aung_user', JSON.stringify({ ...user, credits: user.credits - 1 }))
    setSaving(false)
    router.push('/dashboard')
  }

  if (!user) return null

  const STEP_LABELS = ['ส่วนตัว','เอกสาร','ภาษา','ประวัติงาน','ต้องการ','ยืนยัน']

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
            className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            ←
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base">สร้างเรซูเม่</div>
            <div className="text-white/70 text-xs" style={{ fontFamily: 'Noto Sans Myanmar' }}>Resume ပြုလုပ်ရန်</div>
          </div>
          <div className="text-white/70 text-xs font-bold">{step}/{TOTAL_STEPS}</div>
        </div>

        {/* Progress */}
        <div className="bg-white px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-1 mb-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-[#2B3FBE]' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="flex justify-between">
            {STEP_LABELS.map((l, i) => (
              <span key={i} className={`text-[10px] font-bold ${i + 1 === step ? 'text-[#2B3FBE]' : 'text-gray-300'}`}>{l}</span>
            ))}
          </div>
        </div>

        {/* Credit */}
        <div className="px-4 pt-3 flex-shrink-0">
          <div className="bg-[#E8EBFF] rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-[#2B3FBE]">
            <span>⭐</span>
            <span>ใช้ <b>1 เครดิต</b> — คงเหลือ {user.credits} เครดิต</span>
          </div>
        </div>

        {/* ===== Content ===== */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

          {/* STEP 1: ส่วนตัว */}
          {step === 1 && <>
            <div>
              <Q num="2/29" th="ชื่อ-นามสกุล ภาษาอังกฤษ" mm="အမည် အင်္ဂလိပ်ဘာသာ" required />
              <TxtInput value={form.name} onChange={v => set('name', v.toUpperCase())} placeholder="FIRSTNAME LASTNAME" />
            </div>

            <div>
              <Q num="3/29" th="วันเกิด (วว/ดด/ปปปป)" mm="မွေးသက္ကရာဇ် (ဥပမာ ၂၁/၀၂/၁၉၈၈)" />
              <TxtInput value={form.birthday} onChange={v => set('birthday', v)} placeholder="21/02/1988" />
            </div>

            <div>
              <Q num="4/29" th="เพศ" mm="ကျား/မ" />
              <BtnGrid opts={GENDER_OPTS} value={form.gender} onChange={v => set('gender', v)} />
            </div>

            <div>
              <Q num="5/29" th="เชื้อชาติ" mm="လူမျိုး" />
              <BtnGrid opts={RACE_OPTS} value={form.race} onChange={v => set('race', v)} />
            </div>

            <div>
              <Q num="6/29" th="จังหวัดที่อยู่ปัจจุบัน" mm="လက်ရှိနေထိုင်သည့် ခရိုင်" />
              <select value={form.province} onChange={e => set('province', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2B3FBE] bg-white">
                <option value="">-- เลือกจังหวัด / ခရိုင်ရွေးချယ်ပါ --</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </>}

          {/* STEP 2: เอกสาร & ขับขี่ */}
          {step === 2 && <>
            <div>
              <Q num="7/29" th="มี Smart Card / Work Permit ไหม" mm="Smart Card Work Permit ရှိပါသလား" />
              <BtnGrid opts={YES_NO} value={form.smart_card} onChange={v => set('smart_card', v)} />
            </div>

            <div>
              <Q num="8/29" th="มีบัญชีธนาคารไทยไหม" mm="ထိုင်းဘဏ်အကောင့် ရှိပါသလား" />
              <BtnGrid opts={YES_NO} value={form.bank_account} onChange={v => set('bank_account', v)} />
            </div>

            <div>
              <Q num="9/29" th="ขับรถยนต์ได้ไหม" mm="ကားမောင်းတတ်ပါသလား" />
              <BtnGrid opts={CAN_CANNOT} value={form.drive_car} onChange={v => set('drive_car', v)} />
            </div>

            <div>
              <Q num="10/29" th="มีใบขับขี่รถยนต์ไทยไหม" mm="ထိုင်းကားမောင်းလိုင်စင် ရှိပါသလား" />
              <BtnGrid opts={YES_NO} value={form.car_license} onChange={v => set('car_license', v)} />
            </div>

            <div>
              <Q num="11/29" th="ขับรถจักรยานยนต์ได้ไหม" mm="ဆိုင်ကယ်မောင်းတတ်ပါသလား" />
              <BtnGrid opts={CAN_CANNOT} value={form.drive_moto} onChange={v => set('drive_moto', v)} />
            </div>

            <div>
              <Q num="12/29" th="มีใบขับขี่จักรยานยนต์ไทยไหม" mm="ထိုင်းဆိုင်ကယ်လိုင်စင် ရှိပါသလား" />
              <BtnGrid opts={YES_NO} value={form.moto_license} onChange={v => set('moto_license', v)} />
            </div>
          </>}

          {/* STEP 3: ภาษา & ทักษะ */}
          {step === 3 && <>
            <div>
              <Q num="13/29" th="ภาษาไทย (ฟัง+พูด)" mm="ထိုင်းဘာသာစကား (နားထောင်+ပြောဆို)" />
              <BtnGrid opts={LANG_OPTS} value={form.thai_listen} onChange={v => set('thai_listen', v)} />
            </div>

            <div>
              <Q num="14/29" th="ภาษาไทย (อ่าน+เขียน)" mm="ထိုင်းဘာသာစကား (ဖတ်+ရေး)" />
              <BtnGrid opts={LANG_OPTS} value={form.thai_read} onChange={v => set('thai_read', v)} />
            </div>

            <div>
              <Q num="15/29" th="ภาษาอังกฤษ (ฟัง+พูด)" mm="အင်္ဂလိပ်ဘာသာစကား (နားထောင်+ပြောဆို)" />
              <BtnGrid opts={LANG_OPTS} value={form.eng_listen} onChange={v => set('eng_listen', v)} />
            </div>

            <div>
              <Q num="16/29" th="ภาษาอังกฤษ (อ่าน+เขียน)" mm="အင်္ဂလိပ်ဘာသာစကား (ဖတ်+ရေး)" />
              <BtnGrid opts={LANG_OPTS} value={form.eng_read} onChange={v => set('eng_read', v)} />
            </div>

            <div>
              <Q num="17/29" th="ทักษะพิเศษ (เลือกได้หลายข้อ)" mm="ထူးချွန်သည့်ကျွမ်းကျင်မှုများ" />
              <BtnGrid opts={SKILL_OPTS} value={form.skills} onChange={v => toggleMulti('skills', v)} multi />
            </div>
          </>}

          {/* STEP 4: ประวัติงาน */}
          {step === 4 && <>
            {([
              { num: '18/29', label: 'ประวัติงาน 1', mm: 'အလုပ်အကိုင်သမိုင်း ၁', n: 'w1_name' as const, d: 'w1_duration' as const, s: 'w1_salary' as const },
              { num: '19/29', label: 'ประวัติงาน 2', mm: 'အလုပ်အကိုင်သမိုင်း ၂', n: 'w2_name' as const, d: 'w2_duration' as const, s: 'w2_salary' as const },
              { num: '20/29', label: 'ประวัติงาน 3', mm: 'အလုပ်အကိုင်သမိုင်း ၃', n: 'w3_name' as const, d: 'w3_duration' as const, s: 'w3_salary' as const },
            ]).map(w => (
              <div key={w.num} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-[#2B3FBE] bg-[#E8EBFF] px-1.5 py-0.5 rounded-full">{w.num}</span>
                  <span className="text-sm font-extrabold text-gray-800 ml-1.5">{w.label}</span>
                  <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{w.mm}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1">ชื่อบริษัท/โรงงาน / <span style={{ fontFamily: 'Noto Sans Myanmar' }}>ကုမ္ပဏီ/စက်ရုံ</span></div>
                  <TxtInput value={form[w.n]} onChange={v => set(w.n, v)} placeholder="ชื่อบริษัท / ကုမ္ပဏီအမည်" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1">ทำมากี่ปี / <span style={{ fontFamily: 'Noto Sans Myanmar' }}>နှစ်</span></div>
                    <TxtInput value={form[w.d]} onChange={v => set(w.d, v)} placeholder="เช่น 2" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1">รายได้/เดือน / <span style={{ fontFamily: 'Noto Sans Myanmar' }}>လစာ</span></div>
                    <TxtInput value={form[w.s]} onChange={v => set(w.s, v)} placeholder="เช่น 12000" />
                  </div>
                </div>
              </div>
            ))}
          </>}

          {/* STEP 5: ต้องการ & จุดเด่น */}
          {step === 5 && <>
            <div>
              <Q num="21/29" th="ประเภทงานที่ต้องการ" mm="ဘယ်လိုအလုပ်အမျိုးအစားလုပ်ချင်လဲ" />
              <BtnGrid opts={JOB_OPTS} value={form.want_job} onChange={v => set('want_job', v)} />
            </div>

            <div>
              <Q num="22/29" th="บริเวณที่ต้องการทำงาน" mm="အလုပ်လုပ်လိုသည့် နေရာ" />
              <select value={form.want_area} onChange={e => set('want_area', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2B3FBE] bg-white">
                <option value="">-- เลือกจังหวัด / ခရိုင်ရွေးချယ်ပါ --</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <Q num="23/29" th="รายได้รวมต่อเดือนที่คาดหวัง (บาท)" mm="မျှော်မှန်းထားသည့် လစဉ်ဝင်ငွေ" />
              <TxtInput value={form.want_salary} onChange={v => set('want_salary', v)} placeholder="เช่น 15000" />
            </div>

            <div>
              <Q num="24/29" th="จุดเด่นของคุณ (เลือกได้หลายข้อ)" mm="သင်၏ ထူးချွန်ချက် (တစ်ချက်ချင်းစီ ရွေးရန်)" />
              {form.strengths.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {form.strengths.map(s => (
                    <span key={s} className="bg-[#2B3FBE] text-white text-xs font-bold px-2.5 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              )}
              <BtnGrid opts={STRENGTH_OPTS} value={form.strengths} onChange={v => toggleMulti('strengths', v)} multi />
            </div>
          </>}

          {/* STEP 6: ยืนยัน */}
          {step === 6 && <>
            <div>
              <div className="text-base font-extrabold text-gray-800">ตรวจสอบข้อมูล</div>
              <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>အချက်အလက်များ စစ်ဆေးပါ</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-[#2B3FBE] px-4 py-3">
                <div className="text-white font-black text-base">{form.name || '(ไม่ระบุ)'}</div>
                <div className="text-white/70 text-xs mt-0.5 flex flex-wrap gap-2">
                  {form.gender && <span>{form.gender}</span>}
                  {form.birthday && <span>· {form.birthday}</span>}
                  {form.race && <span>· {form.race}</span>}
                </div>
              </div>
              <div className="px-4 py-3">
                <SummaryRow label="โทรศัพท์" value={user.phone} />
                <SummaryRow label="จังหวัด" value={form.province} />
                <SummaryRow label="Smart Card" value={form.smart_card} />
                <SummaryRow label="บัญชีธนาคาร" value={form.bank_account} />
                <SummaryRow label="ขับรถยนต์" value={form.drive_car} />
                <SummaryRow label="ใบขับขี่รถยนต์" value={form.car_license} />
                <SummaryRow label="ขับมอเตอร์ไซค์" value={form.drive_moto} />
                <SummaryRow label="ใบขับขี่มอเตอร์" value={form.moto_license} />
                <SummaryRow label="ไทย ฟัง+พูด" value={form.thai_listen} />
                <SummaryRow label="ไทย อ่าน+เขียน" value={form.thai_read} />
                <SummaryRow label="อังกฤษ ฟัง+พูด" value={form.eng_listen} />
                <SummaryRow label="อังกฤษ อ่าน+เขียน" value={form.eng_read} />
                <SummaryRow label="ทักษะพิเศษ" value={form.skills.join(', ')} />
                <SummaryRow label="งานที่ 1" value={[form.w1_name, form.w1_duration && `${form.w1_duration} ปี`, form.w1_salary && `${form.w1_salary}฿`].filter(Boolean).join(' · ')} />
                <SummaryRow label="งานที่ 2" value={[form.w2_name, form.w2_duration && `${form.w2_duration} ปี`, form.w2_salary && `${form.w2_salary}฿`].filter(Boolean).join(' · ')} />
                <SummaryRow label="งานที่ 3" value={[form.w3_name, form.w3_duration && `${form.w3_duration} ปี`, form.w3_salary && `${form.w3_salary}฿`].filter(Boolean).join(' · ')} />
                <SummaryRow label="งานที่ต้องการ" value={form.want_job} />
                <SummaryRow label="พื้นที่ต้องการ" value={form.want_area} />
                <SummaryRow label="เงินเดือนที่ต้องการ" value={form.want_salary ? `${form.want_salary} บาท` : ''} />
                <SummaryRow label="จุดเด่น" value={form.strengths.join(', ')} />
              </div>
            </div>

            <div className="bg-[#FFF8E8] border border-[#C9A84C]/30 rounded-xl px-4 py-3 text-xs text-[#8B6914]">
              <div className="font-bold mb-1">⭐ ใช้ 1 เครดิต</div>
              <div>ตรวจสอบให้ถูกต้องก่อนยืนยัน ระบบจะสร้างเรซูเม่ให้อัตโนมัติ</div>
              <div className="mt-1 opacity-80" style={{ fontFamily: 'Noto Sans Myanmar' }}>အတည်ပြုမည်ဆိုက Resume အလိုအလျောက်ပြုလုပ်ပေးမည်</div>
            </div>
          </>}

        </div>

        {/* Footer */}
        <div className="px-4 pb-8 pt-3 bg-[#F4F5FB] flex-shrink-0">
          {step < TOTAL_STEPS ? (
            <button onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !form.name.trim()}
              className="w-full bg-[#2B3FBE] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl py-4 font-extrabold text-base transition-colors">
              ถัดไป →
              <div className="text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>ရှေ့ဆက်ရန်</div>
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="w-full bg-[#C9A84C] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl py-4 font-extrabold text-base transition-colors">
              {saving ? 'กำลังบันทึก...' : '✓ ยืนยันสร้างเรซูเม่ (1 เครดิต)'}
              {!saving && <div className="text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>Resume ပြုလုပ်မည်</div>}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
