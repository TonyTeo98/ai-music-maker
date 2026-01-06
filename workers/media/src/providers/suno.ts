// Suno API Provider
// 文档参考: https://docs.suno.ai (需要实际 API 文档)

import { MusicProvider, GenerateRequest, GenerateResult } from './types'

const SUNO_API_BASE = process.env.SUNO_API_BASE_URL || 'https://api.suno.ai'
const SUNO_API_KEY = process.env.SUNO_API_KEY || ''

interface SunoGenerateResponse {
  id: string
  status: string
}

interface SunoTaskResponse {
  id: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  audio_url?: string
  audio_url_b?: string
  duration?: number
  error?: string
}

export class SunoProvider implements MusicProvider {
  name = 'suno'

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${SUNO_API_BASE}${path}`
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Suno API error: ${res.status} - ${text}`)
    }

    return res.json()
  }

  async submitGenerate(request: GenerateRequest): Promise<{ taskId: string }> {
    // 开发模式：如果没有 API Key，使用 mock
    if (!SUNO_API_KEY) {
      console.log('[SunoProvider] No API key, using mock mode')
      return { taskId: `mock_${Date.now()}` }
    }

    const response = await this.request<SunoGenerateResponse>('/v1/generate', {
      method: 'POST',
      body: JSON.stringify({
        audio_url: request.audioUrl,
        style: request.style,
        segment_start_ms: request.segment?.startMs,
        segment_end_ms: request.segment?.endMs,
      }),
    })

    return { taskId: response.id }
  }

  async queryTask(taskId: string): Promise<GenerateResult> {
    // 开发模式：mock 响应
    if (taskId.startsWith('mock_')) {
      return this.mockQueryTask(taskId)
    }

    const response = await this.request<SunoTaskResponse>(`/v1/tasks/${taskId}`)

    const result: GenerateResult = {
      taskId: response.id,
      status: response.status === 'complete' ? 'completed' : response.status,
    }

    if (response.status === 'complete' && response.audio_url) {
      result.variants = [
        {
          variant: 'A',
          audioUrl: response.audio_url,
          duration: response.duration || 0,
        },
      ]
      if (response.audio_url_b) {
        result.variants.push({
          variant: 'B',
          audioUrl: response.audio_url_b,
          duration: response.duration || 0,
        })
      }
    }

    if (response.error) {
      result.error = response.error
    }

    return result
  }

  // Mock 实现用于开发测试
  private mockQueryTask(taskId: string): GenerateResult {
    const timestamp = parseInt(taskId.replace('mock_', ''))
    const elapsed = Date.now() - timestamp

    // 模拟 10 秒后完成
    if (elapsed < 3000) {
      return { taskId, status: 'pending' }
    }
    if (elapsed < 6000) {
      return { taskId, status: 'processing' }
    }

    // 完成，返回 mock 音频 URL
    return {
      taskId,
      status: 'completed',
      variants: [
        {
          variant: 'A',
          audioUrl: 'https://example.com/mock-audio-a.mp3',
          duration: 180,
        },
        {
          variant: 'B',
          audioUrl: 'https://example.com/mock-audio-b.mp3',
          duration: 175,
        },
      ],
    }
  }
}

export const sunoProvider = new SunoProvider()
