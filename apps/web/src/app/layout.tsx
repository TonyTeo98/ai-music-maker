import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Music Maker',
  description: '将你的哼唱变成音乐',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
