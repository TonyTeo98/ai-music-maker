import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { TracksModule } from './tracks/tracks.module';
import { JobsModule } from './jobs/jobs.module';
import { SharesModule } from './shares/shares.module';
import { LangfuseModule } from './langfuse/langfuse.module';
import { LyricsModule } from './lyrics/lyrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env.local', '../../.env', '.env.local', '.env'],
    }),
    PrismaModule,
    QueueModule,
    StorageModule,
    TracksModule,
    JobsModule,
    SharesModule,
    LangfuseModule,
    LyricsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
