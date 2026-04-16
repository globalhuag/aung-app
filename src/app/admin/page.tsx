'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ---------- Types ----------
type ResumeRow = {
  id: string; user_id: string; name: string; want_job: string;
  province: string; suit_status: string; created_at: string;
}
type TopupRow = {
  id: string; user_id: string; amount: number; credits: number;
  status: string; created_at: string;
}
type JobRow = {
  id: string; title: string; company: string; job_type: string;
  province: string; salary_min: number; salary_max: number;
  description: string; contact: string; is_active: boolean; created_at: string;
}
type ChatMessage = {
  id: string; user_id: string; content: string; is_admin: boolean; created_at: string;
}

const CORRECT_PIN = 'aung2024'
const PROVINCES = ['กรุงเทพมหานคร','เชียงใหม่','สมุทรปราการ','นนทบุรี','ปทุมธานี','อยุธยา','ชลบุรี','ระยอง','นครราชสีมา','ขอนแก่น','อื่นๆ']
const JOB_TYPES = ['ก่อสร้าง','เกษตร','โรงงาน','ร้านอาหาร','แม่บ้าน','ดูแลผู้สูงอายุ','ขับรถ','อื่นๆ']

// ---------- PIN Gate ----------
function PinGate({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === CORRECT_PIN) {
      onSuccess()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-[#C9A84C] px-6 py-5 text-center">
            <div className="text-3xl mb-2">🔐</div>
            <div className="text-white font-extrabold text-lg">Admin Panel</div>
            <div className="text-white/70 text-xs">กรอก PIN เพื่อเข้าใช้งาน</div>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-4">
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="PIN"
              className={`w-full border rounded-xl px-4 py-3 text-center text-lg tracking-widest font-mono outline-none focus:border-[#C9A84C] ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              autoFocus
            />
            {error && <div className="text-red-500 text-xs text-center">PIN ไม่ถูกต้อง</div>}
            <button
              type="submit"
              className="w-full bg-[#C9A84C] text-white font-bold py-3 rounded-xl text-sm">
              เข้าสู่ระบบ Admin
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ---------- Resumes Tab ----------
function ResumesTab() {
  const router = useRouter()
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [phones, setPhones] = useState<Record<string, string>>({})

  useEffect(() => { loadResumes() }, [])

  const loadResumes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('resumes')
      .select('id,user_id,name,want_job,province,suit_status,created_at')
      .order('created_at', { ascending: false })
    const rows = (data || []) as ResumeRow[]
    setResumes(rows)
    const userIds = [...new Set(rows.map(r => r.user_id))]
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id,phone')
        .in('id', userIds)
      const map: Record<string, string> = {}
      ;(users || []).forEach((u: { id: string; phone: string }) => { map[u.id] = u.phone })
      setPhones(map)
    }
    setLoading(false)
  }

  const cycleSuitStatus = async (r: ResumeRow) => {
    const next = r.suit_status === 'pending' ? 'done' : r.suit_status === 'done' ? 'error' : 'pending'
    await supabase.from('resumes').update({ suit_status: next }).eq('id', r.id)
    setResumes(rs => rs.map(x => x.id === r.id ? { ...x, suit_status: next } : x))
  }

  const statusColor: Record<string, string> = {
    done: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-600',
    pending: 'bg-yellow-100 text-yellow-600',
  }
  const statusLabel: Record<string, string> = {
    done: '✓ เสร็จ',
    error: '✕ ผิดพลาด',
    pending: '⏳ รอ',
  }

  if (loading) return <div className="py-10 text-center text-gray-400 text-sm">กำลังโหลด...</div>

  return (
    <div className="flex flex-col gap-3">
      {resumes.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีเรซูเม่</div>
      )}
      {resumes.map(r => (
        <div key={r.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-800 truncate">{r.name || 'ไม่ระบุ'}</div>
                <div className="text-xs text-gray-400 mt-0.5">📞 {phones[r.user_id] || r.user_id.slice(0, 8) + '...'}</div>
                <div className="text-xs text-gray-400">{r.want_job || '—'} · {r.province || '—'}</div>
                <div className="text-xs text-gray-300 mt-0.5">{new Date(r.created_at).toLocaleDateString('th-TH')}</div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[r.suit_status] || 'bg-gray-100 text-gray-500'}`}>
                {statusLabel[r.suit_status] || r.suit_status}
              </span>
            </div>
          </div>
          <div className="border-t border-gray-100 flex">
            <button
              onClick={() => cycleSuitStatus(r)}
              className="flex-1 py-2 text-xs font-bold text-[#C9A84C] border-r border-gray-100">
              🔄 เปลี่ยนสถานะ
            </button>
            <button
              onClick={() => router.push(`/resume/${r.id}`)}
              className="flex-1 py-2 text-xs font-bold text-[#2B3FBE]">
              👁 ดู
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------- Finance Tab ----------
function FinanceTab() {
  const [topups, setTopups] = useState<TopupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => { loadTopups() }, [])

  const loadTopups = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('topup_requests')
      .select('*')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
    setTopups((data || []) as TopupRow[])
    setLoading(false)
  }

  const approve = async (t: TopupRow) => {
    setApproving(t.id)
    await supabase.from('topup_requests').update({ status: 'approved' }).eq('id', t.id)
    const { data: userData } = await supabase
      .from('users')
      .select('credits')
      .eq('id', t.user_id)
      .single()
    if (userData) {
      await supabase
        .from('users')
        .update({ credits: (userData as { credits: number }).credits + t.credits })
        .eq('id', t.user_id)
    }
    setTopups(ts => ts.map(x => x.id === t.id ? { ...x, status: 'approved' } : x))
    setApproving(null)
  }

  if (loading) return <div className="py-10 text-center text-gray-400 text-sm">กำลังโหลด...</div>

  return (
    <div className="flex flex-col gap-3">
      {topups.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">ไม่มีคำขอเติมเงิน</div>
      )}
      {topups.map(t => {
        const approved = t.status === 'approved'
        return (
          <div key={t.id} className={`rounded-2xl border overflow-hidden ${approved ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100'}`}>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-700 truncate">{t.user_id.slice(0, 12)}...</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    ฿{t.amount} → {t.credits} เครดิต
                  </div>
                  <div className="text-xs text-gray-300">{new Date(t.created_at).toLocaleDateString('th-TH')}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {approved ? '✓ อนุมัติแล้ว' : '⏳ รออนุมัติ'}
                  </span>
                  {!approved && (
                    <button
                      onClick={() => approve(t)}
                      disabled={approving === t.id}
                      className="bg-[#C9A84C] text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-60">
                      {approving === t.id ? 'กำลัง...' : '✓ อนุมัติ'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------- Jobs Tab ----------
function JobsTab() {
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '', company: '', job_type: JOB_TYPES[0], province: PROVINCES[0],
    salary_min: '', salary_max: '', description: '', contact: '',
  })

  useEffect(() => { loadJobs() }, [])

  const loadJobs = async () => {
    setLoading(true)
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false })
    setJobs((data || []) as JobRow[])
    setLoading(false)
  }

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    await supabase.from('jobs').insert([{
      ...form,
      salary_min: Number(form.salary_min) || 0,
      salary_max: Number(form.salary_max) || 0,
      is_active: true,
    }])
    setForm({ title: '', company: '', job_type: JOB_TYPES[0], province: PROVINCES[0], salary_min: '', salary_max: '', description: '', contact: '' })
    await loadJobs()
    setCreating(false)
  }

  const toggleActive = async (j: JobRow) => {
    await supabase.from('jobs').update({ is_active: !j.is_active }).eq('id', j.id)
    setJobs(js => js.map(x => x.id === j.id ? { ...x, is_active: !x.is_active } : x))
  }

  const deleteJob = async (id: string) => {
    if (!confirm('ลบงานนี้?')) return
    await supabase.from('jobs').delete().eq('id', id)
    setJobs(js => js.filter(x => x.id !== id))
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#C9A84C]'

  return (
    <div>
      {/* Create form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="text-xs font-extrabold text-[#2B3FBE] mb-3">+ สร้างประกาศงานใหม่</div>
        <form onSubmit={createJob} className="flex flex-col gap-2">
          <input required className={inputCls} placeholder="ตำแหน่งงาน *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className={inputCls} placeholder="บริษัท / นายจ้าง" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <select className={inputCls} value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))}>
              {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className={inputCls} value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} type="number" placeholder="เงินเดือนต่ำสุด" value={form.salary_min} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))} />
            <input className={inputCls} type="number" placeholder="เงินเดือนสูงสุด" value={form.salary_max} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))} />
          </div>
          <textarea className={inputCls} rows={3} placeholder="รายละเอียดงาน" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input className={inputCls} placeholder="ข้อมูลติดต่อ" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          <button type="submit" disabled={creating} className="w-full bg-[#C9A84C] text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-60">
            {creating ? 'กำลังสร้าง...' : '+ สร้างประกาศ'}
          </button>
        </form>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="text-center py-6 text-gray-400 text-sm">กำลังโหลด...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">ยังไม่มีประกาศงาน</div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(j => (
            <div key={j.id} className={`rounded-2xl border overflow-hidden ${j.is_active ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800 truncate">{j.title}</div>
                    <div className="text-xs text-gray-400">{j.company || '—'} · {j.job_type} · {j.province}</div>
                    {(j.salary_min > 0 || j.salary_max > 0) && (
                      <div className="text-xs text-[#C9A84C] font-bold mt-0.5">
                        ฿{j.salary_min.toLocaleString()}–{j.salary_max.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${j.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {j.is_active ? 'เปิด' : 'ปิด'}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-100 flex">
                <button onClick={() => toggleActive(j)} className="flex-1 py-2 text-xs font-bold text-[#C9A84C] border-r border-gray-100">
                  {j.is_active ? '⏸ ปิดงาน' : '▶ เปิดงาน'}
                </button>
                <button onClick={() => deleteJob(j.id)} className="flex-1 py-2 text-xs font-bold text-red-400">
                  🗑 ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Chat Tab ----------
function ChatTab() {
  const [userIds, setUserIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [lastMsgs, setLastMsgs] = useState<Record<string, ChatMessage>>({})
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadConversations() }, [])

  const loadConversations = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('chat_messages')
      .select('id,user_id,content,is_admin,created_at')
      .order('created_at', { ascending: false })

    const rows = (data || []) as ChatMessage[]
    const seen = new Set<string>()
    const last: Record<string, ChatMessage> = {}
    const ids: string[] = []
    for (const m of rows) {
      if (!seen.has(m.user_id)) {
        seen.add(m.user_id)
        ids.push(m.user_id)
        last[m.user_id] = m
      }
    }
    setUserIds(ids)
    setLastMsgs(last)
    setLoading(false)
  }

  const openChat = async (uid: string) => {
    if (expanded === uid) { setExpanded(null); return }
    setExpanded(uid)
    const { data } = await supabase
      .from('chat_messages')
      .select('id,user_id,content,is_admin,created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: true })
    setMessages((data || []) as ChatMessage[])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const sendMessage = async () => {
    if (!msgInput.trim() || !expanded) return
    setSending(true)
    await supabase.from('chat_messages').insert([{
      user_id: expanded,
      content: msgInput.trim(),
      is_admin: true,
    }])
    setMessages(ms => [...ms, {
      id: Date.now().toString(),
      user_id: expanded,
      content: msgInput.trim(),
      is_admin: true,
      created_at: new Date().toISOString(),
    }])
    setMsgInput('')
    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  if (loading) return <div className="py-10 text-center text-gray-400 text-sm">กำลังโหลด...</div>

  return (
    <div className="flex flex-col gap-3">
      {userIds.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีข้อความ</div>
      )}
      {userIds.map(uid => {
        const last = lastMsgs[uid]
        const isOpen = expanded === uid
        return (
          <div key={uid} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => openChat(uid)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-full bg-[#E8EBFF] flex items-center justify-center text-lg flex-shrink-0">💬</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gray-700 truncate">{uid.slice(0, 16)}...</div>
                {last && (
                  <div className="text-xs text-gray-400 truncate">
                    {last.is_admin ? '🔵 Admin: ' : ''}{last.content}
                  </div>
                )}
              </div>
              <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">
                <div className="max-h-64 overflow-y-auto px-3 py-2 flex flex-col gap-2 bg-[#F4F5FB]">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${m.is_admin ? 'bg-[#2B3FBE] text-white' : 'bg-white text-gray-700 border border-gray-100'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 bg-white">
                  <input
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#2B3FBE]"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !msgInput.trim()}
                    className="bg-[#2B3FBE] text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50">
                    ส่ง
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------- Main Admin Page ----------
type Tab = 'resumes' | 'finance' | 'jobs' | 'chat'

const TABS: { key: Tab; label: string }[] = [
  { key: 'resumes', label: 'เรซูเม่' },
  { key: 'finance', label: 'การเงิน' },
  { key: 'jobs', label: 'งาน' },
  { key: 'chat', label: 'แชท' },
]

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<Tab>('resumes')

  if (!authed) return <PinGate onSuccess={() => setAuthed(true)} />

  return (
    <div className="min-h-screen bg-[#F4F5FB]">
      <div className="max-w-sm mx-auto">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 py-3 flex items-center justify-between">
          <span className="text-white font-extrabold text-base">Admin · Aung</span>
          <button
            onClick={() => setAuthed(false)}
            className="text-white/60 text-xs">
            ออก
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-100 flex">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${tab === t.key ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-transparent text-gray-400'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-3 py-4">
          {tab === 'resumes' && <ResumesTab />}
          {tab === 'finance' && <FinanceTab />}
          {tab === 'jobs' && <JobsTab />}
          {tab === 'chat' && <ChatTab />}
        </div>

      </div>
    </div>
  )
}
