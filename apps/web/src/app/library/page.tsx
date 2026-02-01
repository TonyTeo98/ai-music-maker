'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useDeviceId } from '@/hooks/useDeviceId'
import { listTracks } from '@/lib/api'
import { CoverImage } from '@/components/CoverImage'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Track {
  id: string
  status: string
  title?: string
  style?: string
  primaryVariantId?: string
  audioUrl?: string
  imageUrl?: string | null
  imageLargeUrl?: string | null
  duration?: number
  createdAt: string
}

export default function LibraryPage() {
  const { deviceId, isLoading: deviceLoading } = useDeviceId()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const loadTracks = useCallback(async () => {
    if (!deviceId) return

    setLoading(true)
    setError(null)

    try {
      const result = await listTracks(deviceId)
      setTracks(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  useEffect(() => {
    if (deviceId) {
      loadTracks()
    }
  }, [deviceId, loadTracks])

  const handlePlay = (trackId: string, audioUrl?: string) => {
    if (!audioUrl) return

    if (playingId === trackId) {
      // 停止播放
      const audio = document.getElementById(`audio-${trackId}`) as HTMLAudioElement
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      setPlayingId(null)
    } else {
      // 停止其他播放
      if (playingId) {
        const prevAudio = document.getElementById(`audio-${playingId}`) as HTMLAudioElement
        if (prevAudio) {
          prevAudio.pause()
          prevAudio.currentTime = 0
        }
      }
      // 开始播放
      const audio = document.getElementById(`audio-${trackId}`) as HTMLAudioElement
      if (audio) {
        audio.play()
        setPlayingId(trackId)
      }
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (deviceLoading) {
    return (
      <main className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <div className="flex items-center justify-center h-64">
            <div
              className="w-10 h-10 rounded-full animate-spin"
              style={{
                border: '3px solid var(--bg-elevated)',
                borderTopColor: 'var(--accent-primary)',
              }}
            />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="flex justify-between items-center p-4 md:p-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)',
              boxShadow: 'var(--shadow-glow-primary)',
            }}
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              我的作品
            </h1>
            <p className="mt-1 text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
              共 {tracks.length} 首作品
            </p>
          </div>
          <Link
            href="/create"
            className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:-translate-y-1"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)',
              boxShadow: 'var(--shadow-glow-primary)',
            }}
          >
            创建新作品
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div
              className="w-10 h-10 rounded-full animate-spin"
              style={{
                border: '3px solid var(--bg-elevated)',
                borderTopColor: 'var(--accent-primary)',
              }}
            />
          </div>
        ) : error ? (
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-error)',
            }}
          >
            {error}
            <button onClick={loadTracks} className="ml-2 underline">
              重试
            </button>
          </div>
        ) : tracks.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: 'var(--text-subtle)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
              还没有作品
            </p>
            <Link
              href="/create"
              className="inline-block px-6 py-3 rounded-xl font-medium text-white"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)',
              }}
            >
              创建第一首
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {tracks.map((track) => (
              <Link
                key={track.id}
                href={`/tracks/${track.id}`}
                className="group card-glass overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  '--hover-glow': 'var(--shadow-glow-primary)',
                } as React.CSSProperties}
              >
                {/* Cover Image */}
                <div className="relative aspect-square overflow-hidden">
                  <CoverImage
                    imageUrl={track.imageUrl}
                    imageLargeUrl={track.imageLargeUrl}
                    alt={track.title || '未命名作品'}
                    size="large"
                    className="w-full h-full rounded-none transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Play Overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handlePlay(track.id, track.audioUrl)
                      }}
                      disabled={!track.audioUrl}
                      className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110 disabled:opacity-50"
                      style={{
                        background: track.audioUrl
                          ? 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)'
                          : 'var(--bg-elevated)',
                        boxShadow: track.audioUrl ? 'var(--shadow-glow-primary)' : 'none',
                      }}
                    >
                      {playingId === track.id ? (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Status Badge */}
                  {track.status === 'generating' && (
                    <div
                      className="absolute top-2 right-2 px-2 py-1 text-xs rounded-full text-white"
                      style={{ backgroundColor: 'var(--color-warning)' }}
                    >
                      生成中...
                    </div>
                  )}
                </div>

                {/* Hidden Audio */}
                {track.audioUrl && (
                  <audio
                    id={`audio-${track.id}`}
                    src={track.audioUrl}
                    onEnded={() => setPlayingId(null)}
                  />
                )}

                {/* Track Info */}
                <div className="p-4">
                  <h3
                    className="font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {track.title || '未命名作品'}
                  </h3>
                  <div
                    className="flex items-center gap-2 text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {track.style && <span className="truncate">{track.style}</span>}
                    {track.style && <span>·</span>}
                    <span>{formatDate(track.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/"
            className="text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  )
}
