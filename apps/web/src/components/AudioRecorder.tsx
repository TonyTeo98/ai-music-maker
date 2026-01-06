'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { getPresignUrl, uploadToS3, confirmUpload } from '@/lib/api'

type RecordingStatus = 'idle' | 'recording' | 'preview' | 'uploading' | 'success' | 'error'

interface AudioRecorderProps {
  onComplete?: (assetId: string, audioUrl?: string) => void
  className?: string
}

const MAX_DURATION = 5 * 60 // 5 minutes

// Sound wave visualization
function SoundWaveVisualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-300 ${
            isActive ? 'bg-white animate-pulse' : 'bg-white/40'
          }`}
          style={{
            height: isActive ? `${30 + Math.sin(i * 0.8) * 20}%` : '20%',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}

export function AudioRecorder({ onComplete, className = '' }: AudioRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const startRecording = async () => {
    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        audioBlobRef.current = blob
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setStatus('preview')
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000)
      setStatus('recording')
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许访问')
      } else {
        setError('无法访问麦克风，请检查设备连接')
      }
      setStatus('error')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleUpload = async () => {
    if (!audioBlobRef.current) return

    setStatus('uploading')
    setUploadProgress(10)

    try {
      const filename = `recording_${Date.now()}.webm`
      const { assetId, uploadUrl } = await getPresignUrl(filename, 'audio/webm')
      setUploadProgress(30)

      await uploadToS3(uploadUrl, audioBlobRef.current)
      setUploadProgress(80)

      await confirmUpload(assetId, audioBlobRef.current.size)
      setUploadProgress(100)

      setStatus('success')
      onComplete?.(assetId, audioUrl || undefined)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '上传失败')
    }
  }

  const reset = () => {
    cleanup()
    setStatus('idle')
    setDuration(0)
    setError(null)
    setAudioUrl(null)
    setUploadProgress(0)
    audioBlobRef.current = null
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Idle State */}
      {status === 'idle' && (
        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 border-2 border-dashed border-neutral-200 hover:border-primary-300 transition-colors">
          <button
            onClick={startRecording}
            className="group relative w-20 h-20 md:w-24 md:h-24"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-glow-primary group-hover:scale-105 group-active:scale-95 transition-transform" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
          </button>
          <p className="text-neutral-700 font-medium mt-5">点击开始录音</p>
          <p className="text-sm text-neutral-400 mt-1">最长 5 分钟</p>
        </div>
      )}

      {/* Recording State */}
      {status === 'recording' && (
        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-white rounded-full animate-recording" />
            <span className="text-white font-medium">录音中</span>
          </div>

          <SoundWaveVisualizer isActive={true} />

          <p className="text-4xl font-mono text-white font-light my-6 tracking-wider">
            {formatDuration(duration)}
          </p>

          <button
            onClick={stopRecording}
            className="group w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all active:scale-95"
          >
            <span className="w-6 h-6 bg-white rounded-sm" />
          </button>
          <p className="text-white/70 text-sm mt-4">点击停止</p>
        </div>
      )}

      {/* Preview State */}
      {status === 'preview' && audioUrl && (
        <div className="flex flex-col items-center py-8 px-6 rounded-2xl bg-white border border-neutral-200 shadow-soft animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>

          <p className="text-neutral-700 font-medium mb-1">录音完成</p>
          <p className="text-sm text-neutral-400 mb-4">时长: {formatDuration(duration)}</p>

          <audio src={audioUrl} controls className="w-full max-w-xs mb-6 rounded-lg" />

          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={reset}
              className="btn btn-secondary btn-md flex-1"
            >
              重新录制
            </button>
            <button
              onClick={handleUpload}
              className="btn btn-primary btn-md flex-1"
            >
              使用此录音
            </button>
          </div>
        </div>
      )}

      {/* Uploading State */}
      {status === 'uploading' && (
        <div className="flex flex-col items-center py-12 px-6 rounded-2xl bg-white border border-neutral-200 shadow-soft animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary-600 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          <p className="text-neutral-700 font-medium mb-4">正在上传...</p>

          <div className="w-full max-w-xs">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-sm text-neutral-400 text-center mt-2">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && (
        <div className="flex flex-col items-center py-12 px-6 rounded-2xl bg-success-50 border border-success-200 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mb-4 animate-scale-in">
            <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-success-700 font-medium">录音上传成功</p>
          <button onClick={reset} className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
            重新录制
          </button>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="flex flex-col items-center py-12 px-6 rounded-2xl bg-error-50 border border-error-200 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-error-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-error-700 font-medium mb-1">录音失败</p>
          <p className="text-sm text-error-600 text-center px-4">{error}</p>
          <button onClick={reset} className="mt-4 btn btn-secondary btn-sm">
            重试
          </button>
        </div>
      )}
    </div>
  )
}
