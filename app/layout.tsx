import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: '흥덕탁구단',
  description: '흥덕탁구단 리그관리',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
