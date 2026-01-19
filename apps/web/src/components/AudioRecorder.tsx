'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { getPresignUrl, uploadToS3, confirmUpload } from '@/lib/api'
import { useMicrophoneDevices, MicrophoneSelector } from './MicrophoneSelector'

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
  const [isBluetoothDevice, setIsBluetoothDevice] = useState(false)
  const [showSelector, setShowSelector] = useState(false)

  const {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    hasMultipleDevices,
    hasBluetooth,
    isLoading: devicesLoading,
    error: devicesError,
  } = useMicrophoneDevices()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)
  const fileExtensionRef = useRef<string>('webm')
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const getSupportedMimeType = (): { mimeType: string; extension: string } => {
    const types = [
      { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
      { mimeType: 'audio/webm', extension: 'webm' },
      { mimeType: 'audio/mp4', extension: 'mp4' },
      { mimeType: 'audio/aac', extension: 'aac' },
      { mimeType: 'audio/mpeg', extension: 'mp3' },
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type.mimeType)) {
        return type
      }
    }

    return { mimeType: '', extension: 'webm' }
  }

  const startRecording = async () => {
    setError(null)
    chunksRef.current = []

    try {
      // Enumerate audio input devices first
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      console.log('[AudioRecorder] Available audio input devices:', audioInputs.map(d => ({
        deviceId: d.deviceId,
        label: d.label,
        groupId: d.groupId
      })))

      // 构建音频约束，使用选中的设备 ID
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }

      // 如果有选中的设备，添加 deviceId 约束
      if (selectedDeviceId) {
        audioConstraints.deviceId = { exact: selectedDeviceId }
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints
        })
      } catch (err) {
        // OverconstrainedError 降级处理：移除 deviceId 约束重试
        if (err instanceof Error && err.name === 'OverconstrainedError') {
          console.warn('[AudioRecorder] Device constraint failed, falling back to default device')
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          })
        } else {
          throw err
        }
      }
      streamRef.current = stream

      // Check if audio track is enabled and has proper constraints
      const audioTrack = stream.getAudioTracks()[0]
      if (!audioTrack) {
        throw new Error('无法获取音频轨道')
      }
      const settings = audioTrack.getSettings()
      console.log('[AudioRecorder] Audio track:', audioTrack.label, 'enabled:', audioTrack.enabled)
      console.log('[AudioRecorder] Audio track settings:', settings)

      // Detect Bluetooth device (but don't block)
      const isBluetooth = audioTrack.label.toLowerCase().includes('bluetooth') ||
          audioTrack.label.toLowerCase().includes('airpods') ||
          audioTrack.label.toLowerCase().includes('headset')

      if (isBluetooth) {
        console.warn('[AudioRecorder] ⚠️ 检测到蓝牙设备。如果录音失败，请切换到内置麦克风。')
        setIsBluetoothDevice(true)
      } else {
        setIsBluetoothDevice(false)
      }

      // Set up audio level monitoring
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let silentChunks = 0
      let hasDetectedAudio = false
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length

        if (average < 1) {
          silentChunks++
          // After 10 seconds of silence, show helpful error
          if (silentChunks === 100 && !hasDetectedAudio) {
            console.error('[AudioRecorder] ❌ 10秒内未检测到音频输入')
            if (isBluetooth) {
              setError('蓝牙设备无法录音。请在系统设置中切换到内置麦克风或有线麦克风，然后重新开始录音。')
            } else {
              setError('未检测到音频输入。请检查麦克风权限和音量设置。')
            }
            stopRecording()
          } else if (silentChunks > 50) {
            console.warn('[AudioRecorder] No audio input detected. Average level:', average)
          }
        } else {
          if (!hasDetectedAudio) {
            console.log('[AudioRecorder] ✅ 检测到音频输入，音量:', average.toFixed(2))
            hasDetectedAudio = true
          }
          silentChunks = 0
        }

        if (silentChunks % 10 === 0 && silentChunks > 0) {
          console.log('[AudioRecorder] Audio level:', average.toFixed(2), 'silent chunks:', silentChunks)
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel)
      }
      checkAudioLevel()

      const { mimeType, extension } = getSupportedMimeType()
      fileExtensionRef.current = extension
      const options = mimeType ? { mimeType } : undefined
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
          console.log(`[AudioRecorder] Data chunk received: ${e.data.size} bytes, total chunks: ${chunksRef.current.length}`)
        }
      }

      mediaRecorder.onstop = () => {
        console.log(`[AudioRecorder] Recording stopped, total chunks: ${chunksRef.current.length}`)
        const actualMimeType = mimeType || mediaRecorder.mimeType
        const blob = new Blob(chunksRef.current, { type: actualMimeType })
        console.log(`[AudioRecorder] Final blob size: ${blob.size} bytes, type: ${blob.type}`)
        audioBlobRef.current = blob
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setStatus('preview')
        stream.getTracks().forEach(track => track.stop())

        // Clean up audio context
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
      }

      mediaRecorder.onerror = (e) => {
        console.error('[AudioRecorder] MediaRecorder error:', e)
        setError('录音过程中发生错误')
        setStatus('error')
      }

      console.log('[AudioRecorder] Starting recording with mimeType:', mimeType || 'default')
      mediaRecorder.start(100)  // Changed from 1000ms to 100ms for more frequent data collection
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
      // Request any remaining data before stopping
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData()
      }
      mediaRecorderRef.current.stop()
    }
  }

  const handleUpload = async () => {
    if (!audioBlobRef.current) return

    setStatus('uploading')
    setUploadProgress(10)

    try {
      const extension = fileExtensionRef.current
      const filename = `recording_${Date.now()}.${extension}`
      const contentType = audioBlobRef.current.type || 'audio/webm'
      const { assetId, uploadUrl } = await getPresignUrl(filename, contentType)
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
    setIsBluetoothDevice(false)
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

          {/* 设备切换按钮 - 智能显示 */}
          {(hasMultipleDevices || hasBluetooth) && (
            <button
              onClick={() => setShowSelector(true)}
              className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              切换麦克风
            </button>
          )}
        </div>
      )}

      {/* Recording State */}
      {status === 'recording' && (
        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 animate-fade-in">
          {isBluetoothDevice && (
            <div className="mb-4 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-100 text-sm text-center">
                ⚠️ 使用蓝牙设备，如无声音请切换到内置麦克风
              </p>
            </div>
          )}
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

      {/* 麦克风设备选择器 */}
      <MicrophoneSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelect={setSelectedDeviceId}
        hasBluetooth={hasBluetooth}
        isLoading={devicesLoading}
        error={devicesError}
      />
    </div>
  )
}
