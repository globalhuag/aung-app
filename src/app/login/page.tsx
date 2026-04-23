'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('aung_user')) {
      router.replace('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-[#F4F5FB]">
      <div className="w-full max-w-sm">
        <div className="bg-[#2B3FBE] px-4 py-8 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <svg width="56" height="56" viewBox="0 0 200 200" fill="white" aria-label="Aung logo" className="flex-shrink-0">
              <path fillRule="evenodd" d="M 100 15 L 106 18 L 142 95 L 160 95 C 172 95 184 99 188 108 C 184 105 176 103 166 107 L 155 112 L 182 178 C 183 183 178 186 172 183 C 166 180 158 178 148 180 L 140 180 L 118 128 L 82 128 L 60 180 L 52 180 C 42 178 34 180 28 183 C 22 186 17 183 18 178 L 45 112 L 34 107 C 24 103 16 105 12 108 C 16 99 28 95 40 95 L 58 95 L 94 18 Z M 100 55 L 82 95 L 118 95 Z" />
            </svg>
            <div className="text-left">
              <div className="text-white font-black text-3xl tracking-wide leading-none">Aung</div>
              <div className="text-white/60 text-xs mt-1" style={{fontFamily:'Noto Sans Myanmar, sans-serif'}}>အောင်</div>
            </div>
          </div>
          <div className="text-white/50 text-xs tracking-wide text-center">
            Super App · แรงงานพม่าในไทย ·{' '}
            <span style={{fontFamily:'Noto Sans Myanmar'}}>မြန်မာ အလုပ်သမား</span>
          </div>
        </div>

        <div className="px-6 py-10">
          <div className="text-center mb-8">
            <div className="text-gray-800 font-bold text-lg mb-1">ยินดีต้อนรับ</div>
            <div className="text-gray-500 text-sm" style={{fontFamily:'Noto Sans Myanmar'}}>ကြိုဆိုပါတယ်</div>
          </div>

          <button
            onClick={() => {
              const liffId = process.env.NEXT_PUBLIC_LIFF_ID
              // liff.line.me is the canonical entry point. On mobile with LINE
              // installed it hops into the LINE app (auto-login from the app
              // session). On desktop / mobile-without-LINE it falls back to
              // LINE's web OAuth. Going straight to /line-login instead skips
              // the app-launch step and always forces the web OAuth flow.
              window.location.href = liffId
                ? `https://liff.line.me/${liffId}`
                : '/line-login'
            }}
            className="w-full bg-[#06C755] hover:bg-[#05b04b] text-white rounded-xl py-4 text-base font-bold flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .628.285.628.63 0 .349-.282.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            <span>
              เข้าสู่ระบบด้วย LINE
              <span className="block text-xs opacity-90 font-normal mt-0.5" style={{fontFamily:'Noto Sans Myanmar'}}>
                LINE ဖြင့် ဝင်ရောက်မည်
              </span>
            </span>
          </button>

          <div className="text-center text-gray-400 text-xs mt-6 leading-relaxed">
            ใช้บัญชี LINE ของคุณเพื่อเข้าสู่ระบบ<br/>
            <span style={{fontFamily:'Noto Sans Myanmar'}}>သင်၏ LINE အကောင့်ဖြင့် ဝင်ရောက်ပါ</span>
          </div>
        </div>
      </div>
    </div>
  )
}
