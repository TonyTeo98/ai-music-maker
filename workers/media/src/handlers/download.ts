import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '../../../../apps/api/src/storage/storage.service';
import { ConfigService } from '@nestjs/config';

const prisma = new PrismaClient();

// 创建 StorageService 实例
const configService = new ConfigService();
const storageService = new StorageService(configService);

export interface DownloadJobData {
  variantId: string;      // TrackVariant ID
  sourceUrl: string;      // Suno CDN URL
  trackId: string;        // 用于生成 key
  variant: 'A' | 'B';     // 用于生成 key
  batchIndex: number;     // 用于生成 key
  imageUrl?: string;      // Suno CDN 标准封面图 URL
  imageLargeUrl?: string; // Suno CDN 大尺寸封面图 URL
}

export async function handleDownloadJob(job: Job<DownloadJobData>) {
  const { variantId, sourceUrl, trackId, variant, batchIndex, imageUrl, imageLargeUrl } = job.data;

  console.log(`[DownloadHandler] Starting download for variant ${variantId}`);

  try {
    // 1. 更新状态为 downloading
    await prisma.trackVariant.update({
      where: { id: variantId },
      data: {
        downloadStatus: 'downloading',
        imageDownloadStatus: 'downloading',
      },
    });

    // 2. 生成 R2 keys
    const timestamp = Date.now();
    const audioKey = `tracks/${trackId}/batch${batchIndex}_${variant}_${timestamp}.mp3`;
    const imageKey = `tracks/${trackId}/batch${batchIndex}_${variant}_${timestamp}.jpg`;
    const imageLargeKey = `tracks/${trackId}/batch${batchIndex}_${variant}_${timestamp}_large.jpg`;

    // 3. 下载音频
    const { size: audioSize } = await storageService.uploadFromUrl(sourceUrl, audioKey, {
      contentType: 'audio/mpeg',
      timeout: 120000, // 2分钟超时
    });

    // 4. 下载标准封面图（如果存在）
    let imageDownloaded = false;
    if (imageUrl) {
      try {
        await storageService.uploadFromUrl(imageUrl, imageKey, {
          contentType: 'image/jpeg',
          timeout: 60000, // 1分钟超时
        });
        imageDownloaded = true;
      } catch (error) {
        console.error(`[DownloadHandler] Failed to download image: ${error}`);
        // 图片下载失败不影响音频
      }
    }

    // 5. 下载大尺寸封面图（如果存在）
    let imageLargeDownloaded = false;
    if (imageLargeUrl) {
      try {
        await storageService.uploadFromUrl(imageLargeUrl, imageLargeKey, {
          contentType: 'image/jpeg',
          timeout: 60000,
        });
        imageLargeDownloaded = true;
      } catch (error) {
        console.error(`[DownloadHandler] Failed to download large image: ${error}`);
        // 大图下载失败不影响其他文件
      }
    }

    // 6. 更新数据库
    await prisma.trackVariant.update({
      where: { id: variantId },
      data: {
        localAudioKey: audioKey,
        localImageKey: imageDownloaded ? imageKey : null,
        localImageLargeKey: imageLargeDownloaded ? imageLargeKey : null,
        downloadStatus: 'completed',
        imageDownloadStatus: (imageDownloaded || imageLargeDownloaded) ? 'completed' : 'failed',
        downloadedAt: new Date(),
        downloadError: null,
      },
    });

    console.log(`[DownloadHandler] Download completed: audio=${audioSize} bytes, image=${imageDownloaded}, imageLarge=${imageLargeDownloaded}`);
    return { success: true, audioKey, imageKey: imageDownloaded ? imageKey : null, imageLargeKey: imageLargeDownloaded ? imageLargeKey : null };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[DownloadHandler] Download failed for variant ${variantId}:`, errorMsg);

    // 更新失败状态
    await prisma.trackVariant.update({
      where: { id: variantId },
      data: {
        downloadStatus: 'failed',
        imageDownloadStatus: 'failed',
        downloadError: errorMsg,
      },
    });

    throw error; // 触发 BullMQ 重试
  }
}
