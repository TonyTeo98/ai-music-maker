// AI Music Maker - Media Worker
// 处理音乐生成相关的异步任务

import { Worker, Queue } from 'bullmq'
import IORedis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const QUEUE_NAME = 'media-jobs'

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
})

// 创建队列（供 API 使用）
export const mediaQueue = new Queue(QUEUE_NAME, { connection })

// Worker 处理器
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`[Worker] Processing job ${job.id}, type: ${job.name}`)
    console.log(`[Worker] Data:`, job.data)

    // TODO: 根据 job.name 分发到不同处理器
    switch (job.name) {
      case 'generate':
        // await handleGenerateJob(job)
        console.log('[Worker] Generate job - not implemented yet')
        break
      default:
        console.log(`[Worker] Unknown job type: ${job.name}`)
    }

    return { success: true }
  },
  {
    connection,
    concurrency: 2, // 同时处理 2 个任务
  }
)

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message)
})

console.log(`[Worker] Media worker started, queue: ${QUEUE_NAME}`)
console.log(`[Worker] Redis: ${REDIS_URL}`)
