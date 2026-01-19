'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { AudioInput } from '@/components/AudioInput'
import { ABPlayer } from '@/components/ABPlayer'
import { AdvancedSettings, defaultAdvancedSettings, type AdvancedSettingsData } from '@/components/AdvancedSettings'
import LyricsGeneratorDialog from '@/components/LyricsGeneratorDialog'
import { LyricsDisplay } from '@/components/LyricsDisplay'
import { createTrack, startGenerate, getJob, setPrimaryVariant, createShare, type GenerateOptions } from '@/lib/api'
import { getDeviceId } from '@/hooks/useDeviceId'

// 动态导入波形组件（避免 SSR 问题）
const AudioWaveform = dynamic(
  () => import('@/components/AudioWaveform').then(mod => mod.AudioWaveform),
  { ssr: false, loading: () => <div className="h-32 bg-gray-100 rounded-lg animate-pulse" /> }
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
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">创建音乐</h1>
        <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">录制或上传你的哼唱/清唱音频，AI 将帮你生成音乐</p>

        {/* Step 1: Audio Input (Record or Upload) */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-medium mb-4">第一步：录音或上传</h2>
            <AudioInput onComplete={handleUploadComplete} />
          </div>
        )}

        {/* Step 2: Segment Selection */}
        {step === 'segment' && audioUrl && (
          <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-medium mb-2">第二步：选择重点片段</h2>
            <p className="text-sm text-gray-500 mb-4">
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
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                确认选择
              </button>
              <button
                onClick={handleSkipSegment}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                跳过，使用全部音频
              </button>
            </div>

            <button
              onClick={reset}
              className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              重新上传
            </button>
          </div>
        )}

        {/* Step 3: Style Selection */}
        {step === 'style' && (
          <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-medium mb-4">第三步：选择风格</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 片段信息 */}
            {segment && !skipSegment && (
              <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm">
                <span className="text-primary-700">
                  已选片段: {Math.floor(segment.startMs / 1000)}s - {Math.floor(segment.endMs / 1000)}s
                </span>
                <button
                  onClick={() => setStep('segment')}
                  className="ml-2 text-primary-600 hover:underline"
                >
                  修改
                </button>
              </div>
            )}

            {/* 风格选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音乐风格 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                {MUSIC_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`p-2 text-sm rounded-lg border-2 transition-colors ${
                      style === s.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                <button
                  onClick={() => setStyle('custom')}
                  className={`p-2 text-sm rounded-lg border-2 transition-colors ${
                    style === 'custom'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              )}
            </div>

            {/* 歌词/主题（可选） */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  歌词/主题 <span className="text-gray-400 font-normal">（可选）</span>
                </label>
                <button
                  onClick={() => setShowLyricsDialog(true)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
              <p className="mt-1 text-xs text-gray-400">
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
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              开始生成
            </button>

            <button
              onClick={reset}
              className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              重新上传
            </button>
          </div>
        )}

        {/* Step 4: Generating */}
        {step === 'generating' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4">正在生成...</h2>

            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />

              <div className="w-full max-w-xs mb-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500">{progress}%</p>
              {currentStep && (
                <p className="text-xs text-gray-400 mt-1">
                  当前步骤: {currentStep}
                </p>
              )}
            </div>

            <p className="text-center text-sm text-gray-500">
              生成过程可能需要几分钟，请耐心等待
            </p>
          </div>
        )}

        {/* Step 5: Result with A/B Player */}
        {step === 'result' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-2">生成完成</h2>
            <p className="text-sm text-gray-500 mb-4">
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

            <div className="mt-6 pt-4 border-t">
              {primaryVariantId ? (
                <div className="space-y-3">
                  {shareUrl ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 mb-2">分享链接已生成：</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shareUrl}
                          readOnly
                          className="flex-1 px-3 py-2 text-sm bg-white border rounded-lg"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(shareUrl)}
                          className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          复制
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleShare}
                      className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      生成分享链接
                    </button>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleRegenerate}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      再来一组
                    </button>
                    <button
                      onClick={reset}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      创建新作品
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 text-center">
                    请选择一个版本作为主版本
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleShare}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      分享
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  查看所有历史版本 →
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← 返回首页
          </a>
        </div>
      </div>

      {/* 未选主版本弹窗 */}
      {showSelectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium mb-2">请先选择主版本</h3>
            <p className="text-gray-600 text-sm mb-4">
              分享前需要选择一个版本作为主版本
            </p>
            <div className="space-y-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleQuickSelectAndShare(v.id)}
                  className="w-full py-3 border border-gray-300 rounded-lg hover:bg-primary-50 hover:border-primary-500 transition-colors font-medium"
                >
                  选择版本 {v.variant} 并分享
                </button>
              ))}
              <button
                onClick={() => setShowSelectModal(false)}
                className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
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
