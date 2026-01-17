-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "scheduledDeleteAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TrackVariant" ADD COLUMN     "downloadError" TEXT,
ADD COLUMN     "downloadStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "downloadedAt" TIMESTAMP(3),
ADD COLUMN     "localAudioKey" TEXT;
