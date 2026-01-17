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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with blur effect */}
      <div className="absolute inset-0 -z-10">
        {imageUrl || imageLargeUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40"
              style={{
                backgroundImage: `url(${imageLargeUrl || imageUrl})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black" />
        )}
      </div>

      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Content area */}
      <div className="relative z-10 flex flex-col items-center space-y-8 px-4 py-12">
        {/* Large cover image */}
        <div className="relative">
          <CoverImage
            imageUrl={imageUrl}
            imageLargeUrl={imageLargeUrl}
            alt="Track cover"
            size="large"
            className="w-80 h-80 md:w-80 md:h-80 sm:w-64 sm:h-64 shadow-2xl"
          />
        </div>

        {/* Large play button */}
        <button
          onClick={toggle}
          disabled={!isLoaded}
          className="w-24 h-24 md:w-24 md:h-24 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:scale-105"
        >
          {isPlaying ? (
            <svg className="w-10 h-10 md:w-10 md:h-10 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 md:w-10 md:h-10 sm:w-8 sm:h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress bar */}
        <div className="w-full max-w-md space-y-2">
          <div
            className="h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer backdrop-blur-sm"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-primary-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Time display */}
          <div className="flex justify-between text-sm text-white/80">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
