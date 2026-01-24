import { describe, it, expect } from 'vitest'
import {
  WORKER_STEPS,
  SCORE_NAMES,
  MUSIC_STYLES,
  PROVIDERS,
  VARIANTS,
} from '../src/constants'

describe('WORKER_STEPS', () => {
  it('应该包含所有必要的步骤', () => {
    expect(WORKER_STEPS.AUDIO_CHECK).toBe('audio_check')
    expect(WORKER_STEPS.AUDIO_ANALYZE).toBe('audio_analyze')
    expect(WORKER_STEPS.SEGMENT_PICK).toBe('segment_pick')
    expect(WORKER_STEPS.COMPOSE_PARAMS).toBe('compose_params')
    expect(WORKER_STEPS.MUSIC_GENERATE).toBe('music_generate')
    expect(WORKER_STEPS.AB_EVAL).toBe('ab_eval')
  })

  it('应该有 6 个步骤', () => {
    expect(Object.keys(WORKER_STEPS)).toHaveLength(6)
  })
})

describe('SCORE_NAMES', () => {
  it('应该包含所有必要的评分指标', () => {
    expect(SCORE_NAMES.INPUT_SIMILARITY).toBe('input_similarity')
    expect(SCORE_NAMES.AUDIO_QUALITY).toBe('audio_quality')
    expect(SCORE_NAMES.AB_DIVERSITY).toBe('ab_diversity')
    expect(SCORE_NAMES.CHOSEN_VARIANT).toBe('chosen_variant')
  })
})

describe('MUSIC_STYLES', () => {
  it('应该包含基础音乐风格', () => {
    expect(MUSIC_STYLES).toContain('pop')
    expect(MUSIC_STYLES).toContain('rock')
    expect(MUSIC_STYLES).toContain('jazz')
    expect(MUSIC_STYLES).toContain('electronic')
  })

  it('风格数量应该合理', () => {
    expect(MUSIC_STYLES.length).toBeGreaterThanOrEqual(5)
  })
})

describe('PROVIDERS', () => {
  it('应该包含支持的 Provider', () => {
    expect(PROVIDERS.SUNO).toBe('suno')
    expect(PROVIDERS.MINIMAX).toBe('minimax')
  })
})

describe('VARIANTS', () => {
  it('应该包含 A/B 变体', () => {
    expect(VARIANTS.A).toBe('A')
    expect(VARIANTS.B).toBe('B')
  })
})
