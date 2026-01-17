#!/usr/bin/env tsx
/**
 * 前端流程完整测试
 * 模拟用户在浏览器中的完整操作流程
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// 加载环境变量
const envLocalPath = path.resolve(__dirname, '../.env.local')
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
} else {
  dotenv.config({ path: envPath })
}

const API_URL = process.env.API_URL || 'http://localhost:3001'
const TEST_DEVICE_ID = `test_device_${Date.now()}`

// 创建一个简单的测试音频文件（WAV 格式）
function createTestAudioFile(): Buffer {
  // 最小的 WAV 文件头 + 6 秒静音数据（CQTAI 要求至少 6 秒）
  const sampleRate = 44100
  const numChannels = 1
  const bitsPerSample = 16
  const duration = 6 // 6 秒（CQTAI 最小要求）
  const numSamples = sampleRate * duration
  const dataSize = numSamples * numChannels * (bitsPerSample / 8)
  const fileSize = 44 + dataSize

  const buffer = Buffer.alloc(fileSize)
  let offset = 0

  // RIFF header
  buffer.write('RIFF', offset); offset += 4
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4
  buffer.write('WAVE', offset); offset += 4

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4
  buffer.writeUInt32LE(16, offset); offset += 4 // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2 // audio format (PCM)
  buffer.writeUInt16LE(numChannels, offset); offset += 2
  buffer.writeUInt32LE(sampleRate, offset); offset += 4
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), offset); offset += 4 // byte rate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), offset); offset += 2 // block align
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2

  // data chunk
  buffer.write('data', offset); offset += 4
  buffer.writeUInt32LE(dataSize, offset); offset += 4

  // 填充静音数据（全部为 0）
  buffer.fill(0, offset)

  return buffer
}

async function request<T = any>(
  path: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const url = `${API_URL}${path}`
    console.log(`📡 ${options?.method || 'GET'} ${url}`)

    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    console.log(`✅ HTTP ${res.status}`)

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, status: res.status, error: text }
    }

    const data = await res.json()
    return { ok: true, status: res.status, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Request failed:`, message)
    return { ok: false, status: 0, error: message }
  }
}

async function uploadToR2(uploadUrl: string, file: Buffer, contentType: string): Promise<boolean> {
  try {
    console.log(`📤 上传文件到 R2 (${file.length} bytes)`)

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
    })

    if (!res.ok) {
      console.error(`❌ 上传失败: HTTP ${res.status}`)
      return false
    }

    console.log(`✅ 上传成功`)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ 上传失败:`, message)
    return false
  }
}

async function sleep(ms: number) {
  console.log(`⏳ 等待 ${ms / 1000}s...`)
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('🎨 前端流程完整测试')
  console.log('=' .repeat(60))
  console.log(`API URL: ${API_URL}`)
  console.log(`Device ID: ${TEST_DEVICE_ID}`)
  console.log('=' .repeat(60))

  // Step 1: 健康检查
  console.log('\n📋 Step 1: 健康检查')
  const healthRes = await request('/health')
  if (!healthRes.ok) {
    console.error('❌ API 未启动')
    process.exit(1)
  }
  console.log('✅ API 正常运行')

  // Step 2: 创建 Track
  console.log('\n📋 Step 2: 创建 Track')
  const createTrackRes = await request<{ id: string }>('/tracks', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: TEST_DEVICE_ID,
      title: '前端测试作品',
    }),
  })

  if (!createTrackRes.ok || !createTrackRes.data) {
    console.error('❌ 创建 Track 失败')
    process.exit(1)
  }

  const trackId = createTrackRes.data.id
  console.log(`✅ Track 创建成功: ${trackId}`)

  // Step 3: 获取 presigned URL
  console.log('\n📋 Step 3: 获取上传 URL')
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
    console.error('❌ 获取上传 URL 失败')
    process.exit(1)
  }

  const assetId = createAssetRes.data.assetId
  const uploadUrl = createAssetRes.data.uploadUrl
  console.log(`✅ Asset 创建成功: ${assetId}`)
  console.log(`   Upload URL: ${uploadUrl.substring(0, 80)}...`)

  // Step 4: 创建并上传测试音频文件
  console.log('\n📋 Step 4: 上传音频文件')
  const audioFile = createTestAudioFile()
  const uploadSuccess = await uploadToR2(uploadUrl, audioFile, 'audio/wav')

  if (!uploadSuccess) {
    console.error('❌ 上传失败')
    process.exit(1)
  }

  // Step 5: 确认上传完成
  console.log('\n📋 Step 5: 确认上传完成')
  const confirmRes = await request(`/assets/${assetId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({
      size: audioFile.length,
    }),
  })

  if (!confirmRes.ok) {
    console.error('❌ 确认上传失败')
    process.exit(1)
  }
  console.log('✅ Asset 已标记为 ready')

  // Step 6: 提交生成任务
  console.log('\n📋 Step 6: 提交生成任务')
  const generateRes = await request<{ trackId: string; jobId: string; status: string }>(
    `/tracks/${trackId}/generate`,
    {
      method: 'POST',
      body: JSON.stringify({
        style: 'Pop, Happy, Upbeat',
        inputAssetId: assetId,
        lyrics: '这是一首测试歌曲\n用于验证 R2 和 CQTAI 集成\n希望一切顺利',
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

  // Step 7: 轮询任务状态
  console.log('\n📋 Step 7: 轮询任务状态')
  let attempts = 0
  const maxAttempts = 60 // 最多等待 5 分钟

  while (attempts < maxAttempts) {
    await sleep(5000)
    attempts++

    const jobRes = await request<{
      id: string
      status: string
      progress: number
      currentStep?: string
      errorMsg?: string
      variants: Array<{
        id: string
        variant: string
        audioUrl?: string | null
        duration?: number | null
      }>
    }>(`/jobs/${jobId}`)

    if (!jobRes.ok || !jobRes.data) {
      console.error('❌ 获取任务状态失败')
      continue
    }

    const job = jobRes.data
    console.log(
      `📊 [${attempts}/${maxAttempts}] Status: ${job.status}, Progress: ${job.progress}%, Step: ${job.currentStep || 'N/A'}`
    )

    if (job.status === 'succeeded') {
      console.log('\n🎉 生成成功！')
      console.log(`   生成了 ${job.variants.length} 个版本`)
      job.variants.forEach((v, i) => {
        console.log(`   版本 ${v.variant}:`)
        console.log(`     - ID: ${v.id}`)
        console.log(`     - URL: ${v.audioUrl?.substring(0, 60)}...`)
        console.log(`     - 时长: ${v.duration ? `${v.duration}s` : 'N/A'}`)
      })

      // 测试公开 URL 是否可访问
      if (job.variants[0]?.audioUrl) {
        console.log('\n📋 Step 8: 测试音频 URL 可访问性')
        try {
          const audioRes = await fetch(job.variants[0].audioUrl, { method: 'HEAD' })
          if (audioRes.ok) {
            console.log(`✅ 音频 URL 可访问 (HTTP ${audioRes.status})`)
          } else {
            console.log(`⚠️  音频 URL 返回 HTTP ${audioRes.status}`)
          }
        } catch (error) {
          console.log(`❌ 音频 URL 无法访问: ${error}`)
        }
      }

      console.log('\n' + '='.repeat(60))
      console.log('🎉 前端流程测试完成！所有步骤成功')
      process.exit(0)
    }

    if (job.status === 'failed') {
      console.log(`\n❌ 任务失败: ${job.errorMsg || '未知错误'}`)
      process.exit(1)
    }
  }

  console.log('\n⏱️  超时：任务未在预期时间内完成')
  process.exit(1)
}

main().catch((error) => {
  console.error('\n💥 测试失败:', error)
  process.exit(1)
})
