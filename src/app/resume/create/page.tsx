'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User = { id: string; phone: string; credits: number }

const JOB_TYPES = [
  { th: 'โรงงาน', mm: 'စက်ရုံ' },
  { th: 'ก่อสร้าง', mm: 'ဆောက်လုပ်ရေး' },
  { th: 'เกษตร/ประมง', mm: 'စိုက်ပျိုးရေး/ငါးဖမ်း' },
  { th: 'แม่บ้าน/ดูแลผู้สูงอายุ', mm: 'အိမ်ရှင်မ/သက်ကြီးရွယ်အိုစောင့်ရှောက်' },
  { th: 'ร้านอาหาร/บริการ', mm: 'စားသောက်ဆိုင်/ဝန်ဆောင်မှု' },
  { th: 'ขับรถ/ส่งของ', mm: 'ယာဉ်မောင်း/ပို့ဆောင်' },
  { th: 'ช่างซ่อม/อิเล็กทรอนิกส์', mm: 'ပြုပြင်ရေးဆရာ/ဓာတ်မီးပညာ' },
  { th: 'อื่นๆ', mm: 'အခြား' },
]

const PROVINCES = [
  'กรุงเทพฯ','สมุทรปราการ','นนทบุรี','ปทุมธานี','พระนครศรีอยุธยา',
  'ชลบุรี','ระยอง','สมุทรสาคร','นครปฐม','ราชบุรี',
  'เชียงใหม่','เชียงราย','ลำพูน','สุราษฎร์ธานี','ภูเก็ต',
  'สงขลา','นครราชสีมา','ขอนแก่น','อุดรธานี','อื่นๆ',
]

const THAI_LEVELS = [
  { value: 'none', th: 'พูดไม่ได้เลย', mm: 'မပြောတတ်ဘူး' },
  { value: 'basic', th: 'นิดหน่อย', mm: 'အနည်းငယ်' },
  { value: 'good', th: 'สื่อสารได้', mm: 'ဆက်သွယ်နိုင်သည်' },
  { value: 'fluent', th: 'คล่องแคล่ว', mm: 'ကျွမ်းကျင်သည်' },
]

const EXPERIENCE_LEVELS = [
  { value: '0', th: 'ไม่มีประสบการณ์', mm: 'အတွေ့အကြုံမရှိ' },
  { value: '1', th: '1 ปี', mm: '၁ နှစ်' },
  { value: '2', th: '2-3 ปี', mm: '၂-၃ နှစ်' },
  { value: '5', th: '4-5 ปี', mm: '၄-၅ နှစ်' },
  { value: '6', th: 'มากกว่า 5 ปี', mm: '၅ နှစ်ကျော်' },
]

const GENDER_OPTIONS = [
  { value: 'male', th: 'ชาย', mm: 'ကျား' },
  { value: 'female', th: 'หญิง', mm: 'မ' },
]

type FormData = {
  name: string
  age: string
  gender: string
  nationality: string
  job_type: string
  province: string
  experience: string
  thai_level: string
  has_doc: boolean
  has_drive: boolean
  note: string
}

const TOTAL_STEPS = 4

