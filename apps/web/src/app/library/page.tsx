'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDeviceId } from '@/hooks/useDeviceId'
import { listTracks } from '@/lib/api'
import { CoverImage } from '@/components/CoverImage'

interface Track {
  id: string
  status: string
  title?: string
  style?: string
  primaryVariantId?: string
  audioUrl?: string
  imageUrl?: string
  imageLargeUrl?: string
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
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">我的作品</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">共 {tracks.length} 首作品</p>
          </div>
          <a
            href="/create"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center"
          >
            创建新作品
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
            <button onClick={loadTracks} className="ml-2 underline">
              重试
            </button>
          </div>
        ) : tracks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
            <p className="text-gray-500 mb-4">还没有作品</p>
            <a
              href="/create"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              创建第一首
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {tracks.map((track) => (
              <a
                key={track.id}
                href={`/tracks/${track.id}`}
                className="group bg-neutral-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all block"
              >
                {/* Cover Image with Play Overlay */}
                <div className="relative aspect-square">
                  <CoverImage
                    imageUrl={track.imageUrl}
                    imageLargeUrl={track.imageLargeUrl}
                    alt={track.title || '未命名作品'}
                    size="large"
                    className="w-full h-full rounded-none"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handlePlay(track.id, track.audioUrl)
                      }}
                      disabled={!track.audioUrl}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                        track.audioUrl
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {playingId === track.id ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Status Badge */}
                  {track.status === 'generating' && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/90 text-white text-xs rounded-full">
                      生成中...
                    </div>
                  )}
                </div>

                {/* Hidden Audio Element */}
                {track.audioUrl && (
                  <audio
                    id={`audio-${track.id}`}
                    src={track.audioUrl}
                    onEnded={() => setPlayingId(null)}
                  />
                )}

                {/* Track Info */}
                <div className="p-3">
                  <h3 className="font-medium truncate text-sm text-white">
                    {track.title || '未命名作品'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    {track.style && (
                      <span className="truncate">{track.style}</span>
                    )}
                    {track.style && <span>·</span>}
                    <span>{formatDate(track.createdAt)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-8">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← 返回首页
          </a>
        </div>
      </div>
    </main>
  )
}
