import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const QUEUE_NAME = 'media-jobs';

export interface GenerateJobData {
  trackId: string;
  jobId: string;
  style: string;
  inputAssetKey: string;
  lyrics?: string;
  segment?: {
    startMs: number;
    endMs: number;
  };
  // Advanced settings
  excludeStyles?: string[];
  voiceType?: 'female' | 'male' | 'instrumental';
  textMode?: 'exact' | 'auto';
  tension?: number;
  styleLock?: number;
}

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queue: Queue;
  private readonly connection: IORedis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');

    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });
  }

  async addGenerateJob(data: GenerateJobData): Promise<string> {
    const job = await this.queue.add('generate', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
    return job.id || '';
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }
}
