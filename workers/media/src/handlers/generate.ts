// 音乐生成任务处理器

import { Job, Queue } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import IORedis from 'ioredis'
import { cqtaiProvider } from '../providers'
import { WORKER_STEPS } from '@aimm/shared'
import { langfuseService } from '../services/langfuse'

const prisma = new PrismaClient()

// 创建 Redis 连接和队列实例用于触发下载任务
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
})
const mediaQueue = new Queue('media-jobs', { connection })

export interface GenerateJobData {
  trackId: string
  jobId: string
  style: string
  inputAssetKey: string
  segment?: {
    startMs: number
    endMs: number
  }
  // 扩展参数
  lyrics?: string
  voiceType?: 'female' | 'male' | 'instrumental'
  excludeStyles?: string[]
  // CQTAI 高级参数
  model?: 'v40' | 'v45' | 'v45+' | 'v45-lite' | 'v50'
  styleWeight?: number  // 0-1
  weirdnessConstraint?: number  // 0-1
  audioWeight?: number  // 0-1
}

interface StepTiming {
  name: string
  startTime: Date
  endTime?: Date
  input?: Record<string, unknown>
  output?: Record<string, unknown>
}

async function updateJobProgress(
  jobId: string,
  progress: number,
  currentStep: string
) {
  await prisma.job.update({
    where: { id: jobId },
    data: { progress, currentStep },
  })
}

async function markJobFailed(jobId: string, errorCode: string, errorMsg: string) {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      errorCode,
      errorMsg,
      completedAt: new Date(),
    },
  })
}

async function markJobSucceeded(jobId: string, result: unknown) {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'succeeded',
      progress: 100,
      result: result as object,
      completedAt: new Date(),
    },
  })
}

function recordStep(
  traceId: string,
  step: StepTiming
) {
  langfuseService.createSpan(traceId, {
    name: step.name,
    input: step.input,
    output: step.output,
    startTime: step.startTime,
    endTime: step.endTime || new Date(),
  })
}

function reportMockScores(traceId: string) {
  // Mock scores for V0.6 - 后续接入真实评估模型
  const scores = [
    { name: 'input_similarity_A', value: 0.85, comment: 'Mock score for variant A' },
    { name: 'input_similarity_B', value: 0.82, comment: 'Mock score for variant B' },
    { name: 'audio_quality_A', value: 0.90, comment: 'Mock quality score for variant A' },
    { name: 'audio_quality_B', value: 0.88, comment: 'Mock quality score for variant B' },
    { name: 'ab_diversity', value: 0.75, comment: 'Mock diversity between A and B' },
  ]

  langfuseService.createScores(traceId, scores)
}

