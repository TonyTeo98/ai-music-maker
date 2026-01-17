import { PrismaClient } from '@prisma/client';
import { StorageService } from '../../../../apps/api/src/storage/storage.service';
import { ConfigService } from '@nestjs/config';

const prisma = new PrismaClient();
const configService = new ConfigService();
const storageService = new StorageService(configService);

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
        const { deleted, errors } = await storageService.deleteObjects(keysToDelete);
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
