// AI Music Maker - Media Worker
// 处理音乐生成相关的异步任务

import * as dotenv from 'dotenv'
import * as path from 'path'

// 加载根目录 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { Worker, Queue } from 'bullmq'
import { handleGenerateJob, GenerateJobData } from './handlers/generate'
import { handleDownloadJob, DownloadJobData } from './handlers/download'
import { handleCleanupJob } from './handlers/cleanup'
import { startHealthServer, setRedisConnected, recordJobProcessed } from './health'
import { createLogger, getRedisConnection } from '@aimm/shared'

const logger = createLogger('Worker')

const QUEUE_NAME = 'media-jobs'
const HEALTH_PORT = parseInt(process.env.WORKER_HEALTH_PORT || '3002', 10)

// 使用共享 Redis 连接
const connection = getRedisConnection()

// 监听 Redis 连接状态
connection.on('connect', () => {
  setRedisConnected(true)
})

connection.on('error', () => {
  setRedisConnected(false)
  setRedisConnected(false)
})

connection.on('close', () => {
  setRedisConnected(false)
})

// 创建队列（供 API 使用）
export const mediaQueue = new Queue(QUEUE_NAME, { connection })

// Worker 处理器
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    logger.info({ jobId: job.id, type: job.name }, 'Processing job')
    logger.debug({ jobId: job.id, data: job.data }, 'Job data')

    switch (job.name) {
      case 'generate':
        return await handleGenerateJob(job as any)
      case 'download':
        return await handleDownloadJob(job as any)
      case 'cleanup':
        return await handleCleanupJob()
      default:
        logger.warn({ type: job.name }, 'Unknown job type')
        return { success: false, error: 'Unknown job type' }
    }
  },
  {
    connection,
    concurrency: 2,
  }
)

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed')
  recordJobProcessed()
})

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Job failed')
})

logger.info({ queue: QUEUE_NAME }, 'Media worker started')

// 启动健康检查 HTTP 端点
startHealthServer(HEALTH_PORT)

// 配置定时清理任务（每天凌晨 2 点）
;(async () => {
  try {
    await mediaQueue.add(
      'cleanup',
      {},
      {
        repeat: {
          pattern: '0 2 * * *', // Cron 表达式：每天凌晨 2 点
        },
        jobId: 'daily-cleanup', // 固定 ID，避免重复添加
      }
    )
    logger.info({ schedule: '0 2 * * *' }, 'Cleanup task scheduled')
  } catch (error) {
    logger.error({ err: error }, 'Failed to schedule cleanup task')
  }
})()

