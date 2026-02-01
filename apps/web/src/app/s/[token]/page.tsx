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

  const hasImage = share.variant?.imageUrl || share.variant?.imageLargeUrl

  return (
    <main
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Immersive Background */}
      {hasImage && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Blurred cover image */}
          <div
            className="absolute inset-0 scale-110"
            style={{
              backgroundImage: `url(${share.variant?.imageLargeUrl || share.variant?.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(60px)',
              opacity: 0.5,
            }}
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, var(--bg-base) 100%)',
            }}
          />
        </div>
      )}

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
            top: '-100px',
            right: '-50px',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-15 blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--accent-success) 0%, transparent 70%)',
            bottom: '-50px',
            left: '-50px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glass Card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header with gradient */}
          <div
            className="p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)',
            }}
          >
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">
              {share.track.title || 'AI 生成音乐'}
            </h1>
            {share.track.style && (
              <span
                className="inline-block px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                }}
              >
                {share.track.style}
              </span>
            )}
          </div>

          {/* Player */}
          <div className="p-6">
            {share.variant?.audioUrl ? (
              <SharePlayer
                audioUrl={share.variant.audioUrl}
                duration={share.variant.duration || 0}
                imageUrl={share.variant.imageUrl}
                imageLargeUrl={share.variant.imageLargeUrl}
              />
            ) : (
              <div
                className="text-center py-8"
                style={{ color: 'var(--text-muted)' }}
              >
                音频暂不可用
              </div>
            )}
          </div>

          {/* Lyrics */}
          {share.variant?.lyrics && (
            <div className="px-6 pb-4">
              <LyricsDisplay lyrics={share.variant.lyrics} maxHeight="300px" />
            </div>
          )}

          {/* Stats */}
          <div className="px-6 pb-6">
            <div
              className="flex items-center justify-between text-sm"
              style={{ color: 'var(--text-subtle)' }}
            >
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {share.viewCount} 次播放
              </span>
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
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white text-lg transition-all hover:-translate-y-1"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)',
              boxShadow: 'var(--shadow-glow-primary)',
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            我也要创作
          </a>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            用 AI Music Maker 将你的哼唱变成音乐
          </p>
        </div>

        {/* Branding */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-xs transition-colors"
            style={{ color: 'var(--text-subtle)' }}
          >
            Powered by AI Music Maker
          </a>
        </div>
      </div>
    </main>
  )
}
