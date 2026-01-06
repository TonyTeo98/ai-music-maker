'use client'

import { useState, useCallback, useRef } from 'react'
import { getPresignUrl, uploadToS3, confirmUpload } from '@/lib/api'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

const ACCEPTED_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
]

interface AudioUploadProps {
  onUploadComplete?: (assetId: string, audioUrl?: string) => void
  className?: string
}

export function AudioUpload({ onUploadComplete, className = '' }: AudioUploadProps) {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('不支持的音频格式，请上传 MP3、WAV、WebM 等格式')
      return
    }

    setStatus('uploading')
    setError(null)
    setFileName(file.name)
    setProgress(10)

    // 创建本地预览 URL
    const localUrl = URL.createObjectURL(file)
    setAudioUrl(localUrl)

    try {
      // 1. 获取 presign URL
      const { assetId, uploadUrl } = await getPresignUrl(file.name, file.type)
      setProgress(30)

      // 2. 上传到 S3
      await uploadToS3(uploadUrl, file)
      setProgress(80)

      // 3. 确认上传
      await confirmUpload(assetId, file.size)
      setProgress(100)

      setStatus('success')
      onUploadComplete?.(assetId, localUrl)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '上传失败')
      URL.revokeObjectURL(localUrl)
      setAudioUrl(null)
    }
  }, [onUploadComplete])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleUpload(file)
    }
  }, [handleUpload])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const reset = () => {
    setStatus('idle')
    setProgress(0)
    setError(null)
    setFileName(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        id="audio-upload"
      />

      {status === 'idle' && (
        <label
          htmlFor="audio-upload"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600">点击或拖拽上传音频文件</p>
          <p className="text-xs text-gray-400 mt-1">支持 MP3、WAV、WebM 等格式</p>
        </label>
      )}

      {status === 'uploading' && (
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-primary-300 rounded-lg bg-primary-50">
          <p className="text-sm text-gray-600 mb-3">{fileName}</p>
          <div className="w-3/4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">上传中 {progress}%</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-green-300 rounded-lg bg-green-50">
          <svg className="w-12 h-12 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-green-600">{fileName} 上传成功</p>
          <button
            onClick={reset}
            className="mt-3 text-sm text-primary-600 hover:underline"
          >
            重新上传
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-red-300 rounded-lg bg-red-50">
          <svg className="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={reset}
            className="mt-3 text-sm text-primary-600 hover:underline"
          >
            重试
          </button>
        </div>
      )}
    </div>
  )
}
