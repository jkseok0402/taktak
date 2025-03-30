import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '탁구 리그',
  description: '모바일 중심의 탁구 리그 운영 홈페이지',
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