export default function ResumeCreatePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormData>({
    name: '',
    age: '',
    gender: '',
    nationality: 'myanmar',
    job_type: '',
    province: '',
    experience: '',
    thai_level: '',
    has_doc: false,
    has_drive: false,
    note: '',
  })

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
  }, [])

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }))

  const canNextStep1 = form.name.trim().length > 0 && form.age.trim().length > 0 && form.gender !== ''
  const canNextStep2 = form.job_type !== '' && form.province !== ''
  const canNextStep3 = form.thai_level !== '' && form.experience !== ''

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('resumes').insert({
      user_id: user.id,
      name: form.name,
      age: parseInt(form.age) || null,
      gender: form.gender,
      nationality: form.nationality,
      job_type: form.job_type,
      province: form.province,
      experience: form.experience,
      thai_level: form.thai_level,
      has_doc: form.has_doc,
      has_drive: form.has_drive,
      note: form.note,
      suit_status: 'pending',
      is_public: false,
    })
    if (!error) {
      // deduct 1 credit
      await supabase
        .from('users')
        .update({ credits: user.credits - 1 })
        .eq('id', user.id)
      localStorage.setItem('aung_user', JSON.stringify({ ...user, credits: user.credits - 1 }))
    }
    setSaving(false)
    router.push('/dashboard')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 py-3 flex items-center gap-3">
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

        {/* Progress bar */}
        <div className="bg-white px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-[#2B3FBE]' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="text-xs text-gray-500">
            {step === 1 && <><span className="font-bold text-[#2B3FBE]">ข้อมูลส่วนตัว</span> · ข้อมูลงาน · ทักษะ · ยืนยัน</>}
            {step === 2 && <>ข้อมูลส่วนตัว · <span className="font-bold text-[#2B3FBE]">ข้อมูลงาน</span> · ทักษะ · ยืนยัน</>}
            {step === 3 && <>ข้อมูลส่วนตัว · ข้อมูลงาน · <span className="font-bold text-[#2B3FBE]">ทักษะ</span> · ยืนยัน</>}
            {step === 4 && <>ข้อมูลส่วนตัว · ข้อมูลงาน · ทักษะ · <span className="font-bold text-[#2B3FBE]">ยืนยัน</span></>}
          </div>
        </div>

        {/* Credit notice */}
        <div className="px-4 pt-3">
          <div className="bg-[#E8EBFF] rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-[#2B3FBE]">
            <span>⭐</span>
            <span>การสร้างเรซูเม่ใช้ <b>1 เครดิต</b> — คงเหลือ {user.credits} เครดิต</span>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 px-4 py-4 overflow-y-auto">

          {/* STEP 1: Personal info */}
          {step === 1 && (
            <div className="space-y-4">
              <SectionTitle th="ข้อมูลส่วนตัว" mm="ကိုယ်ရေးကိုယ်တာ သတင်းအချက်အလက်" />

              <Field label="ชื่อ-นามสกุล" labelMM="အမည်" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="ชื่อเต็ม / အမည်အပြည့်"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2B3FBE] bg-white"
                />
              </Field>

              <Field label="อายุ (ปี)" labelMM="အသက်" required>
                <input
                  type="number"
                  value={form.age}
                  onChange={e => set('age', e.target.value)}
                  placeholder="เช่น 25 / ဥပမာ ၂၅"
                  min={15} max={65}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2B3FBE] bg-white"
                />
              </Field>

              <Field label="เพศ" labelMM="လိင်" required>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map(g => (
                    <button key={g.value}
                      onClick={() => set('gender', g.value)}
                      className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${form.gender === g.value ? 'border-[#2B3FBE] bg-[#E8EBFF] text-[#2B3FBE]' : 'border-gray-200 bg-white text-gray-600'}`}>
                      {g.value === 'male' ? '👨 ' : '👩 '}{g.th}
                      <div className="text-xs font-normal opacity-70 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{g.mm}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="สัญชาติ" labelMM="နိုင်ငံသား">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'myanmar', th: '🇲🇲 เมียนมา', mm: 'မြန်မာ' },
                    { value: 'other', th: '🌏 อื่นๆ', mm: 'အခြား' },
                  ].map(n => (
                    <button key={n.value}
                      onClick={() => set('nationality', n.value)}
                      className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${form.nationality === n.value ? 'border-[#2B3FBE] bg-[#E8EBFF] text-[#2B3FBE]' : 'border-gray-200 bg-white text-gray-600'}`}>
                      {n.th}
                      <div className="text-xs font-normal opacity-70 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{n.mm}</div>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* STEP 2: Work info */}
          {step === 2 && (
            <div className="space-y-4">
              <SectionTitle th="ข้อมูลงาน" mm="အလုပ် သတင်းအချက်အလက်" />

              <Field label="ประเภทงานที่ต้องการ" labelMM="အလုပ်အမျိုးအစား" required>
                <div className="grid grid-cols-2 gap-2">
                  {JOB_TYPES.map(j => (
                    <button key={j.th}
                      onClick={() => set('job_type', j.th)}
                      className={`rounded-xl border-2 px-3 py-3 text-left text-xs font-bold transition-all ${form.job_type === j.th ? 'border-[#2B3FBE] bg-[#E8EBFF] text-[#2B3FBE]' : 'border-gray-200 bg-white text-gray-600'}`}>
                      {j.th}
                      <div className="font-normal opacity-70 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{j.mm}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="จังหวัดที่ต้องการทำงาน" labelMM="လုပ်ချင်သောခရိုင်" required>
                <select
                  value={form.province}
                  onChange={e => set('province', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2B3FBE] bg-white appearance-none">
                  <option value="">-- เลือกจังหวัด / ခရိုင်ရွေးချယ်ပါ --</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>

              <Field label="ประสบการณ์ทำงาน" labelMM="အလုပ်အတွေ့အကြုံ" required>
                <div className="space-y-2">
                  {EXPERIENCE_LEVELS.map(e => (
                    <button key={e.value}
                      onClick={() => set('experience', e.value)}
                      className={`w-full rounded-xl border-2 px-4 py-2.5 text-left text-sm font-bold transition-all flex items-center justify-between ${form.experience === e.value ? 'border-[#2B3FBE] bg-[#E8EBFF] text-[#2B3FBE]' : 'border-gray-200 bg-white text-gray-600'}`}>
                      <span>{e.th}</span>
                      <span className="text-xs font-normal opacity-70" style={{ fontFamily: 'Noto Sans Myanmar' }}>{e.mm}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* STEP 3: Skills */}
          {step === 3 && (
            <div className="space-y-4">
              <SectionTitle th="ทักษะ & ความสามารถ" mm="ကျွမ်းကျင်မှုနှင့် စွမ်းရည်" />

              <Field label="ระดับภาษาไทย" labelMM="ထိုင်းဘာသာစကား အဆင့်" required>
                <div className="space-y-2">
                  {THAI_LEVELS.map(t => (
                    <button key={t.value}
                      onClick={() => set('thai_level', t.value)}
                      className={`w-full rounded-xl border-2 px-4 py-2.5 text-left text-sm font-bold transition-all flex items-center justify-between ${form.thai_level === t.value ? 'border-[#2B3FBE] bg-[#E8EBFF] text-[#2B3FBE]' : 'border-gray-200 bg-white text-gray-600'}`}>
                      <span>{t.th}</span>
                      <span className="text-xs font-normal opacity-70" style={{ fontFamily: 'Noto Sans Myanmar' }}>{t.mm}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="space-y-2">
                <div className="text-sm font-bold text-gray-700 mb-1">ข้อมูลเพิ่มเติม / <span className="font-normal text-xs" style={{ fontFamily: 'Noto Sans Myanmar' }}>နောက်ထပ်အချက်အလက်</span></div>
                <label className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-4 py-3 cursor-pointer active:bg-gray-50">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${form.has_doc ? 'bg-[#2B3FBE] border-[#2B3FBE]' : 'border-gray-300'}`}
                    onClick={() => set('has_doc', !form.has_doc)}>
                    {form.has_doc && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-700">มีเอกสารถูกต้องตามกฎหมาย</div>
                    <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>တရားဝင်စာရွက်စာတမ်းများရှိသည်</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-4 py-3 cursor-pointer active:bg-gray-50">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${form.has_drive ? 'bg-[#2B3FBE] border-[#2B3FBE]' : 'border-gray-300'}`}
                    onClick={() => set('has_drive', !form.has_drive)}>
                    {form.has_drive && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-700">มีใบขับขี่</div>
                    <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>ယာဉ်မောင်းလိုင်စင်ရှိသည်</div>
                  </div>
                </label>
              </div>

              <Field label="หมายเหตุเพิ่มเติม (ไม่บังคับ)" labelMM="မှတ်ချက် (မဖြစ်မနေမဟုတ်)">
                <textarea
                  value={form.note}
                  onChange={e => set('note', e.target.value)}
                  rows={3}
                  placeholder="ข้อมูลอื่นๆ ที่อยากให้นายจ้างรู้ / အလုပ်ရှင်သိစေချင်သောအချက်"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2B3FBE] bg-white resize-none"
                />
              </Field>
            </div>
          )}

          {/* STEP 4: Confirm */}
          {step === 4 && (
            <div className="space-y-3">
              <SectionTitle th="ตรวจสอบข้อมูล" mm="အချက်အလက် စစ်ဆေးပါ" />

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="bg-[#2B3FBE] px-4 py-3">
                  <div className="text-white font-black text-base">{form.name}</div>
                  <div className="text-white/70 text-xs mt-0.5">
                    {form.gender === 'male' ? '👨 ชาย' : '👩 หญิง'} · อายุ {form.age} ปี · {form.nationality === 'myanmar' ? '🇲🇲 เมียนมา' : '🌏 อื่นๆ'}
                  </div>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  <SummaryRow label="ประเภทงาน" value={form.job_type} />
                  <SummaryRow label="จังหวัด" value={form.province} />
                  <SummaryRow label="ประสบการณ์" value={
                    EXPERIENCE_LEVELS.find(e => e.value === form.experience)?.th || form.experience
                  } />
                  <SummaryRow label="ภาษาไทย" value={
                    THAI_LEVELS.find(t => t.value === form.thai_level)?.th || form.thai_level
                  } />
                  <SummaryRow label="เอกสาร" value={form.has_doc ? '✓ มี' : '✗ ไม่มี'} />
                  <SummaryRow label="ใบขับขี่" value={form.has_drive ? '✓ มี' : '✗ ไม่มี'} />
                  {form.note && <SummaryRow label="หมายเหตุ" value={form.note} />}
                </div>
              </div>

              <div className="bg-[#FFF8E8] border border-[#C9A84C]/30 rounded-xl px-4 py-3 text-xs text-[#8B6914]">
                <div className="font-bold mb-1">⭐ ใช้ 1 เครดิต</div>
                <div>เรซูเม่จะถูกสร้างและรอการพิมพ์สูท กรุณาตรวจสอบข้อมูลให้ถูกต้อง</div>
                <div className="mt-1" style={{ fontFamily: 'Noto Sans Myanmar' }}>Resume ပြုလုပ်ပြီး Print ထုတ်ရန် စောင့်ဆိုင်းပါမည်</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer button */}
        <div className="px-4 pb-8 pt-3 bg-[#F4F5FB]">
          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && !canNextStep1) ||
                (step === 2 && !canNextStep2) ||
                (step === 3 && !canNextStep3)
              }
              className="w-full bg-[#2B3FBE] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl py-4 font-extrabold text-base transition-colors">
              ถัดไป →
              <div className="text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>ရှေ့ဆက်ရန်</div>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-[#C9A84C] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl py-4 font-extrabold text-base transition-colors">
              {saving ? 'กำลังบันทึก...' : '✓ สร้างเรซูเม่ (ใช้ 1 เครดิต)'}
              {!saving && <div className="text-xs font-normal opacity-80 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>Resume ပြုလုပ်မည် (၁ ခရက်ဒစ်)</div>}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

function SectionTitle({ th, mm }: { th: string; mm: string }) {
  return (
    <div className="mb-2">
      <div className="text-base font-extrabold text-gray-800">{th}</div>
      <div className="text-xs text-gray-400" style={{ fontFamily: 'Noto Sans Myanmar' }}>{mm}</div>
    </div>
  )
}

function Field({ label, labelMM, required, children }: {
  label: string; labelMM?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className="text-sm font-bold text-gray-700">{label}</span>
        {required && <span className="text-red-400 text-xs">*</span>}
        {labelMM && <span className="text-xs text-gray-400" style={{ fontFamily: 'Noto Sans Myanmar' }}>{labelMM}</span>}
      </div>
      {children}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-gray-400 w-24 flex-shrink-0">{label}</span>
      <span className="font-bold text-gray-800 flex-1">{value}</span>
    </div>
  )
}
