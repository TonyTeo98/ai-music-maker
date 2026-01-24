// 结构化日志 - 基于 pino
// 支持 JSON 格式输出，便于日志聚合和分析

import * as pino from 'pino'
import type { Logger, LoggerOptions } from 'pino'

const isDev = process.env.NODE_ENV === 'development'

const defaultOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
}

// 开发环境使用 pino-pretty 美化输出
const devTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  },
}

/**
 * 创建命名 logger 实例
 * @param name - 模块名称，如 'Worker', 'API', 'GenerateHandler'
 */
export function createLogger(name: string): Logger {
  const options: LoggerOptions = {
    ...defaultOptions,
    name,
    ...(isDev ? { transport: devTransport } : {}),
  }
  return pino.pino(options)
}

// 默认 logger 实例
export const logger = createLogger('app')

// 预定义模块 logger
export const workerLogger = createLogger('Worker')
export const apiLogger = createLogger('API')
