import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'AI Music Maker',
    template: '%s | AI Music Maker',
  },
  description: '将你的哼唱变成专业音乐作品',
  keywords: ['AI', '音乐', '创作', '哼唱', '生成'],
  authors: [{ name: 'AI Music Maker' }],
  openGraph: {
    title: 'AI Music Maker',
    description: '将你的哼唱变成专业音乐作品',
    type: 'website',
    locale: 'zh_CN',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#9333ea',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
