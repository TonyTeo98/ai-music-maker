// Langfuse 可观测服务 (NestJS)

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Langfuse } from 'langfuse';

interface ScoreData {
  name: string;
  value: number | string | boolean;
  type?: 'numeric' | 'boolean' | 'categorical';
  comment?: string;
}

@Injectable()
export class LangfuseService implements OnModuleDestroy {
  private client: Langfuse | null = null;
  private enabled: boolean = false;

  constructor() {
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    const host = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';

    if (publicKey && secretKey) {
      this.client = new Langfuse({
        publicKey,
        secretKey,
        baseUrl: host,
      });
      this.enabled = true;
      console.log('[Langfuse] API service initialized');
    } else {
      console.log('[Langfuse] Not configured, running in disabled mode');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  createScore(traceId: string, scoreData: ScoreData) {
    if (!this.client) return null;

    const score = this.client.score({
      traceId,
      name: scoreData.name,
      value: scoreData.value as number,
      comment: scoreData.comment,
    });

    console.log(
      `[Langfuse] Created score: ${scoreData.name}=${scoreData.value} for trace ${traceId}`,
    );
    return score;
  }

  // 上报用户选择的主版本
  reportChosenVariant(jobId: string, variant: 'A' | 'B', comment?: string) {
    if (!this.client) return;

    // 使用 jobId 作为 traceId（与 Worker 保持一致）
    this.createScore(jobId, {
      name: 'chosen_variant',
      value: variant,
      type: 'categorical',
      comment: comment || `User chose variant ${variant}`,
    });

    // 异步 flush
    this.flush();
  }

  async flush() {
    if (!this.client) return;

    try {
      await this.client.flushAsync();
    } catch (error) {
      console.error('[Langfuse] Flush error:', error);
    }
  }

  async onModuleDestroy() {
    if (!this.client) return;

    try {
      await this.client.shutdownAsync();
      console.log('[Langfuse] Shutdown successfully');
    } catch (error) {
      console.error('[Langfuse] Shutdown error:', error);
    }
  }
}
