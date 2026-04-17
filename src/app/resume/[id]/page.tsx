'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Resume = {
  id: string; user_id: string; name: string; birthday: string; gender: string; race: string; province: string;
  smart_card: string; bank_account: string; drive_car: string; car_license: string; drive_moto: string; moto_license: string;
  thai_listen: string; thai_read: string; eng_listen: string; eng_read: string;
  skills: string; w1_name: string; w1_duration: string; w1_salary: string;
  w2_name: string; w2_duration: string; w2_salary: string; w3_name: string; w3_duration: string; w3_salary: string;
  want_job: string; want_area: string; want_salary: string; strengths: string;
  photo_url: string; suit_photo_url: string; suit_status: string; is_public: boolean; created_at: string;
}

function getLangWidth(val: string) {
  if (!val) return '5%'
  if (val.includes('ดีมาก')) return '90%'
  if (val.includes('ดี'))    return '70%'
  if (val.includes('พอใช้')) return '40%'
  return '5%'
}

function calcAge(birthday: string) {
  if (!birthday) return ''
  const parts = birthday.split('/')
  if (parts.length < 3) return ''
  const bYear = parseInt(parts[2]) > 2500 ? parseInt(parts[2]) - 543 : parseInt(parts[2])
  const bDate = new Date(bYear, parseInt(parts[1]) - 1, parseInt(parts[0]))
  const age   = Math.floor((Date.now() - bDate.getTime()) / (365.25 * 24 * 3600 * 1000))
  return isNaN(age) ? '' : `${age} ปี`
}

