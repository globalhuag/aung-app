'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Phase = 'init' | 'logging-in' | 'error'

export default function LineLoginPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('init')
  const [msg, setMsg] = useState('กำลังเชื่อมต่อ LINE... · LINE နှင့် ချိတ်ဆက်နေသည်')

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID
    if (!liffId) {
      setPhase('error')
      setMsg('NEXT_PUBLIC_LIFF_ID not configured')
      return
    }

    let cancelled = false
    ;(async () => {
      // LIFF idTokens last ~1 hour. If we returned from a previous login yesterday,
      // the cached session still looks "logged in" but the idToken is expired.
      // Flag below forces a fresh OAuth when the server rejects our token.
      const params = new URLSearchParams(window.location.search)
      const forceFresh = params.has('fresh')
      // LIFF passes through ?liff.state=<path> when opening from a rich-menu /
      // deep-link URL like `liff.line.me/<LIFF_ID>?liff.state=%2Fresume%2Fcreate`.
      // Same-origin absolute paths only — never honor external URLs.
      const rawNext = params.get('liff.state') || ''
      const nextPath = rawNext.startsWith('/') && !rawNext.startsWith('//')
        ? rawNext
        : '/dashboard'

      try {
        const { default: liff } = await import('@line/liff')
        await liff.init({ liffId })
        if (cancelled) return

        if (forceFresh && liff.isLoggedIn()) liff.logout()

        if (!liff.isLoggedIn()) {
          const redirectUri = window.location.origin + window.location.pathname
          liff.login({ redirectUri })
          return
        }

        setPhase('logging-in')
        setMsg('กำลังเข้าสู่ระบบ... · ဝင်ရောက်နေသည်')

        const idToken = liff.getIDToken()
        if (!idToken) throw new Error('no idToken from LIFF')

        const res = await fetch('/api/auth/line', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ idToken }),
        })
        const data = await res.json()
        if (!res.ok || !data.user) {
          // Stale / expired idToken in LIFF cache: log out and bounce through
          // a fresh OAuth. The ?fresh flag survives the redirect so we know to
          // skip the cached session once we land back here.
          if (res.status === 401) {
            try { liff.logout() } catch {}
            const fresh = window.location.origin + window.location.pathname + '?fresh=1'
            window.location.replace(fresh)
            return
          }
          throw new Error(data.error || 'login failed')
        }

        localStorage.setItem('aung_user', JSON.stringify(data.user))
        router.replace(nextPath)
      } catch (err) {
        if (cancelled) return
        const m = err instanceof Error ? err.message : String(err)
        console.error('[line-login]', m)
        setPhase('error')
        setMsg(m)
      }
    })()

    return () => { cancelled = true }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F5FB] px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 text-center shadow">
        <svg width="72" height="72" viewBox="0 0 200 200" fill="#2B3FBE" aria-label="Aung logo" className="mx-auto mb-4">
          <path fillRule="evenodd" d="M 100 15 L 106 18 L 142 95 L 160 95 C 172 95 184 99 188 108 C 184 105 176 103 166 107 L 155 112 L 182 178 C 183 183 178 186 172 183 C 166 180 158 178 148 180 L 140 180 L 118 128 L 82 128 L 60 180 L 52 180 C 42 178 34 180 28 183 C 22 186 17 183 18 178 L 45 112 L 34 107 C 24 103 16 105 12 108 C 16 99 28 95 40 95 L 58 95 L 94 18 Z M 100 55 L 82 95 L 118 95 Z" />
        </svg>
        <div className="font-black text-xl text-[#2B3FBE] mb-1">Aung</div>
        <div className="text-gray-400 text-xs mb-6" style={{fontFamily:'Noto Sans Myanmar, sans-serif'}}>အောင်</div>

        {phase === 'error' ? (
          <>
            <div className="text-red-600 text-sm font-bold mb-2">เข้าสู่ระบบไม่สำเร็จ</div>
            <div className="text-gray-500 text-xs break-words mb-4">{msg}</div>
            <button
              onClick={() => {
                const fresh = window.location.origin + window.location.pathname + '?fresh=1'
                window.location.replace(fresh)
              }}
              className="w-full bg-[#2B3FBE] text-white rounded-xl py-3 text-sm font-bold"
            >
              ลองใหม่ · ပြန်လည်ကြိုးစား
            </button>
          </>
        ) : (
          <>
            <div className="inline-block w-8 h-8 border-4 border-[#2B3FBE] border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-gray-500 text-sm">{msg}</div>
          </>
        )}
      </div>
    </div>
  )
}
