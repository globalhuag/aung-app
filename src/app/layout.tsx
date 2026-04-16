import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aung — အောင်',
  description: 'Super App สำหรับแรงงานพม่าในไทย',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-[#F4F5FB] min-h-screen">{children}</body>
    </html>
  )
}

