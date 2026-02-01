'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AudioInput } from '@/components/AudioInput'
import { ABPlayer } from '@/components/ABPlayer'
import { AdvancedSettings, defaultAdvancedSettings, type AdvancedSettingsData } from '@/components/AdvancedSettings'
import LyricsGeneratorDialog from '@/components/LyricsGeneratorDialog'
import { LyricsDisplay } from '@/components/LyricsDisplay'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createTrack, startGenerate, getJob, setPrimaryVariant, createShare, type GenerateOptions } from '@/lib/api'
import { getDeviceId } from '@/hooks/useDeviceId'

// 动态导入波形组件（避免 SSR 问题）
const AudioWaveform = dynamic(
  () => import('@/components/AudioWaveform').then(mod => mod.AudioWaveform),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-32 rounded-xl animate-pulse"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      />
    )
  }
)

const MUSIC_STYLES = [
  { value: 'pop', label: '流行' },
  { value: 'rock', label: '摇滚' },
  { value: 'jazz', label: '爵士' },
  { value: 'electronic', label: '电子' },
  { value: 'classical', label: '古典' },
  { value: 'hip-hop', label: '嘻哈' },
  { value: 'r&b', label: 'R&B' },
  { value: 'folk', label: '民谣' },
]

type Step = 'upload' | 'segment' | 'style' | 'generating' | 'result'

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: 'upload', label: '上传', number: 1 },
  { key: 'segment', label: '选段', number: 2 },
  { key: 'style', label: '风格', number: 3 },
  { key: 'generating', label: '生成', number: 4 },
  { key: 'result', label: '完成', number: 5 },
]

// Step Progress Indicator Component
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep)

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = step.key === currentStep
        const isUpcoming = index > currentIndex

        return (
          <div key={step.key} className="flex items-center">
            {/* Step circle */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                isCurrent ? 'animate-pulse-glow' : ''
              }`}
              style={{
                backgroundColor: isCompleted
                  ? 'var(--accent-success)'
                  : isCurrent
                  ? 'var(--accent-primary)'
                  : 'var(--bg-elevated)',
                color: isCompleted || isCurrent ? 'white' : 'var(--text-muted)',
                boxShadow: isCurrent ? 'var(--shadow-glow-primary)' : 'none',
              }}
            >
              {isCompleted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className="w-8 h-0.5 mx-1"
                style={{
                  backgroundColor: index < currentIndex ? 'var(--accent-success)' : 'var(--border-default)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Animated circular progress for generating state
function GeneratingProgress({ progress, currentStep }: { progress: number; currentStep: string }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center py-12">
      {/* Circular progress */}
      <div className="relative w-40 h-40 mb-6">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-primary)" />
              <stop offset="100%" stopColor="var(--accent-success)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {progress}%
          </span>
          {/* Sound wave animation */}
          <div className="flex items-end gap-0.5 h-4 mt-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  height: '100%',
                  animation: `soundWave 0.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Status text */}
      <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
        AI 正在创作中...
      </p>
      {currentStep && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {currentStep}
        </p>
      )}
      <p className="text-xs mt-4" style={{ color: 'var(--text-subtle)' }}>
        生成过程可能需要几分钟，请耐心等待
      </p>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes soundWave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}

interface Variant {
  id: string
  variant: string
  audioUrl?: string | null
  duration?: number | null
  imageUrl?: string | null
  imageLargeUrl?: string | null
  lyrics?: string | null
}

