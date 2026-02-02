import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { TracksModule } from './tracks/tracks.module';
import { JobsModule } from './jobs/jobs.module';
import { SharesModule } from './shares/shares.module';
import { LangfuseModule } from './langfuse/langfuse.module';
import { LyricsModule } from './lyrics/lyrics.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env.local', '../../.env', '.env.local', '.env'],
    }),
    // Rate Limiting: 默认每分钟 60 请求
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,   // 1 秒
        limit: 10,   // 每秒 10 请求
      },
      {
        name: 'medium',
        ttl: 60000,  // 1 分钟
        limit: 100,  // 每分钟 100 请求
      },
      {
        name: 'long',
        ttl: 3600000, // 1 小时
        limit: 1000,  // 每小时 1000 请求
      },
    ]),
    PrismaModule,
    QueueModule,
    StorageModule,
    TracksModule,
    JobsModule,
    SharesModule,
    LangfuseModule,
    LyricsModule,
    AuthModule,
    EmailModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [
    // 全局启用限流
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
