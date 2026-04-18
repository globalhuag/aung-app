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

// ── Shared section-header style factory ──────────────────────────────────────
function secHead(fs: number) {
  return {
    fontSize: fs, fontWeight: 'bold' as const, color: '#2575fc',
    borderBottom: '1px dashed #ddd', paddingBottom: fs * 0.46,
    marginBottom: fs * 0.77, display: 'flex', alignItems: 'center', gap: 6,
  }
}
function secBar(h: number) {
  return { width: 3, height: h, background: '#2575fc', display: 'inline-block' as const, borderRadius: 2 }
}

export default function ResumeDetailPage() {
  const router  = useRouter()
  const params  = useParams()
  const id      = params?.id as string

  const cardRef     = useRef<HTMLDivElement>(null)
  const printRef    = useRef<HTMLDivElement>(null)
  const hasTriedRef = useRef(false)

  const [resume,      setResume]      = useState<Resume | null>(null)
  const [phone,       setPhone]       = useState('')
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [generating,  setGenerating]  = useState(false)
  const [saving,      setSaving]      = useState(false)
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
    const el = printRef.current
    if (!el) return
    setSaving(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(el, {
        scale:       2,
        useCORS:     true,
        allowTaint:  true,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        width:       794,
        height:      1123,
      })
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
      }, 'image/jpeg', 0.92)
    } catch { alert('โหลดรูปไม่สำเร็จ กรุณาลองใหม่') }
    finally { setSaving(false) }
  }

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

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

  const isOwner      = currentUser?.id === resume.user_id
  const photoSrc     = resume.suit_photo_url || resume.photo_url || ''
  const age          = calcAge(resume.birthday)
  const today        = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
  const strengthText = resume.strengths || resume.skills || 'แรงงานมีประสบการณ์ ขยัน ตรงต่อเวลา'
  const works = [
    { name: resume.w1_name, dur: resume.w1_duration, sal: resume.w1_salary },
    { name: resume.w2_name, dur: resume.w2_duration, sal: resume.w2_salary },
    { name: resume.w3_name, dur: resume.w3_duration, sal: resume.w3_salary },
  ].filter(w => w.name)

  const photoEl = (size: number) => photoSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoSrc} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
  ) : (
    <span style={{ fontSize: size * 0.4 }}>{resume.gender === 'หญิง' ? '👩' : '👨'}</span>
  )

  // ── Mobile card (compact, ~512px wide) ─────────────────────────────────────
  const mobileCard = (
    <>
      <div style={{ background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', padding: '32px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.25)', overflow: 'hidden', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {generating ? <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : photoEl(100)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: 22, lineHeight: 1.2, marginBottom: 5 }}>{resume.name || 'ไม่ระบุชื่อ'}</div>
          {phone && <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>📞 {phone}</div>}
          <div style={{ background: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '3px 12px', borderRadius: 20, color: 'white', fontSize: 11, marginTop: 3 }}>
            {resume.want_job || 'แรงงาน'} • {resume.race || 'พม่า'}
          </div>
          {resume.suit_status === 'error' && <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(255,200,200,0.9)' }}>⚠️ สูท AI ยังไม่สมบูรณ์</div>}
        </div>
      </div>

      <div style={{ background: 'white', margin: '-16px 20px 14px', padding: '14px 16px', borderRadius: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.07)', borderLeft: '5px solid #2575fc', fontStyle: 'italic', fontSize: 12, lineHeight: 1.6, color: '#444' }}>
        &ldquo;{strengthText}&rdquo;
      </div>

      <div style={{ display: 'flex', padding: '0 20px 28px', gap: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={secHead(12)}><span style={secBar(12)} />ส่วนตัว</div>
            {[['วันเกิด', resume.birthday], ['อายุ', age], ['เพศ', resume.gender], ['จังหวัด', resume.province], ['Smart Card', resume.smart_card], ['บัญชีธนาคาร', resume.bank_account]].map(([l, v]) => v ? (
              <div key={l} style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: '#888', width: 80, flexShrink: 0 }}>{l}:</span>
                <span style={{ fontWeight: 500, color: '#333' }}>{v}</span>
              </div>
            ) : null)}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={secHead(12)}><span style={secBar(12)} />ทักษะภาษา</div>
            {[['ไทย (ฟัง+พูด)', resume.thai_listen], ['ไทย (อ่าน+เขียน)', resume.thai_read], ['อังกฤษ (ฟัง+พูด)', resume.eng_listen], ['อังกฤษ (อ่าน+เขียน)', resume.eng_read]].map(([l, v]) => (
              <div key={l} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 3 }}>{l}</div>
                <div style={{ background: '#eee', height: 5, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ background: '#2575fc', height: '100%', borderRadius: 3, width: getLangWidth(v) }} />
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={secHead(12)}><span style={secBar(12)} />ทักษะพิเศษ</div>
            {[['ขับรถยนต์', resume.drive_car], ['ใบขับขี่รถยนต์', resume.car_license], ['ขับมอเตอร์ไซค์', resume.drive_moto], ['ใบขับขี่ มตซ.', resume.moto_license]].map(([l, v]) => v ? (
              <div key={l} style={{ display: 'flex', fontSize: 11, marginBottom: 5 }}>
                <span style={{ color: '#888', width: 80, flexShrink: 0 }}>{l}:</span>
                <span style={{ fontWeight: 500, color: '#333' }}>{v}</span>
              </div>
            ) : null)}
            {resume.skills && <div style={{ fontSize: 11, color: '#555', marginTop: 7, lineHeight: 1.5 }}>{resume.skills}</div>}
          </div>
        </div>

        <div style={{ flex: 1.5 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={secHead(12)}><span style={secBar(12)} />ประวัติงาน</div>
            {works.length > 0 ? works.map((w, i) => (
              <div key={i} style={{ borderLeft: '2px solid #2575fc', paddingLeft: 12, marginBottom: 12, position: 'relative' }}>
                <div style={{ width: 8, height: 8, background: '#fff', border: '2px solid #2575fc', borderRadius: '50%', position: 'absolute', left: -6, top: 2 }} />
                <div style={{ fontWeight: 'bold', fontSize: 12, color: '#333' }}>{w.name}</div>
                <div style={{ fontSize: 10, color: '#777', marginTop: 2 }}>{w.dur ? `${w.dur} ปี` : ''}{w.dur && w.sal ? ' | ' : ''}{w.sal ? `เงินเดือน ${w.sal} บาท` : ''}</div>
              </div>
            )) : <div style={{ fontSize: 11, color: '#bbb' }}>ไม่มีประวัติงาน</div>}
          </div>
          <div>
            <div style={secHead(12)}><span style={secBar(12)} />งานที่ต้องการ</div>
            {[['ประเภทงาน', resume.want_job], ['พื้นที่', resume.want_area]].map(([l, v]) => v ? (
              <div key={l} style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: '#888', width: 72, flexShrink: 0 }}>{l}:</span>
                <span style={{ fontWeight: 500, color: '#333' }}>{v}</span>
              </div>
            ) : null)}
            {resume.want_salary && (
              <div style={{ background: '#f8f9fa', padding: '10px 12px', borderRadius: 8, border: '1px solid #eee', marginTop: 7 }}>
                <div style={{ fontSize: 10, color: '#666', marginBottom: 3 }}>รายได้ที่คาดหวัง</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#2575fc' }}>{resume.want_salary} บาท/เดือน</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', textAlign: 'center', padding: '10px', fontSize: 10, color: '#bbb' }}>
        WorkPass Resume • {today}
      </div>
    </>
  )

  // ── A4 card (794×1123px — optimised for print) ──────────────────────────────
  const a4Card = (
    <div style={{ width: 794, height: 1123, display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', overflow: 'hidden' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', padding: '44px 48px', display: 'flex', alignItems: 'center', gap: '32px', flexShrink: 0 }}>
        <div style={{ width: 140, height: 140, borderRadius: '50%', border: '5px solid rgba(255,255,255,0.3)', overflow: 'hidden', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {photoEl(140)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: 34, letterSpacing: 0.5, lineHeight: 1.2, marginBottom: 8 }}>{resume.name || 'ไม่ระบุชื่อ'}</div>
          {phone && <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 6 }}>📞 {phone}</div>}
          <div style={{ background: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '6px 18px', borderRadius: 24, color: 'white', fontSize: 14, marginTop: 4 }}>
            {resume.want_job || 'แรงงาน'} • {resume.race || 'พม่า'}
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div style={{ background: 'white', margin: '-22px 40px 0', padding: '18px 24px', borderRadius: 12, boxShadow: '0 4px 18px rgba(0,0,0,0.08)', borderLeft: '6px solid #2575fc', fontStyle: 'italic', fontSize: 14, lineHeight: 1.7, color: '#444', flexShrink: 0, zIndex: 1 }}>
        &ldquo;{strengthText}&rdquo;
      </div>

      {/* 2-column body — flex:1 fills remaining height, space-between distributes sections */}
      <div style={{ display: 'flex', padding: '20px 40px 0', gap: 36, flex: 1, minHeight: 0 }}>

        {/* LEFT — 3 sections spread top→bottom */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 24 }}>

          {/* ส่วนตัว */}
          <div>
            <div style={secHead(16)}><span style={secBar(16)} />ส่วนตัว</div>
            {[['วันเกิด', resume.birthday], ['อายุ', age], ['เพศ', resume.gender], ['จังหวัด', resume.province], ['Smart Card', resume.smart_card], ['บัญชีธนาคาร', resume.bank_account]].map(([l, v]) => v ? (
              <div key={l} style={{ display: 'flex', fontSize: 14, marginBottom: 11, lineHeight: 1.4 }}>
                <span style={{ color: '#888', width: 115, flexShrink: 0 }}>{l}:</span>
                <span style={{ fontWeight: 500, color: '#333' }}>{v}</span>
              </div>
            ) : null)}
          </div>

          {/* ทักษะภาษา */}
          <div>
            <div style={secHead(16)}><span style={secBar(16)} />ทักษะภาษา</div>
            {[['ไทย (ฟัง+พูด)', resume.thai_listen], ['ไทย (อ่าน+เขียน)', resume.thai_read], ['อังกฤษ (ฟัง+พูด)', resume.eng_listen], ['อังกฤษ (อ่าน+เขียน)', resume.eng_read]].map(([l, v]) => (
              <div key={l} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555', marginBottom: 6 }}>
                  <span>{l}</span>
                  <span style={{ color: '#2575fc', fontWeight: 600 }}>{v || 'ไม่มี'}</span>
                </div>
                <div style={{ background: '#e8eef8', height: 9, borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg,#6a11cb,#2575fc)', height: '100%', borderRadius: 5, width: getLangWidth(v) }} />
                </div>
              </div>
            ))}
          </div>

          {/* ทักษะพิเศษ */}
          <div>
            <div style={secHead(16)}><span style={secBar(16)} />ทักษะพิเศษ</div>
            {[['ขับรถยนต์', resume.drive_car], ['ใบขับขี่รถยนต์', resume.car_license], ['ขับมอเตอร์ไซค์', resume.drive_moto], ['ใบขับขี่ มตซ.', resume.moto_license]].map(([l, v]) => v ? (
              <div key={l} style={{ display: 'flex', fontSize: 14, marginBottom: 11, lineHeight: 1.4 }}>
                <span style={{ color: '#888', width: 115, flexShrink: 0 }}>{l}:</span>
                <span style={{ fontWeight: 500, color: '#333' }}>{v}</span>
              </div>
            ) : null)}
            {resume.skills && <div style={{ fontSize: 14, color: '#555', marginTop: 10, lineHeight: 1.7 }}>{resume.skills}</div>}
          </div>
        </div>

        {/* RIGHT — 2 sections spread top→bottom */}
        <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 24 }}>

          {/* ประวัติงาน */}
          <div>
            <div style={secHead(16)}><span style={secBar(16)} />ประวัติงาน</div>
            {works.length > 0 ? works.map((w, i) => (
              <div key={i} style={{ borderLeft: '3px solid #2575fc', paddingLeft: 20, marginBottom: 24, position: 'relative' }}>
                <div style={{ width: 13, height: 13, background: '#fff', border: '3px solid #2575fc', borderRadius: '50%', position: 'absolute', left: -8, top: 3 }} />
                <div style={{ fontWeight: 'bold', fontSize: 16, color: '#333', marginBottom: 5 }}>{w.name}</div>
                <div style={{ fontSize: 14, color: '#777' }}>{w.dur ? `${w.dur} ปี` : ''}{w.dur && w.sal ? '  |  ' : ''}{w.sal ? `เงินเดือน ${w.sal} บาท` : ''}</div>
              </div>
            )) : <div style={{ fontSize: 14, color: '#bbb' }}>ไม่มีประวัติงาน</div>}
          </div>

          {/* งานที่ต้องการ */}
          <div>
            <div style={secHead(16)}><span style={secBar(16)} />งานที่ต้องการ</div>
            {[['ประเภทงาน', resume.want_job], ['พื้นที่', resume.want_area]].map(([l, v]) => v ? (
              <div key={l} style={{ display: 'flex', fontSize: 14, marginBottom: 12, lineHeight: 1.4 }}>
                <span style={{ color: '#888', width: 100, flexShrink: 0 }}>{l}:</span>
                <span style={{ fontWeight: 500, color: '#333' }}>{v}</span>
              </div>
            ) : null)}
            {resume.want_salary && (
              <div style={{ background: 'linear-gradient(135deg,#f0f4ff,#e8f0fe)', padding: '22px 24px', borderRadius: 14, border: '1px solid #d0dcff', marginTop: 16 }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>รายได้ที่คาดหวัง</div>
                <div style={{ fontSize: 36, fontWeight: 'bold', color: '#2575fc', lineHeight: 1 }}>{resume.want_salary}</div>
                <div style={{ fontSize: 16, color: '#6a11cb', marginTop: 6 }}>บาท / เดือน</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER — sticks to bottom */}
      <div style={{ borderTop: '2px solid #f0f0f0', textAlign: 'center', padding: '14px', fontSize: 13, color: '#bbb', flexShrink: 0 }}>
        WorkPass Resume • {today}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f4f7f9]">

      {/* ── Action bar ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-3 py-2 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 text-sm font-bold">← กลับ</button>
          <div className="flex-1" />
          {isOwner && resume.suit_status === 'error' && (
            <button onClick={() => { hasTriedRef.current = false; triggerGenerate(resume.id) }}
              className="bg-orange-500 text-white rounded-xl px-3 py-1.5 text-xs font-bold">
              🔄 สร้างสูทใหม่
            </button>
          )}
          <button
            onClick={handleDownloadImage}
            disabled={saving}
            className="bg-[#2575fc] text-white rounded-xl px-3 py-1.5 text-xs font-bold disabled:opacity-60"
          >
            {saving ? '⏳ กำลังสร้าง...' : '🖼️ บันทึกรูป'}
          </button>
        </div>
        {generating && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl py-2 px-3 text-xs text-blue-700 text-center animate-pulse">
            ⚙️ AI กำลังสร้างชุดสูท... / AI ဝတ်စုံ ဖန်တီးနေသည်...
          </div>
        )}
      </div>

      {/* ── Visible mobile card ── */}
      <div ref={cardRef} className="max-w-lg mx-auto bg-white shadow-lg overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
        {mobileCard}
      </div>

      {/* ── Hidden A4 card (794×1123px) for image capture ── */}
      <div
        ref={printRef}
        aria-hidden="true"
        style={{
          position: 'fixed', left: '-9999px', top: 0,
          width: 794, minHeight: 1123,
          background: '#fff', overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {a4Card}
      </div>

      <div className="pb-10" />

      {/* ── Fullscreen preview overlay ── */}
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
          <div style={{ color: 'white', fontSize: 15, fontWeight: 'bold', marginBottom: 12, textAlign: 'center', lineHeight: 1.6 }}>
            📥 กดค้างที่รูปเพื่อบันทึกลงอัลบั้ม
            <br />
            <span style={{ fontSize: 12, opacity: 0.7 }}>Long-press image → Save to Photos</span>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="resume preview"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '72vh',
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            } as React.CSSProperties}
          />

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
