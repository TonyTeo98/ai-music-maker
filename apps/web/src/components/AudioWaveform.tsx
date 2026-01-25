'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'

interface AudioWaveformProps {
  audioUrl: string
  onSegmentChange?: (startMs: number, endMs: number) => void
  minDuration?: number // 最小片段时长（秒）
  maxDuration?: number // 最大片段时长（秒）
  className?: string
}

export function AudioWaveform({
  audioUrl,
  onSegmentChange,
  minDuration = 10,
  maxDuration = 30,
  className = '',
}: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const onSegmentChangeRef = useRef(onSegmentChange)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [segment, setSegment] = useState<{ start: number; end: number } | null>(null)

  // 保持回调引用最新
  useEffect(() => {
    onSegmentChangeRef.current = onSegmentChange
  }, [onSegmentChange])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 初始化 WaveSurfer - 只依赖 audioUrl
  useEffect(() => {
    if (!containerRef.current) return

    const regions = RegionsPlugin.create()

    // 从 CSS 变量读取颜色
    const computedStyle = getComputedStyle(document.documentElement)
    const waveColor = computedStyle.getPropertyValue('--waveform-wave').trim() || '#d1d5db'
    const progressColor = computedStyle.getPropertyValue('--waveform-progress').trim() || '#9333ea'
    const cursorColor = computedStyle.getPropertyValue('--waveform-cursor').trim() || '#9333ea'
    const regionColor = computedStyle.getPropertyValue('--waveform-region').trim() || 'rgba(147, 51, 234, 0.2)'

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      cursorColor,
      cursorWidth: 2,
      height: 80,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      plugins: [regions],
    })

    wavesurferRef.current = ws

    ws.on('ready', () => {
      setIsReady(true)
      const audioDuration = ws.getDuration()
      setDuration(audioDuration)

      // 默认选择前 20 秒（或整个音频如果更短）
      const defaultEnd = Math.min(20, audioDuration)

      const region = regions.addRegion({
        start: 0,
        end: defaultEnd,
        color: regionColor,
        drag: true,
        resize: true,
      })

      setSegment({ start: 0, end: defaultEnd })
      onSegmentChangeRef.current?.(0, defaultEnd * 1000)

      // 监听区域变化
      region.on('update-end', () => {
        let start = region.start
        let end = region.end
        const segmentDuration = end - start

        // 限制片段时长
        if (segmentDuration < minDuration) {
          end = Math.min(start + minDuration, audioDuration)
          if (end - start < minDuration) {
            start = Math.max(0, end - minDuration)
          }
          region.setOptions({ start, end })
        } else if (segmentDuration > maxDuration) {
          end = start + maxDuration
          region.setOptions({ start, end })
        }

        setSegment({ start, end })
        onSegmentChangeRef.current?.(start * 1000, end * 1000)
      })
    })

    ws.on('timeupdate', (time) => {
      setCurrentTime(time)
    })

    ws.on('play', () => setIsPlaying(true))
    ws.on('pause', () => setIsPlaying(false))
    ws.on('finish', () => setIsPlaying(false))

    ws.load(audioUrl)

    return () => {
      if (ws) {
        ws.pause()
        ws.destroy()
      }
    }
  }, [audioUrl, minDuration, maxDuration])

  const togglePlay = useCallback(() => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.playPause()
  }, [])

  const playSegment = useCallback(() => {
    if (!wavesurferRef.current || !segment) return
    wavesurferRef.current.setTime(segment.start)
    wavesurferRef.current.play()

    // 在片段结束时停止
    const checkEnd = () => {
      if (wavesurferRef.current && wavesurferRef.current.getCurrentTime() >= segment.end) {
        wavesurferRef.current.pause()
        wavesurferRef.current.un('timeupdate', checkEnd)
      }
    }
    wavesurferRef.current.on('timeupdate', checkEnd)
  }, [segment])

  return (
    <div className={`w-full ${className}`}>
      {/* Waveform Container */}
      <div
        ref={containerRef}
        className="w-full h-20 min-h-[80px] bg-neutral-50 rounded-lg overflow-hidden"
      />

      {/* Loading State */}
      {!isReady && (
        <div className="flex items-center justify-center h-20 bg-neutral-50 rounded-lg">
          <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <span className="ml-2 text-sm text-neutral-500">加载音频...</span>
        </div>
      )}

      {/* Controls */}
      {isReady && (
        <div className="mt-3 space-y-3">
          {/* Time Display */}
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Segment Info */}
          {segment && (
            <div className="flex items-center justify-between p-2 bg-primary-50 rounded-lg text-sm">
              <span className="text-primary-700">
                已选片段: {formatTime(segment.start)} - {formatTime(segment.end)}
              </span>
              <span className="text-primary-600 font-medium">
                {formatTime(segment.end - segment.start)}
              </span>
            </div>
          )}

          {/* Play Controls */}
          <div className="flex gap-2">
            <button
              onClick={togglePlay}
              className="flex-1 py-2 px-4 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isPlaying ? (
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
                  播放全曲
                </>
              )}
            </button>
            <button
              onClick={playSegment}
              disabled={!segment}
              className="flex-1 py-2 px-4 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              试听片段
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-neutral-400 text-center">
            拖拽波形上的蓝色区域调整片段范围（推荐 {minDuration}-{maxDuration} 秒）
          </p>
        </div>
      )}
    </div>
  )
}