export default function ResumeDetailPage() {
  const router  = useRouter()
  const params  = useParams()
  const id      = params?.id as string

  const cardRef     = useRef<HTMLDivElement>(null)
  const hasTriedRef = useRef(false)

  const [resume,      setResume]      = useState<Resume | null>(null)
  const [phone,       setPhone]       = useState('')
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [generating,  setGenerating]  = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (u) setCurrentUser(JSON.parse(u))
    if (id) loadResume()
  }, [id])

  const loadResume = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('resumes').select('*').eq('id', id).single()
    if (error || !data) { setNotFound(true); setLoading(false); return }
    setResume(data as Resume)
    const { data: u } = await supabase.from('users').select('id, phone').eq('id', data.user_id).single()
    if (u) setPhone((u as { id: string; phone: string }).phone)
    setLoading(false)
    if ((data.suit_status === 'pending' || data.suit_status === 'error') && data.photo_url && !hasTriedRef.current) {
      hasTriedRef.current = true
      triggerGenerate(data.id)
    }
  }

  const triggerGenerate = async (resumeId: string) => {
    setGenerating(true)
    try {
      const res  = await fetch('/api/suit/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ resume_id: resumeId }),
      })
      const data = await res.json()
      if (data.suit_photo_url) {
        setResume(prev => prev ? { ...prev, suit_photo_url: data.suit_photo_url, suit_status: 'done' } : prev)
      } else {
        setResume(prev => prev ? { ...prev, suit_status: 'error' } : prev)
      }
    } catch {
      setResume(prev => prev ? { ...prev, suit_status: 'error' } : prev)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadImage = async () => {
    const el = cardRef.current
    if (!el) return
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' })

      // แปลงเป็น JPEG → แสดง preview เต็มจอ ให้ผู้ใช้กดค้างเพื่อบันทึก (iOS/Android)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
      }, 'image/jpeg', 0.92)

    } catch { alert('โหลดรูปไม่สำเร็จ กรุณาลองใหม่') }
  }

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const handleDownloadPDF = () => window.print()

  if (loading) return (
    <div className="min-h-screen bg-[#F4F5FB] flex items-center justify-center">
      <div className="text-gray-400 text-sm">กำลังโหลด... / တင်နေသည်...</div>
    </div>
  )
  if (notFound || !resume) return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center justify-center gap-4 px-6">
      <div className="text-5xl">😕</div>
      <div className="text-base font-bold text-gray-700">ไม่พบเรซูเม่นี้</div>
      <button onClick={() => router.back()} className="bg-[#2B3FBE] text-white rounded-xl px-6 py-2.5 text-sm font-bold">← ย้อนกลับ</button>
    </div>
  )

  const isOwner = currentUser?.id === resume.user_id
  const photoSrc = resume.suit_photo_url || resume.photo_url || ''
  const age = calcAge(resume.birthday)
  const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
  const strengthText = resume.strengths || resume.skills || 'แรงงานมีประสบการณ์ ขยัน ตรงต่อเวลา'
  const works = [
    { name: resume.w1_name, dur: resume.w1_duration, sal: resume.w1_salary },
    { name: resume.w2_name, dur: resume.w2_duration, sal: resume.w2_salary },
    { name: resume.w3_name, dur: resume.w3_duration, sal: resume.w3_salary },
  ].filter(w => w.name)

  return (
    <div className="min-h-screen bg-[#f4f7f9]">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
        .skill-bar-fill { transition: width 0.6s ease; }
      `}</style>

      {/* ── Action bar ── */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-100 px-3 py-2 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 text-sm font-bold">← กลับ</button>
          <div className="flex-1" />
          {isOwner && resume.suit_status === 'error' && (
            <button onClick={() => { hasTriedRef.current = false; triggerGenerate(resume.id) }}
              className="bg-orange-500 text-white rounded-xl px-3 py-1.5 text-xs font-bold">
              🔄 สร้างสูทใหม่
            </button>
          )}
          <button onClick={handleDownloadImage} className="bg-[#2575fc] text-white rounded-xl px-3 py-1.5 text-xs font-bold">
            🖼️ บันทึกรูป
          </button>
          <button onClick={handleDownloadPDF} className="bg-[#6a11cb] text-white rounded-xl px-3 py-1.5 text-xs font-bold">
            📄 PDF
          </button>
        </div>
        {generating && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl py-2 px-3 text-xs text-blue-700 text-center animate-pulse">
            ⚙️ AI กำลังสร้างชุดสูท... / AI ဝတ်စုံ ဖန်တီးနေသည်...
          </div>
        )}
      </div>

      {/* ── Resume Card (v147 design) ── */}
      <div ref={cardRef} className="max-w-lg mx-auto bg-white shadow-lg overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>

        {/* ── HEADER: gradient + photo + name ── */}
        <div style={{ background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', padding: '40px 32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.25)', overflow: 'hidden', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {generating ? (
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 1s linear infinite' }} />
            ) : photoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoSrc} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
            ) : (
              <span style={{ fontSize: 48 }}>{resume.gender === 'หญิง' ? '👩' : '👨'}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: 26, letterSpacing: 0.5, lineHeight: 1.2, marginBottom: 6 }}>
              {resume.name || 'ไม่ระบุชื่อ'}
            </div>
            {phone && <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 }}>📞 {phone}</div>}
            <div style={{ background: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '4px 14px', borderRadius: 20, color: 'white', fontSize: 12, marginTop: 4 }}>
              {resume.want_job || 'แรงงาน'} • {resume.race || 'พม่า'}
            </div>
            {resume.suit_status === 'error' && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,200,200,0.9)' }}>⚠️ สูท AI ยังไม่สมบูรณ์</div>
            )}
          </div>
        </div>

        {/* ── SUMMARY BOX ── */}
        <div style={{ background: 'white', margin: '-20px 24px 16px', padding: '16px 20px', borderRadius: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.07)', borderLeft: '5px solid #2575fc', fontStyle: 'italic', fontSize: 13, lineHeight: 1.6, color: '#444' }}>
          &ldquo;{strengthText}&rdquo;
        </div>

        {/* ── MAIN 2-column layout ── */}
        <div style={{ display: 'flex', padding: '0 24px 32px', gap: 24 }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ flex: 1 }}>

            {/* ส่วนตัว */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2575fc', borderBottom: '1px dashed #ddd', paddingBottom: 6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 3, height: 14, background: '#2575fc', display: 'inline-block', borderRadius: 2 }} />
                ส่วนตัว
              </div>
              {[
                { label: 'วันเกิด',    val: resume.birthday },
                { label: 'อายุ',       val: age },
                { label: 'เพศ',        val: resume.gender },
                { label: 'จังหวัด',    val: resume.province },
                { label: 'Smart Card', val: resume.smart_card },
                { label: 'บัญชีธนาคาร', val: resume.bank_account },
              ].map(({ label, val }) => val ? (
                <div key={label} style={{ display: 'flex', fontSize: 12, marginBottom: 7 }}>
                  <span style={{ color: '#888', width: 90, flexShrink: 0 }}>{label}:</span>
                  <span style={{ fontWeight: 500, color: '#333' }}>{val}</span>
                </div>
              ) : null)}
            </div>

            {/* ทักษะภาษา */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2575fc', borderBottom: '1px dashed #ddd', paddingBottom: 6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 3, height: 14, background: '#2575fc', display: 'inline-block', borderRadius: 2 }} />
                ทักษะภาษา
              </div>
              {[
                { label: 'ไทย (ฟัง+พูด)',    val: resume.thai_listen },
                { label: 'ไทย (อ่าน+เขียน)',  val: resume.thai_read },
                { label: 'อังกฤษ (ฟัง+พูด)',  val: resume.eng_listen },
                { label: 'อังกฤษ (อ่าน+เขียน)', val: resume.eng_read },
              ].map(({ label, val }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>{label}</div>
                  <div style={{ background: '#eee', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div className="skill-bar-fill" style={{ background: '#2575fc', height: '100%', borderRadius: 3, width: getLangWidth(val) }} />
                  </div>
                </div>
              ))}
            </div>

            {/* ทักษะพิเศษ + ขับรถ */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2575fc', borderBottom: '1px dashed #ddd', paddingBottom: 6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 3, height: 14, background: '#2575fc', display: 'inline-block', borderRadius: 2 }} />
                ทักษะพิเศษ
              </div>
              {[
                { label: 'ขับรถยนต์',        val: resume.drive_car },
                { label: 'ใบขับขี่รถยนต์',   val: resume.car_license },
                { label: 'ขับมอเตอร์ไซค์',   val: resume.drive_moto },
                { label: 'ใบขับขี่ มตซ.',    val: resume.moto_license },
              ].map(({ label, val }) => val ? (
                <div key={label} style={{ display: 'flex', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: '#888', width: 90, flexShrink: 0 }}>{label}:</span>
                  <span style={{ fontWeight: 500, color: '#333' }}>{val}</span>
                </div>
              ) : null)}
              {resume.skills && (
                <div style={{ fontSize: 12, color: '#555', marginTop: 8, lineHeight: 1.5 }}>{resume.skills}</div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ flex: 1.5 }}>

            {/* ประวัติงาน */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2575fc', borderBottom: '1px dashed #ddd', paddingBottom: 6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 3, height: 14, background: '#2575fc', display: 'inline-block', borderRadius: 2 }} />
                ประวัติงาน
              </div>
              {works.length > 0 ? works.map((w, i) => (
                <div key={i} style={{ borderLeft: '2px solid #2575fc', paddingLeft: 14, marginBottom: 14, position: 'relative' }}>
                  <div style={{ width: 10, height: 10, background: '#fff', border: '2px solid #2575fc', borderRadius: '50%', position: 'absolute', left: -7, top: 2 }} />
                  <div style={{ fontWeight: 'bold', fontSize: 13, color: '#333' }}>{w.name}</div>
                  <div style={{ fontSize: 11, color: '#777', marginTop: 3 }}>
                    {w.dur ? `${w.dur} ปี` : ''}{w.dur && w.sal ? ' | ' : ''}{w.sal ? `เงินเดือน ${w.sal} บาท` : ''}
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: 12, color: '#bbb' }}>ไม่มีประวัติงาน</div>
              )}
            </div>

            {/* งานที่ต้องการ */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2575fc', borderBottom: '1px dashed #ddd', paddingBottom: 6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 3, height: 14, background: '#2575fc', display: 'inline-block', borderRadius: 2 }} />
                งานที่ต้องการ
              </div>
              {[
                { label: 'ประเภทงาน',  val: resume.want_job },
                { label: 'พื้นที่',    val: resume.want_area },
              ].map(({ label, val }) => val ? (
                <div key={label} style={{ display: 'flex', fontSize: 12, marginBottom: 7 }}>
                  <span style={{ color: '#888', width: 80, flexShrink: 0 }}>{label}:</span>
                  <span style={{ fontWeight: 500, color: '#333' }}>{val}</span>
                </div>
              ) : null)}
              {resume.want_salary && (
                <div style={{ background: '#f8f9fa', padding: '12px 14px', borderRadius: 8, border: '1px solid #eee', marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>รายได้ที่คาดหวัง</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#2575fc' }}>{resume.want_salary} บาท/เดือน</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: '1px solid #f0f0f0', textAlign: 'center', padding: '12px', fontSize: 11, color: '#bbb' }}>
          WorkPass Resume • {today}
        </div>
      </div>

      <div className="pb-10" />

      {/* ── Fullscreen image preview (กดค้างเพื่อบันทึกลงอัลบั้ม) ── */}
      {previewUrl && (
        <div
          onClick={closePreview}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          {/* instruction */}
          <div style={{ color: 'white', fontSize: 15, fontWeight: 'bold', marginBottom: 12, textAlign: 'center', lineHeight: 1.6 }}>
            📥 กดค้างที่รูปเพื่อบันทึกลงอัลบั้ม
            <br />
            <span style={{ fontSize: 12, opacity: 0.7 }}>Long-press image → Save to Photos</span>
          </div>

          {/* image — stop propagation so tapping image doesn't close modal */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="resume preview"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '70vh',
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            } as React.CSSProperties}
          />

          {/* close button */}
          <button
            onClick={closePreview}
            style={{
              marginTop: 20, background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white', borderRadius: 12,
              padding: '10px 32px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
            }}
          >
            ✕ ปิด
          </button>
        </div>
      )}
    </div>
  )
}