export async function handleGenerateJob(job: Job<GenerateJobData>) {
  const {
    trackId, jobId, style, inputAssetKey, segment, lyrics, voiceType, excludeStyles,
    model, styleWeight, weirdnessConstraint, audioWeight
  } = job.data
  const traceId = jobId // 使用 jobId 作为 trace_id
  const jobStartTime = new Date() // 端到端计时起点

  console.log(`[GenerateHandler] Starting job ${jobId} for track ${trackId}`)

  // 创建 Langfuse trace
  langfuseService.createTrace(traceId, {
    track_id: trackId,
    job_id: jobId,
    audio_source: 'upload',
    style,
    hasSegment: !!segment,
    hasLyrics: !!lyrics,
    voiceType: voiceType || 'default',
  })

  const stepTimings: StepTiming[] = []
  let currentStepStart = new Date()
  // 用于端到端统计
  let providerSubmitMs = 0
  let providerPollMs = 0

  try {
    // 1. 更新 Job 状态为 running
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'running', startedAt: new Date() },
    })

    // 2. 更新 Track 状态
    await prisma.track.update({
      where: { id: trackId },
      data: { status: 'generating' },
    })

    // 3. 计算新的 batchIndex（保留历史版本）
    const lastVariant = await prisma.trackVariant.findFirst({
      where: { trackId },
      orderBy: { batchIndex: 'desc' },
    })
    const newBatchIndex = (lastVariant?.batchIndex || 0) + 1
    console.log(`[GenerateHandler] New batch index: ${newBatchIndex}`)

    // Step 1: Audio Check (简化版，后续可扩展)
    currentStepStart = new Date()
    await updateJobProgress(jobId, 10, WORKER_STEPS.AUDIO_CHECK)
    console.log(`[GenerateHandler] Step: ${WORKER_STEPS.AUDIO_CHECK}`)

    stepTimings.push({
      name: WORKER_STEPS.AUDIO_CHECK,
      startTime: currentStepStart,
      endTime: new Date(),
      input: { inputAssetKey },
      output: { status: 'passed' },
    })

    // Step 2: Compose Params
    currentStepStart = new Date()
    await updateJobProgress(jobId, 20, WORKER_STEPS.COMPOSE_PARAMS)
    console.log(`[GenerateHandler] Step: ${WORKER_STEPS.COMPOSE_PARAMS}`)

    // 构建音频 URL
    const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000'
    const s3Bucket = process.env.S3_BUCKET || 'aimm-assets'
    const r2PublicUrl = process.env.R2_PUBLIC_URL

    // 如果配置了 R2_PUBLIC_URL，使用公开 URL；否则使用 S3 endpoint
    const audioUrl = r2PublicUrl
      ? `${r2PublicUrl}/${inputAssetKey}`
      : `${s3Endpoint}/${s3Bucket}/${inputAssetKey}`

    // 获取 Track 信息用于 title
    const track = await prisma.track.findUnique({ where: { id: trackId } })

    // 映射 voiceType: female/male/instrumental -> f/m
    let mappedVoiceType: 'm' | 'f' | undefined
    if (voiceType === 'female') {
      mappedVoiceType = 'f'
    } else if (voiceType === 'male') {
      mappedVoiceType = 'm'
    }
    // instrumental 不传 vocalGender

    stepTimings.push({
      name: WORKER_STEPS.COMPOSE_PARAMS,
      startTime: currentStepStart,
      endTime: new Date(),
      input: { style, segment, lyrics, voiceType },
      output: { audioUrl, mappedVoiceType },
    })

    // Step 3: Submit to Provider
    currentStepStart = new Date()
    await updateJobProgress(jobId, 30, WORKER_STEPS.MUSIC_GENERATE)
    console.log(`[GenerateHandler] Step: ${WORKER_STEPS.MUSIC_GENERATE}`)

    // 3a. 记录提交请求
    const submitStartTime = new Date()
    const { taskId } = await cqtaiProvider.submitGenerate({
      audioUrl,
      style,
      segment,
      lyrics,
      title: track?.title || undefined,
      voiceType: mappedVoiceType,
      excludeStyles,
      model,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
    })
    const submitEndTime = new Date()
    const submitDurationMs = submitEndTime.getTime() - submitStartTime.getTime()
    providerSubmitMs = submitDurationMs // 记录到端到端统计

    // 上报 Provider 提交 span
    langfuseService.createSpan(traceId, {
      name: 'provider_submit',
      startTime: submitStartTime,
      endTime: submitEndTime,
      input: {
        provider: 'cqtai',
        audioUrl: audioUrl.substring(0, 80) + '...',
        style,
        hasLyrics: !!lyrics,
        voiceType: mappedVoiceType,
      },
      output: {
        taskId,
        durationMs: submitDurationMs,
      },
    })

    console.log(`[GenerateHandler] Provider task submitted: ${taskId} (${submitDurationMs}ms)`)

    // Step 4: Poll for completion
    let attempts = 0
    const maxAttempts = 60 // 最多轮询 60 次（约 5 分钟）
    const pollStartTime = new Date()
    let lastStatus = 'unknown'
    const statusTransitions: Array<{ status: string; attemptNum: number; timestamp: Date }> = []

    let result = await cqtaiProvider.queryTask(taskId)
    statusTransitions.push({ status: result.status, attemptNum: 0, timestamp: new Date() })
    lastStatus = result.status

    while (result.status !== 'completed' && result.status !== 'failed') {
      attempts++
      if (attempts >= maxAttempts) {
        // 上报轮询超时
        langfuseService.createSpan(traceId, {
          name: 'provider_poll_timeout',
          startTime: pollStartTime,
          endTime: new Date(),
          output: {
            totalAttempts: attempts,
            lastStatus,
            durationMs: Date.now() - pollStartTime.getTime(),
            statusTransitions: statusTransitions.map(t => ({
              status: t.status,
              attemptNum: t.attemptNum,
              elapsedMs: t.timestamp.getTime() - pollStartTime.getTime(),
            })),
          },
        })
        throw new Error('GEN_PROVIDER_TIMEOUT')
      }

      // 更新进度 (30-80%)
      const progress = Math.min(30 + Math.floor((attempts / maxAttempts) * 50), 80)
      await updateJobProgress(jobId, progress, WORKER_STEPS.MUSIC_GENERATE)

      // 等待 5 秒后重试
      await new Promise((resolve) => setTimeout(resolve, 5000))
      result = await cqtaiProvider.queryTask(taskId)

      // 记录状态转换
      if (result.status !== lastStatus) {
        statusTransitions.push({ status: result.status, attemptNum: attempts, timestamp: new Date() })
        console.log(`[GenerateHandler] Poll #${attempts}: status ${lastStatus} → ${result.status}`)
        lastStatus = result.status
      }
    }

    const pollEndTime = new Date()
    const pollDurationMs = pollEndTime.getTime() - pollStartTime.getTime()
    providerPollMs = pollDurationMs // 记录到端到端统计

    // 上报轮询完成 span
    langfuseService.createSpan(traceId, {
      name: 'provider_poll',
      startTime: pollStartTime,
      endTime: pollEndTime,
      input: { taskId, maxAttempts, pollIntervalMs: 5000 },
      output: {
        finalStatus: result.status,
        totalAttempts: attempts + 1, // 包括初始查询
        durationMs: pollDurationMs,
        statusTransitions: statusTransitions.map(t => ({
          status: t.status,
          attemptNum: t.attemptNum,
          elapsedMs: t.timestamp.getTime() - pollStartTime.getTime(),
        })),
      },
    })

    console.log(`[GenerateHandler] Polling completed: ${attempts + 1} attempts, ${pollDurationMs}ms`)

    if (result.status === 'failed') {
      throw new Error(result.error || 'GEN_PROVIDER_ERROR')
    }

    stepTimings.push({
      name: WORKER_STEPS.MUSIC_GENERATE,
      startTime: currentStepStart,
      endTime: new Date(),
      input: { taskId, provider: 'cqtai' },
      output: {
        status: result.status,
        variantCount: result.variants?.length || 0,
        submitDurationMs,
        pollDurationMs,
        pollAttempts: attempts + 1,
      },
    })

    // Step 5: A/B Eval & Save Results
    currentStepStart = new Date()
    await updateJobProgress(jobId, 90, WORKER_STEPS.AB_EVAL)
    console.log(`[GenerateHandler] Step: ${WORKER_STEPS.AB_EVAL}`)

    // 保存变体到数据库
    if (result.variants) {
      for (const variant of result.variants) {
        const createdVariant = await prisma.trackVariant.create({
          data: {
            trackId,
            variant: variant.variant,
            batchIndex: newBatchIndex,
            audioUrl: variant.audioUrl,
            imageUrl: variant.imageUrl,
            imageLargeUrl: variant.imageLargeUrl,
            duration: variant.duration,
            lyrics: variant.lyrics, // 保存 AI 生成的歌词
            provider: 'cqtai',
            downloadStatus: 'pending',
            imageDownloadStatus: 'pending',
          },
        })

        // 【新增】触发下载任务（非阻塞）
        try {
          await mediaQueue.add('download', {
            variantId: createdVariant.id,
            sourceUrl: variant.audioUrl,
            trackId,
            variant: variant.variant as 'A' | 'B',
            batchIndex: newBatchIndex,
            imageUrl: variant.imageUrl, // 新增
            imageLargeUrl: variant.imageLargeUrl, // 新增
          }, {
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 10000,
            },
            removeOnComplete: 100,
            removeOnFail: 500,
          })
          console.log(`[GenerateHandler] Download job queued for variant ${createdVariant.id}`)
        } catch (error) {
          console.error(`[GenerateHandler] Failed to queue download job:`, error)
          // 不阻塞生成流程，继续执行
        }
      }
    }

    stepTimings.push({
      name: WORKER_STEPS.AB_EVAL,
      startTime: currentStepStart,
      endTime: new Date(),
      input: { variants: result.variants?.map(v => v.variant) },
      output: { saved: true },
    })

    // 更新 Track 状态为 ready
    await prisma.track.update({
      where: { id: trackId },
      data: { status: 'ready', style },
    })

    // 标记 Job 成功
    await markJobSucceeded(jobId, {
      taskId,
      variantCount: result.variants?.length || 0,
    })

    // 计算端到端耗时
    const jobEndTime = new Date()
    const totalDurationMs = jobEndTime.getTime() - jobStartTime.getTime()
    const otherStepsMs = totalDurationMs - providerSubmitMs - providerPollMs

    // 上报端到端汇总 span
    langfuseService.createSpan(traceId, {
      name: 'job_summary',
      startTime: jobStartTime,
      endTime: jobEndTime,
      output: {
        totalDurationMs,
        totalDurationSec: Math.round(totalDurationMs / 1000),
        breakdown: {
          providerSubmitMs,
          providerPollMs,
          otherStepsMs, // 包括数据库操作、参数组装等
        },
        variantCount: result.variants?.length || 0,
        status: 'succeeded',
      },
    })

    // 上报所有 step spans 到 Langfuse
    for (const step of stepTimings) {
      recordStep(traceId, step)
    }

    // 上报 mock scores
    reportMockScores(traceId)

    // 上报端到端耗时 scores
    langfuseService.createScores(traceId, [
      { name: 'job_total_duration_ms', value: totalDurationMs, comment: 'End-to-end job duration' },
      { name: 'provider_submit_ms', value: providerSubmitMs, comment: 'Provider submit request duration' },
      { name: 'provider_poll_ms', value: providerPollMs, comment: 'Provider polling duration' },
      { name: 'job_success', value: 1, comment: 'Job completed successfully' },
    ])

    // 确保数据发送到 Langfuse
    await langfuseService.flush()

    console.log(`[GenerateHandler] Job ${jobId} completed successfully (${totalDurationMs}ms total, ${providerPollMs}ms polling)`)
    return { success: true, taskId }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[GenerateHandler] Job ${jobId} failed:`, errorMsg)

    // 计算失败时的端到端耗时
    const jobEndTime = new Date()
    const totalDurationMs = jobEndTime.getTime() - jobStartTime.getTime()

    // 上报失败汇总 span
    langfuseService.createSpan(traceId, {
      name: 'job_summary',
      startTime: jobStartTime,
      endTime: jobEndTime,
      output: {
        totalDurationMs,
        totalDurationSec: Math.round(totalDurationMs / 1000),
        status: 'failed',
        error: errorMsg,
        failedAt: stepTimings[stepTimings.length - 1]?.name || 'unknown',
      },
    })

    // 上报错误 span
    langfuseService.createSpan(traceId, {
      name: 'error',
      startTime: new Date(),
      endTime: new Date(),
      input: { step: stepTimings[stepTimings.length - 1]?.name || 'unknown' },
      output: { error: errorMsg },
    })

    // 上报已完成的 steps
    for (const step of stepTimings) {
      recordStep(traceId, step)
    }

    // 上报失败 scores
    langfuseService.createScores(traceId, [
      { name: 'job_total_duration_ms', value: totalDurationMs, comment: 'Job duration before failure' },
      { name: 'job_success', value: 0, comment: `Job failed: ${errorMsg}` },
    ])

    await langfuseService.flush()

    // 标记 Job 失败
    await markJobFailed(jobId, 'GEN_PROVIDER_ERROR', errorMsg)

    // 更新 Track 状态
    await prisma.track.update({
      where: { id: trackId },
      data: { status: 'failed' },
    })

    throw error
  }
}
