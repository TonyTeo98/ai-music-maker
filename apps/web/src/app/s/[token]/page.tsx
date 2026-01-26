import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SharePlayer } from './SharePlayer'
import { LyricsDisplay } from '@/components/LyricsDisplay'

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ShareDetail {
  id: string
  token: string
  track: {
    id: string
    title?: string
    style?: string
    status: string
  }
  variant: {
    id: string
    variant: string
    audioUrl?: string
    duration?: number
    imageUrl?: string
    imageLargeUrl?: string
    lyrics?: string
  } | null
  viewCount: number
  createdAt: string
}

async function getShare(token: string): Promise<ShareDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/shares/${token}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const share = await getShare(token)

  if (!share) {
    return { title: '分享不存在 - AI Music Maker' }
  }

  const title = share.track.title || 'AI 生成音乐'
  const style = share.track.style || ''

  return {
    title: `${title} - AI Music Maker`,
    description: `${style ? `${style}风格的` : ''}AI 生成音乐，快来听听吧！`,
    openGraph: {
      title: `${title} - AI Music Maker`,
      description: `${style ? `${style}风格的` : ''}AI 生成音乐`,
      type: 'music.song',
    },
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const share = await getShare(token)

  if (!share) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 p-4 md:p-6 text-white">
            <h1 className="text-xl md:text-2xl font-semibold mb-1">
              {share.track.title || 'AI 生成音乐'}
            </h1>
            {share.track.style && (
              <span className="inline-block px-2 py-0.5 bg-white/20 rounded text-xs md:text-sm mt-1">
                {share.track.style}
              </span>
            )}
          </div>

          {/* Player */}
          <div className="p-4 md:p-6">
            {share.variant?.audioUrl ? (
              <SharePlayer
                audioUrl={share.variant.audioUrl}
                duration={share.variant.duration || 0}
                imageUrl={share.variant.imageUrl}
                imageLargeUrl={share.variant.imageLargeUrl}
              />
            ) : (
              <div className="text-center py-8 text-slate-500">
                音频暂不可用
              </div>
            )}
          </div>

          {/* Lyrics */}
          {share.variant?.lyrics && (
            <div className="px-4 md:px-6 pb-4">
              <LyricsDisplay lyrics={share.variant.lyrics} maxHeight="300px" />
            </div>
          )}

          {/* Footer */}
          <div className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="flex items-center justify-between text-xs md:text-sm text-slate-400">
              <span>{share.viewCount} 次播放</span>
              <span>
                {new Date(share.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <a
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium text-base md:text-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            我也要创作
          </a>
          <p className="mt-3 text-xs md:text-sm text-slate-500">
            用 AI Music Maker 将你的哼唱变成音乐
          </p>
        </div>

        {/* Branding */}
        <div className="mt-8 text-center">
          <a href="/" className="text-xs text-slate-400 hover:text-slate-600">
            Powered by AI Music Maker
          </a>
        </div>
      </div>
    </main>
  )
}
