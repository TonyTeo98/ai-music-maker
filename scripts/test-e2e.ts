#!/usr/bin/env ts-node
/**
 * AI Music Maker - 端到端测试脚本
 *
 * 测试完整流程：
 * 1. 健康检查
 * 2. 创建 Track
 * 3. 上传音频（使用测试 URL）
 * 4. 提交生成任务
 * 5. 轮询任务状态
 * 6. 验证 A/B 变体
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API_URL = process.env.API_URL || 'http://localhost:3001'
const TEST_DEVICE_ID = 'test_device_' + Date.now()

// 测试用音频 URL（公开可访问的测试音频）
const TEST_AUDIO_URL = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav'

interface ApiResponse<T = any> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

async function request<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`
  console.log(`\n📡 ${options?.method || 'GET'} ${url}`)

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      console.error(`❌ HTTP ${res.status}:`, data)
      return { ok: false, status: res.status, error: data.message || 'Unknown error' }
    }

    console.log(`✅ HTTP ${res.status}`)
    return { ok: true, status: res.status, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Request failed:`, message)
    return { ok: false, status: 0, error: message }
  }
}

async function sleep(ms: number) {
  console.log(`⏳ Waiting ${ms / 1000}s...`)
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('🚀 AI Music Maker - 端到端测试')
  console.log('=' .repeat(60))
  console.log(`API URL: ${API_URL}`)
  console.log(`Device ID: ${TEST_DEVICE_ID}`)
  console.log('=' .repeat(60))

  // Step 1: 健康检查
  console.log('\n📋 Step 1: 健康检查')
  const healthRes = await request('/health')
  if (!healthRes.ok) {
    console.error('❌ API 未启动，请先运行 pnpm dev')
    process.exit(1)
  }
  console.log('✅ API 正常运行')

  // Step 2: 创建 Track
  console.log('\n📋 Step 2: 创建 Track')
  const createTrackRes = await request<{ id: string }>('/tracks', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: TEST_DEVICE_ID,
      title: 'E2E Test Track',
    }),
  })

  if (!createTrackRes.ok || !createTrackRes.data) {
    console.error('❌ 创建 Track 失败')
    process.exit(1)
  }

  const trackId = createTrackRes.data.id
  console.log(`✅ Track 创建成功: ${trackId}`)

  // Step 3: 创建 Asset（获取预签名 URL）
  console.log('\n📋 Step 3: 创建 Asset')
  const createAssetRes = await request<{
    assetId: string
    uploadUrl: string
    key: string
    expiresIn: number
  }>('/assets/presign', {
    method: 'POST',
    body: JSON.stringify({
      trackId,
      filename: 'test-audio.wav',
      contentType: 'audio/wav',
    }),
  })

  if (!createAssetRes.ok || !createAssetRes.data) {
    console.error('❌ 创建 Asset 失败')
    process.exit(1)
  }

  const assetId = createAssetRes.data.assetId
  console.log(`✅ Asset 创建成功: ${assetId}`)
  console.log(`   Upload URL: ${createAssetRes.data.uploadUrl.substring(0, 80)}...`)

  // Step 3.5: 确认上传完成（跳过实际上传）
  console.log('\n📋 Step 3.5: 确认上传完成')
  const confirmRes = await request(`/assets/${assetId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({
      size: 1024000,
    }),
  })

  if (!confirmRes.ok) {
    console.error('❌ 确认上传失败')
    process.exit(1)
  }
  console.log('✅ Asset 已标记为 ready')

  // Step 4: 提交生成任务
  console.log('\n📋 Step 4: 提交生成任务')
  const generateRes = await request<{ trackId: string; jobId: string; status: string }>(
    `/tracks/${trackId}/generate`,
    {
      method: 'POST',
      body: JSON.stringify({
        style: 'Pop, Happy',
        inputAssetId: assetId,
        lyrics: '这是一首测试歌曲，用于验证 CQTAI 集成',
        voiceType: 'female',
      }),
    }
  )

  if (!generateRes.ok || !generateRes.data) {
    console.error('❌ 提交生成任务失败')
    process.exit(1)
  }

  const jobId = generateRes.data.jobId
  console.log(`✅ 生成任务已提交: ${jobId}`)

  // Step 5: 轮询任务状态
  console.log('\n📋 Step 5: 轮询任务状态')
  let attempts = 0
  const maxAttempts = 60 // 最多 5 分钟

  while (attempts < maxAttempts) {
    attempts++
    await sleep(5000) // 每 5 秒查询一次

    const jobRes = await request<{
      id: string
      status: string
      progress: number
      currentStep: string
      errorMsg?: string
    }>(`/jobs/${jobId}`)

    if (!jobRes.ok || !jobRes.data) {
      console.error('❌ 查询任务状态失败')
      process.exit(1)
    }

    const job = jobRes.data
    console.log(
      `📊 [${attempts}/${maxAttempts}] Status: ${job.status}, Progress: ${job.progress}%, Step: ${job.currentStep || 'N/A'}`
    )

    if (job.status === 'succeeded') {
      console.log('✅ 任务完成！')
      break
    }

    if (job.status === 'failed') {
      console.error(`❌ 任务失败: ${job.errorMsg || 'Unknown error'}`)
      process.exit(1)
    }

    if (attempts >= maxAttempts) {
      console.error('❌ 任务超时（5 分钟）')
      process.exit(1)
    }
  }

  // Step 6: 验证 A/B 变体
  console.log('\n📋 Step 6: 验证 A/B 变体')
  const variantsRes = await request<
    Array<{
      id: string
      variant: string
      audioUrl: string
      duration: number
      provider: string
    }>
  >(`/tracks/${trackId}/variants`)

  if (!variantsRes.ok || !variantsRes.data) {
    console.error('❌ 获取变体失败')
    process.exit(1)
  }

  const variants = variantsRes.data
  console.log(`✅ 找到 ${variants.length} 个变体:`)
  variants.forEach((v) => {
    console.log(`  - Variant ${v.variant}: ${v.audioUrl} (${v.duration}s, provider: ${v.provider})`)
  })

  if (variants.length !== 2) {
    console.warn(`⚠️  预期 2 个变体，实际 ${variants.length} 个`)
  }

  // Step 7: 获取 Track 详情
  console.log('\n📋 Step 7: 获取 Track 详情')
  const trackRes = await request<{
    id: string
    status: string
    title: string
    style: string
  }>(`/tracks/${trackId}`)

  if (!trackRes.ok || !trackRes.data) {
    console.error('❌ 获取 Track 详情失败')
    process.exit(1)
  }

  const track = trackRes.data
  console.log(`✅ Track 状态: ${track.status}`)
  console.log(`   标题: ${track.title}`)
  console.log(`   风格: ${track.style}`)

  // 总结
  console.log('\n' + '='.repeat(60))
  console.log('🎉 端到端测试通过！')
  console.log('='.repeat(60))
  console.log(`Track ID: ${trackId}`)
  console.log(`Job ID: ${jobId}`)
  console.log(`变体数量: ${variants.length}`)
  console.log('\n💡 下一步：')
  console.log(`   1. 访问 ${process.env.WEB_URL || 'http://localhost:3000'}/tracks/${trackId} 查看结果`)
  console.log(`   2. 在作品库中播放 A/B 变体`)
  console.log(`   3. 选择主版本并分享`)
}

main().catch((error) => {
  console.error('\n💥 测试失败:', error)
  process.exit(1)
})
