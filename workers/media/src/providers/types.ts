// Music Provider 接口定义

export interface GenerateRequest {
  audioUrl: string
  style: string
  segment?: {
    startMs: number
    endMs: number
  }
  // 扩展参数
  lyrics?: string
  title?: string
  voiceType?: 'm' | 'f' | 'instrumental'
  excludeStyles?: string[]
  // CQTAI 高级参数
  model?: 'v40' | 'v45' | 'v45+' | 'v45-lite' | 'v50'
  styleWeight?: number  // 0-1，风格遵循强度
  weirdnessConstraint?: number  // 0-1，创意程度
  audioWeight?: number  // 0-1，音频要素权重
}

export interface GenerateResult {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  variants?: {
    variant: 'A' | 'B'
    audioUrl: string
    imageUrl: string
    imageLargeUrl: string
    duration: number
    lyrics: string // AI 生成的歌词
  }[]
  error?: string
}

export interface MusicProvider {
  name: string

  // 提交生成任务
  submitGenerate(request: GenerateRequest): Promise<{ taskId: string }>

  // 查询任务状态
  queryTask(taskId: string): Promise<GenerateResult>
}
