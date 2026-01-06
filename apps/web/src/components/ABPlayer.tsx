'use client'

import { useState, useRef, useCallback } from 'react'

interface Variant {
  id: string
  variant: string
  audioUrl?: string | null
  duration?: number | null
}

interface ABPlayerProps {
  variants: Variant[]
  primaryVariantId?: string | null
  onSelectPrimary?: (variantId: string) => void
  className?: string
}

export function ABPlayer({
  variants,
  primaryVariantId,
  onSelectPrimary,
  className = '',
}: ABPlayerProps) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [currentTimes, setCurrentTimes] = useState<Record<string, number>>({})
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  const stopAll = useCallback(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    })
    setPlayingId(null)
  }, [])

  const play = useCallback((variantId: string) => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (audio && id !== variantId) {
        audio.pause()
      }
    })

    const audio = audioRefs.current[variantId]
    if (audio) {
      audio.play()
      setPlayingId(variantId)
    }
  }, [])

  const pause = useCallback((variantId: string) => {
    const audio = audioRefs.current[variantId]
    if (audio) {
      audio.pause()
    }
    if (playingId === variantId) {
      setPlayingId(null)
    }
  }, [playingId])

  const toggle = useCallback((variantId: string) => {
    if (playingId === variantId) {
      pause(variantId)
    } else {
      play(variantId)
    }
  }, [playingId, play, pause])

  const handleTimeUpdate = useCallback((variantId: string, time: number) => {
    setCurrentTimes((prev) => ({ ...prev, [variantId]: time }))
  }, [])

  const handleEnded = useCallback((variantId: string) => {
    if (playingId === variantId) {
      setPlayingId(null)
    }
  }, [playingId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {variants.map((v, index) => {
        const isPlaying = playingId === v.id
        const isPrimary = primaryVariantId === v.id
        const currentTime = currentTimes[v.id] || 0
        const duration = v.duration || 0
        const progress = duration > 0 ? (currentTime / duration) * 100 : 0

        return (
          <div
            key={v.id}
            className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
              isPrimary
                ? 'bg-gradient-to-br from-primary-50 to-primary-100/50 ring-2 ring-primary-500 shadow-glow-primary'
                : 'bg-white border border-neutral-200 hover:border-neutral-300 shadow-soft hover:shadow-soft-md'
            }`}
          >
            {/* Primary Badge */}
            {isPrimary && (
              <div className="absolute top-3 right-3">
                <span className="tag tag-primary">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  主版本
                </span>
              </div>
            )}

            <div className="p-5">
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                {/* Play Button */}
                <button
                  onClick={() => toggle(v.id)}
                  disabled={!v.audioUrl}
                  className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isPrimary
                      ? 'bg-gradient-primary shadow-glow-primary'
                      : 'bg-neutral-100 hover:bg-neutral-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                >
                  {isPlaying ? (
                    <svg className={`w-6 h-6 ${isPrimary ? 'text-white' : 'text-neutral-700'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className={`w-6 h-6 ml-0.5 ${isPrimary ? 'text-white' : 'text-neutral-700'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isPrimary ? 'text-primary-700' : 'text-neutral-900'}`}>
                      版本 {v.variant}
                    </span>
                    {index === 0 && !isPrimary && (
                      <span className="tag">A</span>
                    )}
                    {index === 1 && !isPrimary && (
                      <span className="tag">B</span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </p>
                </div>
              </div>

              {/* Audio element (hidden) */}
              {v.audioUrl && (
                <audio
                  ref={(el) => { audioRefs.current[v.id] = el }}
                  src={v.audioUrl}
                  onTimeUpdate={(e) => handleTimeUpdate(v.id, e.currentTarget.currentTime)}
                  onEnded={() => handleEnded(v.id)}
                  preload="metadata"
                />
              )}

              {/* Progress bar */}
              <div
                className="h-2 bg-neutral-200 rounded-full overflow-hidden cursor-pointer mb-4"
                onClick={(e) => {
                  const audio = audioRefs.current[v.id]
                  if (audio && duration > 0) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const percent = (e.clientX - rect.left) / rect.width
                    audio.currentTime = percent * duration
                  }
                }}
              >
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    isPrimary ? 'bg-gradient-primary' : 'bg-neutral-400'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {onSelectPrimary && !isPrimary && (
                  <button
                    onClick={() => onSelectPrimary(v.id)}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    选为主版本
                  </button>
                )}

                {isPrimary && (
                  <div className="flex items-center gap-2 text-sm text-primary-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    已选为主版本
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Stop all button */}
      {playingId && (
        <button
          onClick={stopAll}
          className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          停止播放
        </button>
      )}
    </div>
  )
}
