'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { getTrackHistory, setPrimaryVariant, createShare, type TrackHistory, type HistoryBatch } from '@/lib/api'
import { LyricsDisplay } from '@/components/LyricsDisplay'

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function TrackDetailPage() {
  const params = useParams()
  const trackId = params.id as string

  const [history, setHistory] = useState<TrackHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadHistory()
  }, [trackId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await getTrackHistory(trackId)
      setHistory(data)
      // 默认展开最新批次
      if (data.history.length > 0) {
        setExpandedBatches(new Set([data.history[0].batchIndex]))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleBatch = (batchIndex: number) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev)
      if (next.has(batchIndex)) {
        next.delete(batchIndex)
      } else {
        next.add(batchIndex)
      }
      return next
    })
  }

  const handlePlay = (variantId: string, audioUrl?: string | null) => {
    if (!audioUrl) return

    if (playingId === variantId) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(audioUrl)
    audioRef.current = audio
    audio.play()
    setPlayingId(variantId)

    audio.onended = () => setPlayingId(null)
    audio.onerror = () => setPlayingId(null)
  }

  const handleSetPrimary = async (variantId: string) => {
    if (!history) return

    try {
      await setPrimaryVariant(trackId, variantId)
      // 刷新数据
      await loadHistory()
    } catch (err) {
      console.error('Set primary failed:', err)
    }
  }

  const handleShare = async () => {
    if (!history?.primaryVariantId) {
      alert('请先选择一个主版本')
      return
    }

    try {
      const share = await createShare(trackId)
      setShareUrl(share.shareUrl)
    } catch (err) {
      console.error('Create share failed:', err)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="space-y-4">
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !history) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-red-600 mb-4">{error || '作品不存在'}</p>
          <a href="/library" className="text-primary-600 hover:underline">
            返回作品库
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a href="/library" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
            ← 返回作品库
          </a>
          <h1 className="text-2xl md:text-3xl font-bold">
            {history.title || '未命名作品'}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {history.style && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-sm">
                {history.style}
              </span>
            )}
            <span className="text-gray-500 text-sm">
              共 {history.totalBatches} 次生成
            </span>
          </div>
        </div>

        {/* Share Section */}
        {shareUrl ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 mb-2">分享链接：</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-white border rounded-lg"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                复制
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <button
              onClick={handleShare}
              disabled={!history.primaryVariantId}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {history.primaryVariantId ? '生成分享链接' : '请先选择主版本'}
            </button>
          </div>
        )}

        {/* History Batches */}
        <div className="space-y-4">
          {history.history.map((batch, index) => (
            <BatchCard
              key={batch.batchIndex}
              batch={batch}
              isLatest={index === 0}
              isExpanded={expandedBatches.has(batch.batchIndex)}
              onToggle={() => toggleBatch(batch.batchIndex)}
              playingId={playingId}
              onPlay={handlePlay}
              onSetPrimary={handleSetPrimary}
            />
          ))}
        </div>

        {history.history.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            暂无生成记录
          </div>
        )}
      </div>
    </main>
  )
}

interface BatchCardProps {
  batch: HistoryBatch
  isLatest: boolean
  isExpanded: boolean
  onToggle: () => void
  playingId: string | null
  onPlay: (variantId: string, audioUrl?: string | null) => void
  onSetPrimary: (variantId: string) => void
}

function BatchCard({
  batch,
  isLatest,
  isExpanded,
  onToggle,
  playingId,
  onPlay,
  onSetPrimary,
}: BatchCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium">
            第 {batch.batchIndex} 次生成
          </span>
          {isLatest && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded">
              最新
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {formatDate(batch.createdAt)}
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {batch.variants.map((variant) => (
              <div
                key={variant.id}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  variant.isPrimary
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    版本 {variant.variant}
                    {variant.isPrimary && (
                      <span className="ml-2 text-primary-600 text-sm">★ 主版本</span>
                    )}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDuration(variant.duration)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onPlay(variant.id, variant.audioUrl)}
                    disabled={!variant.audioUrl}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1 ${
                      variant.audioUrl
                        ? 'bg-gray-100 hover:bg-gray-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {playingId === variant.id ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                        暂停
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        播放
                      </>
                    )}
                  </button>
                  {!variant.isPrimary && (
                    <button
                      onClick={() => onSetPrimary(variant.id)}
                      className="px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      设为主版本
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 歌词展示（使用第一个变体的歌词，A/B 版本歌词相同） */}
          {batch.variants.length > 0 && batch.variants[0].lyrics && (
            <div className="mt-4">
              <LyricsDisplay lyrics={batch.variants[0].lyrics} maxHeight="300px" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
