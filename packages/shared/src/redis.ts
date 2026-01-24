// Redis 连接管理
// 共享单例连接，避免多实例

import IORedis from 'ioredis'
import { createLogger } from './logger'

const logger = createLogger('Redis')

declare global {
  // eslint-disable-next-line no-var
  var __redis: IORedis | undefined
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

function createRedisConnection(): IORedis {
  const redis = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000)
      logger.warn({ times, delay }, 'Redis reconnecting')
      return delay
    },
  })

  redis.on('connect', () => {
    logger.info('Redis connected')
  })

  redis.on('error', (err) => {
    logger.error({ err: err.message }, 'Redis error')
  })

  redis.on('close', () => {
    logger.warn('Redis connection closed')
  })

  return redis
}

/**
 * 获取共享 Redis 连接实例
 * 在开发环境使用 globalThis 避免热重载创建多实例
 */
export function getRedisConnection(): IORedis {
  if (!globalThis.__redis) {
    globalThis.__redis = createRedisConnection()
  }
  return globalThis.__redis
}

/**
 * 创建新的 Redis 连接（用于需要独立连接的场景）
 */
export function createNewRedisConnection(): IORedis {
  return createRedisConnection()
}

// 默认共享实例
export const redis = getRedisConnection()
