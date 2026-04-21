import type { Metadata } from 'next'
import './globals.css'
import { ScrollReset } from '@/components/ScrollReset'
import { HomeButton } from '@/components/HomeButton'

export const metadata: Metadata = {
  title: 'Aung — အောင်',
  description: 'Super App สำหรับแรงงานพม่าในไทย · မြန်မာ အလုပ်သမားများအတွက် Super App',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-[#F4F5FB] min-h-screen">
        <ScrollReset />
        <HomeButton />
        {children}
      </body>
    </html>
  )
}

