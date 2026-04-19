'use client'
import { usePathname, useRouter } from 'next/navigation'

const HIDE_ON = ['/', '/dashboard', '/login', '/register', '/profile', '/jobs', '/chat']

export function HomeButton() {
  const pathname = usePathname()
  const router   = useRouter()

  // ซ่อนในหน้าที่ไม่จำเป็น
  if (HIDE_ON.includes(pathname)) return null

  return (
    <button
      onClick={() => router.push('/dashboard')}
      aria-label="กลับหน้าหลัก"
      className="fixed bottom-5 left-4 z-50 flex flex-col items-center justify-center w-12 h-12 rounded-full shadow-lg bg-[#2B3FBE] text-white active:scale-95 transition-transform"
      style={{ boxShadow: '0 4px 16px rgba(43,63,190,0.35)' }}
    >
      <span className="text-lg leading-none">🏠</span>
      <span className="text-[9px] leading-none mt-0.5 opacity-80" style={{ fontFamily: 'Noto Sans Myanmar' }}>ပင်မ</span>
    </button>
  )
}
