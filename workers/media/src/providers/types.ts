// Music Provider 接口定义

export interface GenerateRequest {
  audioUrl: string
  style: string
  segment?: {
    startMs: number
    endMs: number
  }
}

export interface GenerateResult {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  variants?: {
    variant: 'A' | 'B'
    audioUrl: string
    duration: number
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
