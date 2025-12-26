import type { MusicStyle, Provider, Variant } from './constants'

// ===== Track 状态 =====
export type TrackStatus = 'draft' | 'generating' | 'ready' | 'failed' | 'deleted'

// ===== Job 状态 =====
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'

// ===== Job 类型 =====
export type JobType = 'generate' | 'video'

// ===== Asset 类型 =====
export type AssetType = 'input_audio' | 'output_audio' | 'cover' | 'video'

// ===== Asset 状态 =====
export type AssetStatus = 'pending' | 'uploading' | 'ready' | 'failed'

// ===== 生成参数（gen_params） =====
export interface GenParams {
  style: MusicStyle
  provider?: Provider
  // 用户选择的片段（可选，不选则自动）
  segment?: {
    startMs: number
    endMs: number
  }
  // 其他参数后续扩展
  [key: string]: unknown
}

// ===== API 响应 =====
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// ===== Job 进度 =====
export interface JobProgress {
  jobId: string
  status: JobStatus
  progress: number
  currentStep?: string
  errorCode?: string
  errorMsg?: string
}

// ===== Track 变体 =====
export interface TrackVariantInfo {
  id: string
  variant: Variant
  audioUrl: string | null
  duration: number | null
  inputSimilarity: number | null
  audioQuality: number | null
}

// ===== Track 详情 =====
export interface TrackDetail {
  id: string
  status: TrackStatus
  title: string | null
  style: string | null
  primaryVariantId: string | null
  variants: TrackVariantInfo[]
  createdAt: string
  updatedAt: string
}
