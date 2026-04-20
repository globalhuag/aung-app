'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User = { id: string; phone: string; credits: number }
type Message = {
  id: string
  user_id: string
  content: string
  is_admin: boolean
  created_at: string
}

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (!u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    setUser(parsed)
    loadMessages(parsed.id)

    const channel = supabase
      .channel('chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${parsed.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async (userId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages(data || [])
  }

  const sendMessage = async () => {
    if (!text.trim() || !user || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      content,
      is_admin: false,
    })
    setSending(false)
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  }

  if (!user) return null

  const QUICK_MESSAGES = [
    { th: 'สอบถามงาน', mm: 'အလုပ်မေးမည်' },
    { th: 'ปัญหาเครดิต', mm: 'ခရက်ဒစ်ပြဿနာ' },
    { th: 'ช่วยด้วย', mm: 'ကူညီပါ' },
    { th: 'ถามเรซูเม่', mm: 'Resume မေးမည်' },
  ]

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col h-screen">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => router.push('/dashboard')}
            className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            ←
          </button>
          <div className="w-9 h-9 rounded-xl bg-white/20 border-2 border-dashed border-white/40 flex items-center justify-center text-lg">
            👨‍💼
          </div>
          <div className="flex-1">
            <div className="text-white font-black text-sm">ทีมงาน Aung <span style={{fontFamily:'Noto Sans Myanmar'}} className="font-normal text-white/70">အောင်</span></div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-white/70 text-xs">ออนไลน์ / အွန်လိုင်း</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Aung" className="w-full h-full object-cover" />
              </div>
              <div className="max-w-[75%]">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-sm text-gray-800">สวัสดีครับ! ยินดีต้อนรับสู่ Aung 🙏</p>
                  <p className="text-xs text-gray-500 mt-1">สามารถสอบถามเรื่องงาน เรซูเม่ หรือเครดิตได้เลยครับ</p>
                  <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: 'Noto Sans Myanmar' }}>မင်္ဂလာပါ! မည်သည့်ကိစ္စမဆို မေးနိုင်ပါသည်</p>
                </div>
                <div className="text-xs text-gray-400 mt-1 ml-1">ตอนนี้ · <span style={{fontFamily:'Noto Sans Myanmar'}}>ယခု</span></div>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${msg.is_admin ? '' : 'flex-row-reverse'}`}>
              {msg.is_admin && (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Aung" className="w-full h-full object-cover" />
              </div>
              )}
              <div className={`max-w-[75%] ${msg.is_admin ? '' : 'items-end flex flex-col'}`}>
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${msg.is_admin
                  ? 'bg-white text-gray-800 rounded-tl-sm'
                  : 'bg-[#2B3FBE] text-white rounded-tr-sm'}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                <div className="text-xs text-gray-400 mt-1 mx-1">{formatTime(msg.created_at)}</div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        {messages.length === 0 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
            {QUICK_MESSAGES.map(q => (
              <button key={q.th} onClick={() => setText(q.th)}
                className="flex-shrink-0 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs font-bold text-gray-600 text-left">
                {q.th}
                <span className="block text-gray-400 font-normal" style={{fontFamily:'Noto Sans Myanmar',fontSize:'10px'}}>{q.mm}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-gray-100 px-4 py-3 pb-6 flex-shrink-0">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-[#F4F5FB] rounded-2xl px-4 py-2.5 min-h-[44px] flex items-center">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="พิมพ์ข้อความ... / မက်ဆေ့ချ်ရိုက်ထည့်ပါ"
                rows={1}
                className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder-gray-400"
              />
            </div>
            <button onClick={sendMessage} disabled={!text.trim() || sending}
              className="w-11 h-11 rounded-2xl bg-[#2B3FBE] disabled:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
              <span className="text-white text-lg">➤</span>
            </button>
          </div>
        </div>

        {/* Bottom Nav */}
        <BottomNav active="chat" router={router} />
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
    <div className="bg-white border-t border-gray-100 flex px-3 py-2 pb-4">
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
