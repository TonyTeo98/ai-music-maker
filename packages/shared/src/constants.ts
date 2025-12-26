// ===== Worker 步骤名称 =====
export const WORKER_STEPS = {
  AUDIO_CHECK: 'audio_check',
  AUDIO_ANALYZE: 'audio_analyze',
  SEGMENT_PICK: 'segment_pick',
  COMPOSE_PARAMS: 'compose_params',
  MUSIC_GENERATE: 'music_generate',
  AB_EVAL: 'ab_eval',
} as const

export type WorkerStep = (typeof WORKER_STEPS)[keyof typeof WORKER_STEPS]

// ===== Langfuse Score 名称 =====
export const SCORE_NAMES = {
  INPUT_SIMILARITY: 'input_similarity',
  AUDIO_QUALITY: 'audio_quality',
  AB_DIVERSITY: 'ab_diversity',
  CHOSEN_VARIANT: 'chosen_variant',
} as const

export type ScoreName = (typeof SCORE_NAMES)[keyof typeof SCORE_NAMES]

// ===== 音乐风格（示例） =====
export const MUSIC_STYLES = [
  'pop',
  'rock',
  'jazz',
  'classical',
  'electronic',
  'hip-hop',
  'r&b',
  'country',
  'folk',
  'indie',
] as const

export type MusicStyle = (typeof MUSIC_STYLES)[number]

// ===== Provider =====
export const PROVIDERS = {
  SUNO: 'suno',
  MINIMAX: 'minimax',
} as const

export type Provider = (typeof PROVIDERS)[keyof typeof PROVIDERS]

// ===== 变体标识 =====
export const VARIANTS = {
  A: 'A',
  B: 'B',
} as const

export type Variant = (typeof VARIANTS)[keyof typeof VARIANTS]
