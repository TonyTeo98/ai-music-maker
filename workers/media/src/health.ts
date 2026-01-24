// Worker 健康检查 HTTP 端点
// 用于 Docker healthcheck 和监控

import http from 'http'
import { createLogger } from '@aimm/shared'

const logger = createLogger('HealthServer')

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  uptime: number
  redis: 'connected' | 'disconnected'
  timestamp: string
}

let redisConnected = false
let lastJobProcessedAt: Date | null = null

export function setRedisConnected(connected: boolean) {
  redisConnected = connected
}

export function recordJobProcessed() {
  lastJobProcessedAt = new Date()
}

const startTime = Date.now()

function getHealthStatus(): HealthStatus {
  return {
    status: redisConnected ? 'healthy' : 'unhealthy',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    redis: redisConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  }
}

export function startHealthServer(port: number = 3002) {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/healthz') {
      const status = getHealthStatus()
      const statusCode = status.status === 'healthy' ? 200 : 503

      res.writeHead(statusCode, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(status))
    } else if (req.url === '/ready' || req.url === '/readyz') {
      // Readiness: 只有 Redis 连接正常才算 ready
      const ready = redisConnected
      res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ready }))
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  })

  server.listen(port, () => {
    logger.info({ port }, 'Health check endpoint listening')
  })

  return server
}
