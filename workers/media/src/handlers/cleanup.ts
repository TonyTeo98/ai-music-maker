import { PrismaClient } from '@prisma/client';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';

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
 * 批量删除 S3 对象
 */
async function deleteObjects(keys: string[]): Promise<{
  deleted: string[];
  errors: Array<{ key: string; message: string }>;
}> {
  if (keys.length === 0) {
    return { deleted: [], errors: [] };
  }

  try {
    const command = new DeleteObjectsCommand({
      Bucket: S3_BUCKET,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false,
      },
    });

    const response = await s3Client.send(command);

    const deleted = (response.Deleted || []).map(obj => obj.Key!);
    const errors = (response.Errors || []).map(err => ({
      key: err.Key!,
      message: err.Message || 'Unknown error',
    }));

    return { deleted, errors };
  } catch (error) {
    console.error('[deleteObjects] Failed to delete objects:', error);
    return {
      deleted: [],
      errors: keys.map(key => ({
        key,
        message: error instanceof Error ? error.message : 'Unknown error',
      })),
    };
  }
}

export async function handleCleanupJob() {
  console.log('[CleanupHandler] Starting cleanup task');

  const now = new Date();

  // 1. 查找需要物理删除的 Track
  const tracksToDelete = await prisma.track.findMany({
    where: {
      deletedAt: { not: null },
      scheduledDeleteAt: { lte: now },
    },
    include: {
      variants: true,
      assets: true,
    },
  });

  console.log(`[CleanupHandler] Found ${tracksToDelete.length} tracks to cleanup`);

  for (const track of tracksToDelete) {
    try {
      // 2. 收集所有需要删除的 R2 keys
      const keysToDelete: string[] = [];

      // 变体音频和图片
      for (const variant of track.variants) {
        if (variant.localAudioKey) {
          keysToDelete.push(variant.localAudioKey);
        }
        if (variant.localImageKey) {
          keysToDelete.push(variant.localImageKey);
        }
        if (variant.localImageLargeKey) {
          keysToDelete.push(variant.localImageLargeKey);
        }
      }

      // 输入音频
      for (const asset of track.assets) {
        if (asset.key) {
          keysToDelete.push(asset.key);
        }
      }

      // 3. 删除 R2 文件
      if (keysToDelete.length > 0) {
        const { deleted, errors } = await deleteObjects(keysToDelete);
        console.log(`[CleanupHandler] Track ${track.id}: deleted ${deleted.length}/${keysToDelete.length} files`);

        if (errors.length > 0) {
          console.error(`[CleanupHandler] Track ${track.id}: failed to delete ${errors.length} files`);
        }
      }

      // 4. 物理删除数据库记录（级联删除 variants, jobs, shares, assets）
      await prisma.track.delete({ where: { id: track.id } });

      console.log(`[CleanupHandler] Track ${track.id} cleanup completed`);

    } catch (error) {
      console.error(`[CleanupHandler] Failed to cleanup track ${track.id}:`, error);
      // 继续处理下一个
    }
  }

  return {
    success: true,
    cleanedCount: tracksToDelete.length,
  };
}