export default function CreatePage() {
  const [step, setStep] = useState<Step>('upload')
  const [assetId, setAssetId] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [trackId, setTrackId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [style, setStyle] = useState<string>('pop')
  const [customStyle, setCustomStyle] = useState<string>('')
  const [lyrics, setLyrics] = useState<string>('')
  const [segment, setSegment] = useState<{ startMs: number; endMs: number } | null>(null)
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettingsData>(defaultAdvancedSettings)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [variants, setVariants] = useState<Variant[]>([])
  const [primaryVariantId, setPrimaryVariantIdState] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [skipSegment, setSkipSegment] = useState(false)
  const [showLyricsDialog, setShowLyricsDialog] = useState(false)

  const handleUploadComplete = (id: string, url?: string) => {
    setAssetId(id)
    setAudioUrl(url || null)
    setStep('segment')
  }

  const handleSegmentChange = (startMs: number, endMs: number) => {
    setSegment({ startMs, endMs })
  }

  const handleSkipSegment = () => {
    setSkipSegment(true)
    setSegment(null)
    setStep('style')
  }

  const handleConfirmSegment = () => {
    setStep('style')
  }

  // 获取最终使用的风格
  const getFinalStyle = () => {
    if (style === 'custom' && customStyle.trim()) {
      return customStyle.trim()
    }
    return style
  }

  const handleStartGenerate = async () => {
    if (!assetId) return
    const finalStyle = getFinalStyle()
    if (!finalStyle) return

    setError(null)
    setStep('generating')
    setProgress(0)

    try {
      // 创建 Track（带 deviceId）
      const deviceId = getDeviceId()
      const track = await createTrack(undefined, deviceId || undefined)
      setTrackId(track.id)

      // 构建生成选项
      const options: GenerateOptions = {
        style: finalStyle,
        inputAssetId: assetId,
        lyrics: lyrics || undefined,
        segmentStartMs: segment?.startMs,
        segmentEndMs: segment?.endMs,
        excludeStyles: advancedSettings.excludeStyles.length > 0 ? advancedSettings.excludeStyles : undefined,
        voiceType: advancedSettings.voiceType || undefined,
        model: advancedSettings.model,
        // 将 0-100 的值转换为 0-1
        tension: advancedSettings.tension / 100,
        styleLock: advancedSettings.styleLock / 100,
        audioWeight: advancedSettings.audioWeight / 100,
      }

      const result = await startGenerate(track.id, options)
      setJobId(result.jobId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      setStep('style')
    }
  }

  // 再来一组 - 基于同一输入重新生成
  const handleRegenerate = async () => {
    if (!assetId || !trackId) return
    const finalStyle = getFinalStyle()
    if (!finalStyle) return

    setError(null)
    setJobId(null) // 先清除旧的 jobId，防止轮询使用旧值
    setStep('generating')
    setProgress(0)
    setVariants([])
    setPrimaryVariantIdState(null)
    setShareUrl(null)

    try {
      const options: GenerateOptions = {
        style: finalStyle,
        inputAssetId: assetId,
        lyrics: lyrics || undefined,
        segmentStartMs: segment?.startMs,
        segmentEndMs: segment?.endMs,
        excludeStyles: advancedSettings.excludeStyles.length > 0 ? advancedSettings.excludeStyles : undefined,
        voiceType: advancedSettings.voiceType || undefined,
        model: advancedSettings.model,
        // 将 0-100 的值转换为 0-1
        tension: advancedSettings.tension / 100,
        styleLock: advancedSettings.styleLock / 100,
        audioWeight: advancedSettings.audioWeight / 100,
      }

      const result = await startGenerate(trackId, options)
      setJobId(result.jobId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      setStep('result')
    }
  }

  // 轮询 Job 状态
  const pollJobStatus = useCallback(async () => {
    if (!jobId) return

    try {
      const job = await getJob(jobId)
      setProgress(job.progress)
      setCurrentStep(job.currentStep || '')

      if (job.status === 'succeeded') {
        setVariants(job.variants)
        setStep('result')
      } else if (job.status === 'failed') {
        setError(job.errorMsg || '生成失败')
        setStep('style')
      }

      return job.status
    } catch (err) {
      console.error('Poll error:', err)
      return 'error'
    }
  }, [jobId])

  useEffect(() => {
    if (step !== 'generating' || !jobId) return

    const interval = setInterval(async () => {
      const status = await pollJobStatus()
      if (status === 'succeeded' || status === 'failed' || status === 'error') {
        clearInterval(interval)
      }
    }, 2000)

    // 立即执行一次
    pollJobStatus()

    return () => clearInterval(interval)
  }, [step, jobId, pollJobStatus])

  // 选择主版本
  const handleSelectPrimary = async (variantId: string) => {
    if (!trackId) return

    try {
      await setPrimaryVariant(trackId, variantId)
      setPrimaryVariantIdState(variantId)
    } catch (err) {
      console.error('Set primary failed:', err)
    }
  }

  // 创建分享链接
  const handleShare = async () => {
    if (!trackId) return

    // 未选主版本时弹窗拦截
    if (!primaryVariantId) {
      setShowSelectModal(true)
      return
    }

    try {
      const share = await createShare(trackId)
      setShareUrl(share.shareUrl)
    } catch (err) {
      console.error('Create share failed:', err)
    }
  }

  // 快捷选择主版本并分享
  const handleQuickSelectAndShare = async (variantId: string) => {
    if (!trackId) return

    try {
      await setPrimaryVariant(trackId, variantId)
      setPrimaryVariantIdState(variantId)
      setShowSelectModal(false)

      // 自动创建分享
      const share = await createShare(trackId)
      setShareUrl(share.shareUrl)
    } catch (err) {
      console.error('Quick select failed:', err)
    }
  }

  const reset = () => {
    setStep('upload')
    setAssetId(null)
    setAudioUrl(null)
    setTrackId(null)
    setJobId(null)
    setProgress(0)
    setCurrentStep('')
    setVariants([])
    setPrimaryVariantIdState(null)
    setShareUrl(null)
    setError(null)
    setCustomStyle('')
    setLyrics('')
    setSegment(null)
    setSkipSegment(false)
    setAdvancedSettings(defaultAdvancedSettings)
    setShowSelectModal(false)
  }

  return (
    <main className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="flex justify-between items-center p-4 md:p-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)',
              boxShadow: 'var(--shadow-glow-primary)',
            }}
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        {/* Page Title */}
        <div className="text-center mb-6">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            创建音乐
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            录制或上传你的哼唱/清唱音频，AI 将帮你生成音乐
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Step 1: Audio Input (Record or Upload) */}
        {step === 'upload' && (
          <div className="card-glass p-4 md:p-6">
            <h2
              className="text-lg font-medium mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              第一步：录音或上传
            </h2>
            <AudioInput onComplete={handleUploadComplete} />
          </div>
        )}

        {/* Step 2: Segment Selection */}
        {step === 'segment' && audioUrl && (
          <div className="card-glass p-4 md:p-6">
            <h2
              className="text-lg font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              第二步：选择重点片段
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              选择音频中最精彩的部分（推荐 10-30 秒），AI 将重点参考这段内容
            </p>

            <AudioWaveform
              audioUrl={audioUrl}
              onSegmentChange={handleSegmentChange}
              minDuration={10}
              maxDuration={30}
            />

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleConfirmSegment}
                className="flex-1 btn-primary py-3 rounded-xl font-medium"
              >
                确认选择
              </button>
              <button
                onClick={handleSkipSegment}
                className="flex-1 btn-secondary py-3 rounded-xl"
              >
                跳过，使用全部音频
              </button>
            </div>

            <button
              onClick={reset}
              className="w-full mt-3 py-2 text-sm btn-ghost"
            >
              重新上传
            </button>
          </div>
        )}

        {/* Step 3: Style Selection */}
        {step === 'style' && (
          <div className="card-glass p-4 md:p-6">
            <h2
              className="text-lg font-medium mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              第三步：选择风格
            </h2>

            {error && (
              <div
                className="mb-4 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  color: 'var(--color-error)',
                }}
              >
                {error}
              </div>
            )}

            {/* 片段信息 */}
            {segment && !skipSegment && (
              <div
                className="mb-4 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: 'var(--accent-primary-light)',
                  border: '1px solid var(--accent-primary)',
                }}
              >
                <span style={{ color: 'var(--accent-primary)' }}>
                  已选片段: {Math.floor(segment.startMs / 1000)}s - {Math.floor(segment.endMs / 1000)}s
                </span>
                <button
                  onClick={() => setStep('segment')}
                  className="ml-2 hover:underline"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  修改
                </button>
              </div>
            )}

            {/* 风格选择 */}
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                音乐风格 <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                {MUSIC_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className="p-2 text-sm rounded-xl transition-colors"
                    style={{
                      border: style === s.value
                        ? '2px solid var(--accent-primary)'
                        : '2px solid var(--border-default)',
                      backgroundColor: style === s.value
                        ? 'var(--accent-primary-light)'
                        : 'transparent',
                      color: style === s.value
                        ? 'var(--accent-primary)'
                        : 'var(--text-primary)',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
                <button
                  onClick={() => setStyle('custom')}
                  className="p-2 text-sm rounded-xl transition-colors"
                  style={{
                    border: style === 'custom'
                      ? '2px solid var(--accent-primary)'
                      : '2px solid var(--border-default)',
                    backgroundColor: style === 'custom'
                      ? 'var(--accent-primary-light)'
                      : 'transparent',
                    color: style === 'custom'
                      ? 'var(--accent-primary)'
                      : 'var(--text-primary)',
                  }}
                >
                  自定义
                </button>
              </div>
              {style === 'custom' && (
                <input
                  type="text"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder="输入自定义风格，如：轻快的夏日海滩风"
                  className="input"
                />
              )}
            </div>

            {/* 歌词/主题（可选） */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label
                  className="block text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  歌词/主题 <span style={{ color: 'var(--text-subtle)' }}>（可选）</span>
                </label>
                <button
                  onClick={() => setShowLyricsDialog(true)}
                  className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors"
                  style={{
                    color: 'var(--accent-primary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-primary-light)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  AI 生成
                </button>
              </div>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="输入歌词、主题或想要表达的内容..."
                rows={3}
                className="input resize-none"
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--text-subtle)' }}>
                可以输入完整歌词，或简单描述想要的主题
              </p>
            </div>

            {/* 高级设置 */}
            <div className="mb-6">
              <AdvancedSettings
                value={advancedSettings}
                onChange={setAdvancedSettings}
              />
            </div>

            <button
              onClick={handleStartGenerate}
              disabled={style === 'custom' && !customStyle.trim()}
              className="w-full btn-primary py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              开始生成
            </button>

            <button
              onClick={reset}
              className="w-full mt-3 py-2 text-sm btn-ghost"
            >
              重新上传
            </button>
          </div>
        )}

        {/* Step 4: Generating */}
        {step === 'generating' && (
          <div className="card-glass p-6">
            <h2
              className="text-lg font-medium mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              正在生成...
            </h2>

            <GeneratingProgress progress={progress} currentStep={currentStep} />
          </div>
        )}

        {/* Step 5: Result with A/B Player */}
        {step === 'result' && (
          <div className="card-glass p-6">
            <h2
              className="text-lg font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              生成完成
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              试听两个版本，选择你喜欢的作为主版本
            </p>

            <ABPlayer
              variants={variants}
              primaryVariantId={primaryVariantId}
              onSelectPrimary={handleSelectPrimary}
            />

            {/* 歌词展示区域 */}
            {variants.length > 0 && variants[0].lyrics && (
              <div className="mt-6">
                <LyricsDisplay lyrics={variants[0].lyrics} />
              </div>
            )}

            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
              {primaryVariantId ? (
                <div className="space-y-3">
                  {shareUrl ? (
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        backgroundColor: 'var(--accent-success-light)',
                        border: '1px solid var(--accent-success)',
                      }}
                    >
                      <p className="text-sm mb-2" style={{ color: 'var(--accent-success)' }}>
                        分享链接已生成：
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shareUrl}
                          readOnly
                          className="input flex-1 text-sm"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(shareUrl)}
                          className="btn-primary px-3 py-2 text-sm rounded-xl"
                        >
                          复制
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleShare}
                      className="w-full btn-success py-3 rounded-xl font-medium"
                    >
                      生成分享链接
                    </button>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleRegenerate}
                      className="flex-1 btn-secondary py-3 rounded-xl font-medium"
                    >
                      再来一组
                    </button>
                    <button
                      onClick={reset}
                      className="flex-1 btn-secondary py-3 rounded-xl font-medium"
                    >
                      创建新作品
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-center" style={{ color: 'var(--text-subtle)' }}>
                    请选择一个版本作为主版本
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleShare}
                      className="flex-1 btn-success py-3 rounded-xl font-medium"
                    >
                      分享
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="flex-1 btn-secondary py-3 rounded-xl font-medium"
                    >
                      再来一组
                    </button>
                  </div>
                </div>
              )}
            </div>

            {trackId && (
              <div className="mt-4 text-center">
                <a
                  href={`/tracks/${trackId}`}
                  className="text-sm hover:underline"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  查看所有历史版本 →
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <a
            href="/"
            className="text-sm hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            ← 返回首页
          </a>
        </div>
      </div>

      {/* 未选主版本弹窗 */}
      {showSelectModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="card-glass p-6 max-w-sm w-full mx-4">
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              请先选择主版本
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              分享前需要选择一个版本作为主版本
            </p>
            <div className="space-y-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleQuickSelectAndShare(v.id)}
                  className="w-full py-3 rounded-xl font-medium transition-colors"
                  style={{
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-primary-light)'
                    e.currentTarget.style.borderColor = 'var(--accent-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = 'var(--border-default)'
                  }}
                >
                  选择版本 {v.variant} 并分享
                </button>
              ))}
              <button
                onClick={() => setShowSelectModal(false)}
                className="w-full py-2 text-sm"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 歌词生成对话框 */}
      <LyricsGeneratorDialog
        isOpen={showLyricsDialog}
        onClose={() => setShowLyricsDialog(false)}
        onGenerate={(generatedLyrics) => setLyrics(generatedLyrics)}
      />
    </main>
  )
}
