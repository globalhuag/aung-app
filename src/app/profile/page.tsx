'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User = { id: string; phone: string; credits: number }

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [resumeCount, setResumeCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = localStorage.getItem('aung_user')
    if (!u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    setUser(parsed)
    loadStats(parsed.id)
  }, [])

  const loadStats = async (userId: string) => {
    const { count } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    setResumeCount(count || 0)
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('aung_user')
    router.push('/login')
  }

  if (!user) return null

  const MENU = [
    {
      section: 'บัญชี / အကောင့်',
      items: [
        { icon: '⭐', label: 'เติมเครดิต', labelMM: 'ခရက်ဒစ်ဖြည့်', action: () => router.push('/topup'), badge: `${user.credits} เครดิต`, badgeColor: 'text-[#2B3FBE]' },
        { icon: '📄', label: 'เรซูเม่ของฉัน', labelMM: 'ကျွန်ုပ်၏ Resume', action: () => router.push('/dashboard'), badge: `${resumeCount} รายการ`, badgeColor: 'text-gray-500' },
        { icon: '📢', label: 'ประกาศงาน', labelMM: 'အလုပ်ကြော်ငြာ', action: () => router.push('/jobs') },
      ]
    },
    {
      section: 'ความช่วยเหลือ / အကူအညီ',
      items: [
        { icon: '💬', label: 'ติดต่อเรา', labelMM: 'ကျွန်ုပ်တို့ဆက်သွယ်ရန်', action: () => router.push('/chat') },
        { icon: '❓', label: 'วิธีใช้งาน', labelMM: 'အသုံးပြုနည်း', action: () => {} },
        { icon: '📋', label: 'เงื่อนไขการใช้งาน', labelMM: 'အသုံးပြုမှုသတ်မှတ်ချက်', action: () => {} },
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">

        {/* Header */}
        <div className="bg-[#2B3FBE] px-4 pt-4 pb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 text-white font-black text-lg">โปรไฟล์</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <div className="text-white font-black text-lg">{user.phone}</div>
              <div className="text-white/70 text-xs mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>ဖုန်းနံပါတ်</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">⭐ {user.credits} เครดิต</span>
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">📄 {loading ? '...' : resumeCount} เรซูเม่</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="px-4 -mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 grid grid-cols-3 divide-x divide-gray-100 overflow-hidden shadow-sm">
            {[
              { label: 'เครดิต', value: user.credits, icon: '⭐' },
              { label: 'เรซูเม่', value: loading ? '...' : resumeCount, icon: '📄' },
              { label: 'สถานะ', value: 'ใช้งาน', icon: '✅' },
            ].map(s => (
              <div key={s.label} className="py-3 flex flex-col items-center gap-0.5">
                <div className="text-lg">{s.icon}</div>
                <div className="text-base font-black text-gray-800">{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div className="flex-1 px-4 py-5 space-y-4">
          {MENU.map(section => (
            <div key={section.section}>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">{section.section}</div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                {section.items.map(item => (
                  <button key={item.label} onClick={item.action}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 text-left">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-800">{item.label}</div>
                      {item.labelMM && (
                        <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>{item.labelMM}</div>
                      )}
                    </div>
                    {item.badge ? (
                      <span className={`text-xs font-bold ${item.badgeColor || 'text-gray-400'}`}>{item.badge}</span>
                    ) : (
                      <span className="text-gray-300 font-bold">›</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Logout */}
          <button onClick={handleLogout}
            className="w-full bg-red-50 border border-red-200 text-red-500 font-bold rounded-2xl py-4 text-sm">
            ออกจากระบบ
            <div className="text-xs font-normal opacity-70 mt-0.5" style={{ fontFamily: 'Noto Sans Myanmar' }}>အကောင့်ထွက်မည်</div>
          </button>
        </div>

        {/* Bottom Nav */}
        <BottomNav active="profile" router={router} />
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
