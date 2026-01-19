// Langfuse 可观测服务封装

import { Langfuse } from 'langfuse'

const AGENT_VERSION = '0.6.0'

interface TraceMetadata {
  product: string
  environment: string
  platform: string
  device: string
  agent_version: string
  app_version: string
  user_id_hash?: string
  audio_source?: string
  track_id?: string
  job_id?: string
  // Generate job 额外字段
  style?: string
  hasSegment?: boolean
  hasLyrics?: boolean
  voiceType?: string
}

interface SpanData {
  name: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  startTime: Date
  endTime?: Date
  metadata?: Record<string, unknown>
}

interface ScoreData {
  name: string
  value: number
  comment?: string
}

class LangfuseService {
  private client: Langfuse | null = null
  private enabled: boolean = false

  constructor() {
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY
    const secretKey = process.env.LANGFUSE_SECRET_KEY
    const host = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com'

    if (publicKey && secretKey) {
      this.client = new Langfuse({
        publicKey,
        secretKey,
        baseUrl: host,
      })
      this.enabled = true
      console.log('[Langfuse] Initialized successfully')
    } else {
      console.log('[Langfuse] Not configured, running in disabled mode')
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  createTrace(traceId: string, metadata: Partial<TraceMetadata> = {}) {
    if (!this.client) return null

    const fullMetadata: TraceMetadata = {
      product: 'ai_music_maker',
      environment: process.env.NODE_ENV || 'dev',
      platform: 'web',
      device: 'desktop',
      agent_version: AGENT_VERSION,
      app_version: '0.6.0',
      ...metadata,
    }

    const trace = this.client.trace({
      id: traceId,
      name: 'music_generate',
      metadata: fullMetadata,
    })

    console.log(`[Langfuse] Created trace: ${traceId}`)
    return trace
  }

  createSpan(
    traceId: string,
    spanData: SpanData
  ) {
    if (!this.client) return null

    const span = this.client.span({
      traceId,
      name: spanData.name,
      input: spanData.input,
      output: spanData.output,
      startTime: spanData.startTime,
      endTime: spanData.endTime,
      metadata: spanData.metadata,
    })

    console.log(`[Langfuse] Created span: ${spanData.name} for trace ${traceId}`)
    return span
  }

  updateSpan(
    traceId: string,
    spanId: string,
    data: { output?: Record<string, unknown>; endTime?: Date }
  ) {
    if (!this.client) return

    // Langfuse SDK 的 span 更新通过重新创建实现
    // 实际使用中应该保存 span 引用并调用 end()
    console.log(`[Langfuse] Updated span: ${spanId}`)
  }

  createScore(traceId: string, scoreData: ScoreData) {
    if (!this.client) return null

    const score = this.client.score({
      traceId,
      name: scoreData.name,
      value: scoreData.value,
      comment: scoreData.comment,
    })

    console.log(`[Langfuse] Created score: ${scoreData.name}=${scoreData.value} for trace ${traceId}`)
    return score
  }

  createScores(traceId: string, scores: ScoreData[]) {
    if (!this.client) return

    for (const score of scores) {
      this.createScore(traceId, score)
    }
  }

  async flush() {
    if (!this.client) return

    try {
      await this.client.flushAsync()
      console.log('[Langfuse] Flushed successfully')
    } catch (error) {
      console.error('[Langfuse] Flush error:', error)
    }
  }

  async shutdown() {
    if (!this.client) return

    try {
      await this.client.shutdownAsync()
      console.log('[Langfuse] Shutdown successfully')
    } catch (error) {
      console.error('[Langfuse] Shutdown error:', error)
    }
  }
}

// 单例导出
export const langfuseService = new LangfuseService()
