'use client'

import { useState, useEffect } from 'react'
import { AudioUpload } from './AudioUpload'
import { AudioRecorder } from './AudioRecorder'

type InputMode = 'record' | 'upload'

interface AudioInputProps {
  onComplete?: (assetId: string, audioUrl?: string) => void
  className?: string
}

export function AudioInput({ onComplete, className = '' }: AudioInputProps) {
  const [mode, setMode] = useState<InputMode>('record')
  const [supportsRecording, setSupportsRecording] = useState(true)

  useEffect(() => {
    const checkSupport = async () => {
      try {
        const supported = !!(
          navigator.mediaDevices &&
          typeof navigator.mediaDevices.getUserMedia === 'function' &&
          typeof window.MediaRecorder === 'function'
        )
        setSupportsRecording(supported)
        if (!supported) {
          setMode('upload')
        }
      } catch {
        setSupportsRecording(false)
        setMode('upload')
      }
    }
    checkSupport()
  }, [])

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Switcher */}
      {supportsRecording && (
        <div className="flex p-1 bg-neutral-100 rounded-xl mb-6">
          <button
            onClick={() => setMode('record')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              mode === 'record'
                ? 'bg-white text-neutral-900 shadow-soft'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              录音
            </span>
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              mode === 'upload'
                ? 'bg-white text-neutral-900 shadow-soft'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              上传文件
            </span>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="animate-fade-in">
        {mode === 'record' && supportsRecording ? (
          <AudioRecorder onComplete={onComplete} />
        ) : (
          <AudioUpload onUploadComplete={onComplete} />
        )}
      </div>
    </div>
  )
}
