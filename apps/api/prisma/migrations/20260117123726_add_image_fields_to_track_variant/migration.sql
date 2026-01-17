-- AlterTable
ALTER TABLE "TrackVariant" ADD COLUMN     "imageDownloadStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "imageLargeUrl" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "localImageKey" TEXT,
ADD COLUMN     "localImageLargeKey" TEXT;
