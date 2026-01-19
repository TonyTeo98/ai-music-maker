import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { langfuseService } from '../services/langfuse';

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
): Promise<{ size: number; downloadMs: number; uploadMs: number }> {
  const timeout = options?.timeout || 60000;
  const contentType = options?.contentType || 'application/octet-stream';

  // 使用 AbortController 实现超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // 下载文件
    const downloadStart = Date.now();
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    // 获取文件内容
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const downloadMs = Date.now() - downloadStart;

    // 上传到 S3
    const uploadStart = Date.now();
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    const uploadMs = Date.now() - uploadStart;

    return { size: buffer.length, downloadMs, uploadMs };
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
  const traceId = `download_${variantId}`;
  const jobStartTime = new Date();

  console.log(`[DownloadHandler] Starting download for variant ${variantId}`);

  // 创建 Langfuse trace
  langfuseService.createTrace(traceId, {
    track_id: trackId,
    job_id: `download_${variantId}`,
    audio_source: 'suno_cdn',
  });

  // 记录下载任务开始
  langfuseService.createSpan(traceId, {
    name: 'download_job_start',
    startTime: jobStartTime,
    endTime: jobStartTime,
    input: {
      variantId,
      variant,
      batchIndex,
      hasImage: !!imageUrl,
      hasImageLarge: !!imageLargeUrl,
    },
  });

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
    const audioStartTime = new Date();
    const { size: audioSize, downloadMs: audioDownloadMs, uploadMs: audioUploadMs } = await uploadFromUrl(sourceUrl, audioKey, {
      contentType: 'audio/mpeg',
      timeout: 120000, // 2分钟超时
    });

    // 记录音频下载 span
    langfuseService.createSpan(traceId, {
      name: 'audio_download',
      startTime: audioStartTime,
      endTime: new Date(),
      input: { sourceUrl: sourceUrl.substring(0, 100) + '...' },
      output: {
        size: audioSize,
        sizeKB: Math.round(audioSize / 1024),
        downloadMs: audioDownloadMs,
        uploadMs: audioUploadMs,
        key: audioKey,
      },
    });

    // 4. 下载标准封面图（如果存在）
    let imageDownloaded = false;
    let imageSize = 0;
    if (imageUrl) {
      const imageStartTime = new Date();
      try {
        const result = await uploadFromUrl(imageUrl, imageKey, {
          contentType: 'image/jpeg',
          timeout: 60000, // 1分钟超时
        });
        imageDownloaded = true;
        imageSize = result.size;

        // 记录图片下载 span
        langfuseService.createSpan(traceId, {
          name: 'image_download',
          startTime: imageStartTime,
          endTime: new Date(),
          input: { type: 'standard' },
          output: {
            size: result.size,
            sizeKB: Math.round(result.size / 1024),
            downloadMs: result.downloadMs,
            uploadMs: result.uploadMs,
            success: true,
          },
        });
      } catch (error) {
        console.error(`[DownloadHandler] Failed to download image: ${error}`);
        // 记录图片下载失败
        langfuseService.createSpan(traceId, {
          name: 'image_download',
          startTime: imageStartTime,
          endTime: new Date(),
          input: { type: 'standard' },
          output: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    // 5. 下载大尺寸封面图（如果存在）
    let imageLargeDownloaded = false;
    let imageLargeSize = 0;
    if (imageLargeUrl) {
      const imageLargeStartTime = new Date();
      try {
        const result = await uploadFromUrl(imageLargeUrl, imageLargeKey, {
          contentType: 'image/jpeg',
          timeout: 60000,
        });
        imageLargeDownloaded = true;
        imageLargeSize = result.size;

        // 记录大图下载 span
        langfuseService.createSpan(traceId, {
          name: 'image_large_download',
          startTime: imageLargeStartTime,
          endTime: new Date(),
          input: { type: 'large' },
          output: {
            size: result.size,
            sizeKB: Math.round(result.size / 1024),
            downloadMs: result.downloadMs,
            uploadMs: result.uploadMs,
            success: true,
          },
        });
      } catch (error) {
        console.error(`[DownloadHandler] Failed to download large image: ${error}`);
        // 记录大图下载失败
        langfuseService.createSpan(traceId, {
          name: 'image_large_download',
          startTime: imageLargeStartTime,
          endTime: new Date(),
          input: { type: 'large' },
          output: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
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

    const totalMs = Date.now() - jobStartTime.getTime();
    const totalSizeKB = Math.round((audioSize + imageSize + imageLargeSize) / 1024);

    // 记录下载完成 span
    langfuseService.createSpan(traceId, {
      name: 'download_job_complete',
      startTime: new Date(),
      endTime: new Date(),
      output: {
        success: true,
        totalMs,
        totalSizeKB,
        audioDownloaded: true,
        imageDownloaded,
        imageLargeDownloaded,
      },
    });

    // 上报 scores
    langfuseService.createScores(traceId, [
      { name: 'download_duration_ms', value: totalMs, comment: 'Total download job duration' },
      { name: 'download_size_kb', value: totalSizeKB, comment: 'Total downloaded size in KB' },
      { name: 'audio_download_success', value: 1, comment: 'Audio download success' },
      { name: 'image_download_success', value: imageDownloaded ? 1 : 0, comment: 'Image download success' },
    ]);

    await langfuseService.flush();

    console.log(`[DownloadHandler] Download completed: audio=${audioSize} bytes, image=${imageDownloaded}, imageLarge=${imageLargeDownloaded}, totalMs=${totalMs}`);
    return { success: true, audioKey, imageKey: imageDownloaded ? imageKey : null, imageLargeKey: imageLargeDownloaded ? imageLargeKey : null };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[DownloadHandler] Download failed for variant ${variantId}:`, errorMsg);

    // 记录失败 span
    langfuseService.createSpan(traceId, {
      name: 'download_job_failed',
      startTime: new Date(),
      endTime: new Date(),
      output: {
        success: false,
        error: errorMsg,
        totalMs: Date.now() - jobStartTime.getTime(),
      },
    });

    // 上报失败 score
    langfuseService.createScores(traceId, [
      { name: 'download_success', value: 0, comment: `Download failed: ${errorMsg}` },
    ]);

    await langfuseService.flush();

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
