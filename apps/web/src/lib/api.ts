// API 客户端配置

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

// 健康检查
export async function checkHealth() {
  return apiFetch<{ status: string; timestamp: string }>('/health')
}

// Presign URL 响应
interface PresignResponse {
  assetId: string
  uploadUrl: string
  key: string
  expiresIn: number
}

// 获取上传 presign URL
export async function getPresignUrl(filename: string, contentType: string, trackId?: string) {
  return apiFetch<PresignResponse>('/assets/presign', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType, trackId }),
  })
}

// 直接上传文件到 S3
export async function uploadToS3(uploadUrl: string, file: Blob | File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`)
  }
}

// 确认上传完成
export async function confirmUpload(assetId: string, size: number) {
  return apiFetch<{ id: string; status: string }>(`/assets/${assetId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ size }),
  })
}

// ===== Track APIs =====

interface TrackResponse {
  id: string
  status: string
  title?: string
  style?: string
  primaryVariantId?: string
  createdAt: string
}

interface GenerateResponse {
  trackId: string
  jobId: string
  status: string
}

interface JobResponse {
  id: string
  trackId: string
  type: string
  status: string
  progress: number
  currentStep?: string
  errorCode?: string
  errorMsg?: string
  variants: {
    id: string
    variant: string
    audioUrl?: string | null
    duration?: number | null
    imageUrl?: string | null
    imageLargeUrl?: string | null
    lyrics?: string | null
  }[]
  createdAt: string
  startedAt?: string
  completedAt?: string
}

// 创建 Track
export async function createTrack(title?: string, deviceId?: string) {
  return apiFetch<TrackResponse>('/tracks', {
    method: 'POST',
    body: JSON.stringify({ title, deviceId }),
  })
}

// 获取 Track
export async function getTrack(trackId: string) {
  return apiFetch<TrackResponse>(`/tracks/${trackId}`)
}

// 开始生成
export interface GenerateOptions {
  style: string
  inputAssetId: string
  lyrics?: string
  segmentStartMs?: number
  segmentEndMs?: number
  excludeStyles?: string[]
  voiceType?: 'female' | 'male' | 'instrumental'
  model?: 'v40' | 'v45' | 'v45+' | 'v45-lite' | 'v50'
  tension?: number  // 0-1
  styleLock?: number  // 0-1
  audioWeight?: number  // 0-1
}

export async function startGenerate(trackId: string, options: GenerateOptions) {
  return apiFetch<GenerateResponse>(`/tracks/${trackId}/generate`, {
    method: 'POST',
    body: JSON.stringify(options),
  })
}

// 获取 Job 状态
export async function getJob(jobId: string) {
  return apiFetch<JobResponse>(`/jobs/${jobId}`)
}

// 设置主版本
export async function setPrimaryVariant(trackId: string, variantId: string) {
  return apiFetch<TrackResponse>(`/tracks/${trackId}/primary`, {
    method: 'POST',
    body: JSON.stringify({ variantId }),
  })
}

// ===== Share APIs =====

interface ShareResponse {
  id: string
  token: string
  trackId: string
  shareUrl: string
  isPublic: boolean
  expiresAt?: string
  createdAt: string
}

interface ShareDetail {
  id: string
  token: string
  track: {
    id: string
    title?: string
    style?: string
    status: string
  }
  variant: {
    id: string
    variant: string
    audioUrl?: string
    duration?: number
    imageUrl?: string | null
    imageLargeUrl?: string | null
  } | null
  viewCount: number
  createdAt: string
}

// 创建分享链接
export async function createShare(trackId: string) {
  return apiFetch<ShareResponse>(`/tracks/${trackId}/share`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

// 获取分享详情（服务端调用）
export async function getShareByToken(token: string) {
  return apiFetch<ShareDetail>(`/shares/${token}`)
}

// ===== Library APIs =====

interface TrackListItem {
  id: string
  status: string
  title?: string
  style?: string
  primaryVariantId?: string
  audioUrl?: string
  duration?: number
  imageUrl?: string | null
  imageLargeUrl?: string | null
  createdAt: string
}

interface TrackListResponse {
  items: TrackListItem[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// 获取作品列表
export async function listTracks(deviceId: string, page = 1, limit = 20) {
  return apiFetch<TrackListResponse>(`/tracks?deviceId=${encodeURIComponent(deviceId)}&page=${page}&limit=${limit}`)
}

// 删除作品
export async function deleteTrack(trackId: string) {
  return apiFetch<{ success: boolean; message: string }>(`/tracks/${trackId}`, {
    method: 'DELETE',
  })
}

// ===== History APIs =====

export interface HistoryVariant {
  id: string
  variant: string
  audioUrl?: string | null
  duration?: number | null
  imageUrl?: string | null
  imageLargeUrl?: string | null
  lyrics?: string | null
  isPrimary: boolean
}

export interface HistoryBatch {
  batchIndex: number
  createdAt: string
  variants: HistoryVariant[]
}

export interface TrackHistory {
  trackId: string
  title?: string
  style?: string
  primaryVariantId?: string
  totalBatches: number
  history: HistoryBatch[]
}

// 获取作品历史
export async function getTrackHistory(trackId: string) {
  return apiFetch<TrackHistory>(`/tracks/${trackId}/history`)
}
