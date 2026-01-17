#!/usr/bin/env tsx
/**
 * 歌词生成功能测试
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API_URL = process.env.API_URL || 'http://localhost:3001'

async function testLyricsGeneration() {
  console.log('🎵 歌词生成功能测试')
  console.log('=' .repeat(60))

  const testCases = [
    {
      name: '友情主题',
      prompt: 'A happy song about friendship and adventure',
    },
    {
      name: '爱情主题',
      prompt: 'A romantic song about love and dreams',
    },
    {
      name: '励志主题',
      prompt: 'An inspiring song about never giving up',
    },
  ]

  for (const testCase of testCases) {
    console.log(`\n📝 测试: ${testCase.name}`)
    console.log(`   Prompt: ${testCase.prompt}`)

    try {
      const response = await fetch(`${API_URL}/lyrics/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testCase.prompt,
        }),
      })

      if (!response.ok) {
        console.error(`   ❌ HTTP ${response.status}`)
        continue
      }

      const data = await response.json()
      console.log(`   ✅ 生成成功`)
      console.log(`   歌词长度: ${data.lyrics.length} 字符`)
      console.log(`   预览:`)
      console.log('   ' + '-'.repeat(56))
      const preview = data.lyrics.split('\n').slice(0, 8).join('\n   ')
      console.log(`   ${preview}`)
      console.log('   ' + '-'.repeat(56))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`   ❌ 失败: ${message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 测试完成')
}

testLyricsGeneration().catch((error) => {
  console.error('\n💥 测试失败:', error)
  process.exit(1)
})
