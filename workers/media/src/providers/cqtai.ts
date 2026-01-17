// CQTAI Suno API Provider
// 文档参考: docs/vendors/catai-suno-api-new.md

import { MusicProvider, GenerateRequest, GenerateResult } from './types'

const CQTAI_API_BASE = process.env.CQTAI_API_BASE_URL || 'https://api.cqtai.com'
const CQTAI_API_KEY = process.env.CQTAI_API_KEY || ''

interface CQTAIGenerateResponse {
  code: number
  msg: string
  data: string // taskId
}

interface CQTAITaskResponse {
  code: number
  msg: string
  data: {
    id: string
    taskType: string
    status: string // queued | processing | complete | failed
    errorMsg: string
    param: Record<string, any>
    result: Array<{
      id: string
      title: string
      status: string
      audio_url: string
      image_url?: string
      image_large_url?: string
      duration: number
      metadata: {
        duration: number
        tags: string
        prompt: string
      }
    }>
    createTime: string
    completeTime: string
  }
}

export class CQTAIProvider implements MusicProvider {
  name = 'cqtai'

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${CQTAI_API_BASE}${path}`
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${CQTAI_API_KEY}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`CQTAI API error: ${res.status} - ${text}`)
    }

    return res.json()
  }

  async submitGenerate(request: GenerateRequest): Promise<{ taskId: string }> {
    // 开发模式：如果没有 API Key，使用 mock
    if (!CQTAI_API_KEY) {
      console.log('[CQTAIProvider] No API key, using mock mode')
      return { taskId: `mock_${Date.now()}` }
    }

    const response = await this.request<CQTAIGenerateResponse>('/api/cqt/generator/suno', {
      method: 'POST',
      body: JSON.stringify({
        task: 'upload_cover',
        model: 'v50',
        audioUrl: request.audioUrl,
        customMode: false,
        makeInstrumental: false,
        prompt: request.lyrics || '根据音频生成音乐',
        tags: request.style || 'Pop',
        title: request.title || '未命名作品',
        vocalGender: request.voiceType || 'f',
        styleWeight: 0.65,
        weirdnessConstraint: 0.65,
        audioWeight: 0.65,
      }),
    })

    if (response.code !== 200) {
      throw new Error(`CQTAI API error: ${response.msg}`)
    }

    return { taskId: response.data }
  }

  async queryTask(taskId: string): Promise<GenerateResult> {
    // 开发模式：mock 响应
    if (taskId.startsWith('mock_')) {
      return this.mockQueryTask(taskId)
    }

    const response = await this.request<CQTAITaskResponse>(`/api/cqt/v2/sunoinfo?id=${taskId}`)

    if (response.code !== 200) {
      throw new Error(`CQTAI API error: ${response.msg}`)
    }

    const { data } = response

    // 状态映射
    let status: GenerateResult['status']
    if (data.status === 'complete' || data.status === 'succeeded') {
      status = 'completed'
    } else if (data.status === 'failed') {
      status = 'failed'
    } else if (data.status === 'processing') {
      status = 'processing'
    } else {
      status = 'pending'
    }

    const result: GenerateResult = {
      taskId: data.id,
      status,
    }

    // 解析变体
    if ((data.status === 'complete' || data.status === 'succeeded') && data.result && data.result.length > 0) {
      result.variants = data.result.slice(0, 2).map((item, index) => ({
        variant: index === 0 ? 'A' : 'B',
        audioUrl: item.audio_url,
        imageUrl: item.image_url || '',
        imageLargeUrl: item.image_large_url || '',
        duration: item.metadata?.duration || item.duration || 0,
      }))
    }

    if (data.errorMsg) {
      result.error = data.errorMsg
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
          imageUrl: 'https://example.com/mock-image-a.jpg',
          imageLargeUrl: 'https://example.com/mock-image-large-a.jpg',
          duration: 180,
        },
        {
          variant: 'B',
          audioUrl: 'https://example.com/mock-audio-b.mp3',
          imageUrl: 'https://example.com/mock-image-b.jpg',
          imageLargeUrl: 'https://example.com/mock-image-large-b.jpg',
          duration: 175,
        },
      ],
    }
  }
}

export const cqtaiProvider = new CQTAIProvider()
