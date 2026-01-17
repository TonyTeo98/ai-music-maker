import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

// 创建 S3 客户端（兼容 Cloudflare R2）
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const S3_BUCKET = process.env.S3_BUCKET!;

/**
 * 从 URL 下载文件并上传到 S3
 */
async function uploadFromUrl(
  url: string,
  key: string,
  options?: {
    contentType?: string;
    timeout?: number;
  }
): Promise<{ size: number }> {
  const timeout = options?.timeout || 60000;
  const contentType = options?.contentType || 'application/octet-stream';

  // 使用 AbortController 实现超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // 下载文件
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    // 获取文件内容
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return { size: buffer.length };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Upload from URL timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

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
    const { size: audioSize } = await uploadFromUrl(sourceUrl, audioKey, {
      contentType: 'audio/mpeg',
      timeout: 120000, // 2分钟超时
    });

    // 4. 下载标准封面图（如果存在）
    let imageDownloaded = false;
    if (imageUrl) {
      try {
        await uploadFromUrl(imageUrl, imageKey, {
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
        await uploadFromUrl(imageLargeUrl, imageLargeKey, {
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
