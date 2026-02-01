'use client'

import { useState, useRef, useEffect } from 'react'
import { CoverImage } from '@/components/CoverImage'

interface SharePlayerProps {
  audioUrl: string
  duration: number
  imageUrl?: string | null
  imageLargeUrl?: string | null
}

export function SharePlayer({ audioUrl, duration, imageUrl, imageLargeUrl }: SharePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || duration <= 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audio.currentTime = percent * duration
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleCanPlay = () => setIsLoaded(true)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Cover and Play Button */}
      <div className="flex items-center gap-4">
        {/* Album Cover */}
        <div
          className="flex-shrink-0"
          style={{
            boxShadow: 'var(--shadow-md)',
            borderRadius: '0.75rem',
          }}
        >
          <CoverImage
            imageUrl={imageUrl}
            imageLargeUrl={imageLargeUrl}
            alt="Track cover"
            size="medium"
            className="w-24 h-24"
          />
        </div>

        {/* Play Button */}
        <button
          onClick={toggle}
          disabled={!isLoaded}
          aria-label={isPlaying ? '暂停' : '播放'}
          aria-pressed={isPlaying}
          className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)',
            boxShadow: 'var(--shadow-glow-primary)',
          }}
        >
          {isPlaying ? (
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

      {/* Progress Bar */}
      <div className="space-y-2">
        <div
          role="slider"
          tabIndex={0}
          aria-label="播放进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="h-2 rounded-full overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{
            backgroundColor: 'var(--glass-border)',
            '--tw-ring-color': 'var(--accent-primary)',
          } as React.CSSProperties}
          onClick={handleSeek}
          onKeyDown={(e) => {
            const audio = audioRef.current
            if (!audio || duration <= 0) return
            if (e.key === 'ArrowRight') {
              audio.currentTime = Math.min(duration, audio.currentTime + 5)
            } else if (e.key === 'ArrowLeft') {
              audio.currentTime = Math.max(0, audio.currentTime - 5)
            }
          }}
        >
          <div
            className="h-full transition-transform duration-100 origin-left"
            style={{
              background: 'linear-gradient(90deg, var(--accent-primary) 0%, #9333EA 100%)',
              transform: `scaleX(${progress / 100})`,
            }}
          />
        </div>

        {/* Time Display */}
        <div
          className="flex justify-between text-xs"
          style={{ color: 'var(--text-subtle)' }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
