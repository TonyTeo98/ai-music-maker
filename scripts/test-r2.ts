#!/usr/bin/env tsx
/**
 * R2 配置测试脚本
 * 验证 Cloudflare R2 配置是否正确
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

// 尝试加载 .env.local，如果不存在则加载 .env
const envLocalPath = path.resolve(__dirname, '../.env.local')
const envPath = path.resolve(__dirname, '../.env')
const fs = require('fs')

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
} else {
  dotenv.config({ path: envPath })
}

const S3_ENDPOINT = process.env.S3_ENDPOINT
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY
const S3_SECRET_KEY = process.env.S3_SECRET_KEY
const S3_BUCKET = process.env.S3_BUCKET || 'aimm-assets'
const S3_REGION = process.env.S3_REGION || 'auto'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  duration?: number
}

const results: TestResult[] = []

function logTest(result: TestResult) {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
  const duration = result.duration ? ` (${result.duration}ms)` : ''
  console.log(`${icon} ${result.name}${duration}`)
  console.log(`   ${result.message}`)
  results.push(result)
}

async function testConfiguration() {
  console.log('🔧 配置检查')
  console.log('='.repeat(60))

  const start = Date.now()

  if (!S3_ENDPOINT) {
    logTest({
      name: '环境变量检查',
      status: 'fail',
      message: '缺少 S3_ENDPOINT 环境变量',
      duration: Date.now() - start,
    })
    return false
  }

  if (!S3_ACCESS_KEY || !S3_SECRET_KEY) {
    logTest({
      name: '环境变量检查',
      status: 'fail',
      message: '缺少 S3_ACCESS_KEY 或 S3_SECRET_KEY',
      duration: Date.now() - start,
    })
    return false
  }

  logTest({
    name: '环境变量检查',
    status: 'pass',
    message: `Endpoint: ${S3_ENDPOINT}, Bucket: ${S3_BUCKET}`,
    duration: Date.now() - start,
  })

  if (R2_PUBLIC_URL) {
    logTest({
      name: 'R2 公开 URL',
      status: 'pass',
      message: `已配置: ${R2_PUBLIC_URL}`,
    })
  } else {
    logTest({
      name: 'R2 公开 URL',
      status: 'skip',
      message: '未配置（开发环境使用签名 URL）',
    })
  }

  return true
}

async function testConnection() {
  console.log('\n🔌 连接测试')
  console.log('='.repeat(60))

  const start = Date.now()

  try {
    const client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY!,
        secretAccessKey: S3_SECRET_KEY!,
      },
      forcePathStyle: S3_ENDPOINT?.includes('localhost') || S3_ENDPOINT?.includes('127.0.0.1'),
    })

    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      MaxKeys: 1,
    })

    await client.send(command)

    logTest({
      name: 'S3 连接',
      status: 'pass',
      message: `成功连接到 ${S3_ENDPOINT}`,
      duration: Date.now() - start,
    })

    return client
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logTest({
      name: 'S3 连接',
      status: 'fail',
      message: `连接失败: ${message}`,
      duration: Date.now() - start,
    })
    return null
  }
}

async function testUpload(client: S3Client) {
  console.log('\n📤 上传测试')
  console.log('='.repeat(60))

  const start = Date.now()
  const testKey = `test/${Date.now()}.txt`
  const testContent = 'Hello from R2 test script!'

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    })

    await client.send(command)

    logTest({
      name: '文件上传',
      status: 'pass',
      message: `成功上传: ${testKey}`,
      duration: Date.now() - start,
    })

    return testKey
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logTest({
      name: '文件上传',
      status: 'fail',
      message: `上传失败: ${message}`,
      duration: Date.now() - start,
    })
    return null
  }
}

async function testDownload(client: S3Client, key: string) {
  console.log('\n📥 下载测试')
  console.log('='.repeat(60))

  const start = Date.now()

  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })

    const response = await client.send(command)
    const content = await response.Body?.transformToString()

    if (content === 'Hello from R2 test script!') {
      logTest({
        name: '文件下载',
        status: 'pass',
        message: `成功下载并验证内容`,
        duration: Date.now() - start,
      })
      return true
    } else {
      logTest({
        name: '文件下载',
        status: 'fail',
        message: `内容不匹配: ${content}`,
        duration: Date.now() - start,
      })
      return false
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logTest({
      name: '文件下载',
      status: 'fail',
      message: `下载失败: ${message}`,
      duration: Date.now() - start,
    })
    return false
  }
}

async function testPublicAccess(key: string) {
  console.log('\n🌐 公开访问测试')
  console.log('='.repeat(60))

  if (!R2_PUBLIC_URL) {
    logTest({
      name: '公开 URL 访问',
      status: 'skip',
      message: '未配置 R2_PUBLIC_URL（开发环境）',
    })
    return
  }

  const start = Date.now()
  const publicUrl = `${R2_PUBLIC_URL}/${key}`

  try {
    const response = await fetch(publicUrl)

    if (response.ok) {
      const content = await response.text()
      if (content === 'Hello from R2 test script!') {
        logTest({
          name: '公开 URL 访问',
          status: 'pass',
          message: `成功访问: ${publicUrl}`,
          duration: Date.now() - start,
        })
      } else {
        logTest({
          name: '公开 URL 访问',
          status: 'fail',
          message: `内容不匹配: ${content}`,
          duration: Date.now() - start,
        })
      }
    } else {
      logTest({
        name: '公开 URL 访问',
        status: 'fail',
        message: `HTTP ${response.status}: ${response.statusText}`,
        duration: Date.now() - start,
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logTest({
      name: '公开 URL 访问',
      status: 'fail',
      message: `请求失败: ${message}`,
      duration: Date.now() - start,
    })
  }
}

async function main() {
  console.log('🧪 R2 配置测试')
  console.log('='.repeat(60))
  console.log()

  // 1. 配置检查
  const configOk = await testConfiguration()
  if (!configOk) {
    console.log('\n❌ 配置检查失败，请检查环境变量')
    process.exit(1)
  }

  // 2. 连接测试
  const client = await testConnection()
  if (!client) {
    console.log('\n❌ 连接测试失败，请检查 S3_ENDPOINT 和凭证')
    process.exit(1)
  }

  // 3. 上传测试
  const testKey = await testUpload(client)
  if (!testKey) {
    console.log('\n❌ 上传测试失败')
    process.exit(1)
  }

  // 4. 下载测试
  const downloadOk = await testDownload(client, testKey)
  if (!downloadOk) {
    console.log('\n❌ 下载测试失败')
    process.exit(1)
  }

  // 5. 公开访问测试
  await testPublicAccess(testKey)

  // 汇总
  console.log('\n' + '='.repeat(60))
  console.log('📊 测试汇总')
  console.log('='.repeat(60))

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const skipped = results.filter((r) => r.status === 'skip').length

  console.log(`✅ 通过: ${passed}`)
  console.log(`❌ 失败: ${failed}`)
  console.log(`⏭️  跳过: ${skipped}`)

  if (failed > 0) {
    console.log('\n❌ 部分测试失败，请检查配置')
    process.exit(1)
  } else {
    console.log('\n🎉 所有测试通过！R2 配置正确')
  }
}

main().catch((error) => {
  console.error('\n💥 测试失败:', error)
  process.exit(1)
})
