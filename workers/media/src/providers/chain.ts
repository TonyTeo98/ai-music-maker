// Provider 降级链
// 支持多 Provider 自动降级

import { MusicProvider, GenerateRequest, GenerateResult } from './types'
import { cqtaiProvider } from './cqtai'
import { sunoProvider } from './suno'
import { createLogger } from '@aimm/shared'

const logger = createLogger('ProviderChain')

interface ProviderChainConfig {
  providers: MusicProvider[]
  maxRetries: number
  retryDelay: number // ms
}

export class ProviderChain {
  private providers: MusicProvider[]
  private maxRetries: number
  private retryDelay: number

  constructor(config: ProviderChainConfig) {
    this.providers = config.providers
    this.maxRetries = config.maxRetries
    this.retryDelay = config.retryDelay
  }

  async submitGenerate(request: GenerateRequest): Promise<{
    taskId: string
    provider: string
  }> {
    let lastError: Error | null = null

    for (const provider of this.providers) {
      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          logger.info({ provider: provider.name, attempt: attempt + 1, maxRetries: this.maxRetries }, 'Trying provider')
          const result = await provider.submitGenerate(request)
          logger.info({ provider: provider.name, taskId: result.taskId }, 'Provider succeeded')
          return {
            taskId: result.taskId,
            provider: provider.name,
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          logger.error({ provider: provider.name, attempt: attempt + 1, err: lastError.message }, 'Provider failed')

          // 如果不是最后一次重试，等待后重试
          if (attempt < this.maxRetries - 1) {
            await this.sleep(this.retryDelay * (attempt + 1)) // 指数退避
          }
        }
      }
      // Provider 所有重试都失败，尝试下一个 Provider
      logger.warn({ provider: provider.name }, 'Provider exhausted, trying next')
    }

    // 所有 Provider 都失败
    throw new Error(`All providers failed. Last error: ${lastError?.message || 'Unknown error'}`)
  }

  async queryTask(taskId: string, providerName: string): Promise<GenerateResult> {
    const provider = this.providers.find(p => p.name === providerName)
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`)
    }
    return provider.queryTask(taskId)
  }

  getProvider(name: string): MusicProvider | undefined {
    return this.providers.find(p => p.name === name)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 默认 Provider 链配置
// 优先使用 CQTAI，失败时降级到 Suno
export const defaultProviderChain = new ProviderChain({
  providers: [cqtaiProvider, sunoProvider],
  maxRetries: 2,
  retryDelay: 2000,
})

// 判断是否启用降级（可通过环境变量控制）
export function getActiveProvider(): MusicProvider | ProviderChain {
  const enableFallback = process.env.PROVIDER_FALLBACK_ENABLED === 'true'

  if (enableFallback) {
    logger.info('Using ProviderChain with fallback enabled')
    return defaultProviderChain
  }

  // 默认只使用 CQTAI
  logger.info('Using single provider: cqtai')
  return cqtaiProvider
}
