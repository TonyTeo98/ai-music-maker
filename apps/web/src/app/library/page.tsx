'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDeviceId } from '@/hooks/useDeviceId'
import { listTracks } from '@/lib/api'

interface Track {
  id: string
  status: string
  title?: string
  style?: string
  primaryVariantId?: string
  audioUrl?: string
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
          <div className="space-y-3 md:space-y-4">
            {tracks.map((track) => (
              <a
                key={track.id}
                href={`/tracks/${track.id}`}
                className="bg-white rounded-xl shadow-sm border p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:border-primary-300 transition-colors block"
              >
                {/* Play Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handlePlay(track.id, track.audioUrl)
                  }}
                  disabled={!track.audioUrl}
                  className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
                    track.audioUrl
                      ? 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {playingId === track.id ? (
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 md:w-5 md:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Hidden Audio Element */}
                {track.audioUrl && (
                  <audio
                    id={`audio-${track.id}`}
                    src={track.audioUrl}
                    onEnded={() => setPlayingId(null)}
                  />
                )}

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate text-sm md:text-base">
                    {track.title || '未命名作品'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-500 mt-1">
                    {track.style && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {track.style}
                      </span>
                    )}
                    <span className="hidden sm:inline">{formatDuration(track.duration)}</span>
                    <span>{formatDate(track.createdAt)}</span>
                    {track.status === 'generating' && (
                      <span className="text-yellow-600">生成中...</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  {/* View Detail */}
                  <span className="p-2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
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
