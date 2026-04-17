'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollReset() {
  const pathname  = usePathname()
  const prevPath  = useRef<string | null>(null)

  useEffect(() => {
    // ยิงเฉพาะตอน path เปลี่ยนจริง (ไม่ยิงตอน mount ครั้งแรก)
    if (prevPath.current !== null && prevPath.current !== pathname) {
      window.scrollTo(0, 0)
    }
    prevPath.current = pathname
  }, [pathname])

  return null
}
