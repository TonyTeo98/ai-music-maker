#!/usr/bin/env ts-node
/**
 * CQTAI Provider 快速测试
 *
 * 测试 Provider 的 mock 模式（无需真实 API Key）
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

// 临时清除 API Key 以测试 mock 模式
delete process.env.CQTAI_API_KEY

import { cqtaiProvider } from '../workers/media/src/providers/cqtai'

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('🧪 CQTAI Provider Mock 模式测试')
  console.log('=' .repeat(60))

  // Test 1: Submit Generate
  console.log('\n📋 Test 1: 提交生成任务')
  const submitResult = await cqtaiProvider.submitGenerate({
    audioUrl: 'https://example.com/test.mp3',
    style: 'Pop, Happy',
    lyrics: '测试歌词',
    title: '测试歌曲',
    voiceType: 'f',
  })

  console.log(`✅ Task ID: ${submitResult.taskId}`)

  // Test 2: Query Task (pending)
  console.log('\n📋 Test 2: 查询任务状态（pending）')
  await sleep(1000)
  const result1 = await cqtaiProvider.queryTask(submitResult.taskId)
  console.log(`✅ Status: ${result1.status}`)

  // Test 3: Query Task (processing)
  console.log('\n📋 Test 3: 查询任务状态（processing）')
  await sleep(3000)
  const result2 = await cqtaiProvider.queryTask(submitResult.taskId)
  console.log(`✅ Status: ${result2.status}`)

  // Test 4: Query Task (completed)
  console.log('\n📋 Test 4: 查询任务状态（completed）')
  await sleep(3000)
  const result3 = await cqtaiProvider.queryTask(submitResult.taskId)
  console.log(`✅ Status: ${result3.status}`)
  console.log(`✅ Variants: ${result3.variants?.length || 0}`)

  if (result3.variants) {
    result3.variants.forEach((v) => {
      console.log(`   - Variant ${v.variant}: ${v.audioUrl} (${v.duration}s)`)
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Mock 模式测试通过！')
  console.log('\n💡 下一步：配置真实 API Key 并运行完整测试')
  console.log('   export CQTAI_API_KEY="your_key_here"')
  console.log('   pnpm test:e2e')
}

main().catch((error) => {
  console.error('\n💥 测试失败:', error)
  process.exit(1)
})
