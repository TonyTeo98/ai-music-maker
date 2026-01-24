import { describe, it, expect } from 'vitest'
import { ERROR_CODES, ERROR_MESSAGES, type ErrorCode } from '../src/errors'

describe('ERROR_CODES', () => {
  it('应该包含通用错误码', () => {
    expect(ERROR_CODES.UNKNOWN).toBe('UNKNOWN')
    expect(ERROR_CODES.INVALID_PARAMS).toBe('INVALID_PARAMS')
  })

  it('应该包含资产相关错误码', () => {
    expect(ERROR_CODES.ASSET_NOT_FOUND).toBe('ASSET_NOT_FOUND')
    expect(ERROR_CODES.ASSET_UPLOAD_FAILED).toBe('ASSET_UPLOAD_FAILED')
    expect(ERROR_CODES.ASSET_INVALID_TYPE).toBe('ASSET_INVALID_TYPE')
  })

  it('应该包含 Track 相关错误码', () => {
    expect(ERROR_CODES.TRACK_NOT_FOUND).toBe('TRACK_NOT_FOUND')
    expect(ERROR_CODES.TRACK_ALREADY_GENERATING).toBe('TRACK_ALREADY_GENERATING')
    expect(ERROR_CODES.TRACK_NO_INPUT).toBe('TRACK_NO_INPUT')
  })

  it('应该包含生成相关错误码', () => {
    expect(ERROR_CODES.GEN_PROVIDER_ERROR).toBe('GEN_PROVIDER_ERROR')
    expect(ERROR_CODES.GEN_PROVIDER_TIMEOUT).toBe('GEN_PROVIDER_TIMEOUT')
  })

  it('应该包含分享相关错误码', () => {
    expect(ERROR_CODES.SHARE_NOT_FOUND).toBe('SHARE_NOT_FOUND')
    expect(ERROR_CODES.SHARE_EXPIRED).toBe('SHARE_EXPIRED')
  })
})

describe('ERROR_MESSAGES', () => {
  it('每个错误码都应该有对应的中文消息', () => {
    const codes = Object.values(ERROR_CODES) as ErrorCode[]

    for (const code of codes) {
      expect(ERROR_MESSAGES[code]).toBeDefined()
      expect(typeof ERROR_MESSAGES[code]).toBe('string')
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0)
    }
  })

  it('消息应该是中文', () => {
    // 简单检查是否包含中文字符
    const chineseRegex = /[\u4e00-\u9fa5]/
    const messages = Object.values(ERROR_MESSAGES)

    for (const msg of messages) {
      expect(chineseRegex.test(msg)).toBe(true)
    }
  })
})
