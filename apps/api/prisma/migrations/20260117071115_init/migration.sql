-- CreateEnum
CREATE TYPE "TrackStatus" AS ENUM ('draft', 'generating', 'ready', 'failed', 'deleted');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('generate', 'video');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('input_audio', 'output_audio', 'cover', 'video');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('pending', 'uploading', 'ready', 'failed');

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "platform" TEXT,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deviceId" TEXT NOT NULL,
    "status" "TrackStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT,
    "style" TEXT,
    "primaryVariantId" TEXT,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackVariant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trackId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "batchIndex" INTEGER NOT NULL DEFAULT 1,
    "audioUrl" TEXT,
    "duration" DOUBLE PRECISION,
    "inputSimilarity" DOUBLE PRECISION,
    "audioQuality" DOUBLE PRECISION,
    "provider" TEXT,
    "metadata" JSONB,

    CONSTRAINT "TrackVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trackId" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "errorCode" TEXT,
    "errorMsg" TEXT,
    "params" JSONB,
    "result" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trackId" TEXT,
    "type" "AssetType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'pending',
    "key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "duration" DOUBLE PRECISION,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trackId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Track_deviceId_idx" ON "Track"("deviceId");

-- CreateIndex
CREATE INDEX "Track_status_idx" ON "Track"("status");

-- CreateIndex
CREATE INDEX "TrackVariant_trackId_idx" ON "TrackVariant"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackVariant_trackId_variant_batchIndex_key" ON "TrackVariant"("trackId", "variant", "batchIndex");

-- CreateIndex
CREATE INDEX "Job_trackId_idx" ON "Job"("trackId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Asset_trackId_idx" ON "Asset"("trackId");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Share_token_key" ON "Share"("token");

-- CreateIndex
CREATE INDEX "Share_token_idx" ON "Share"("token");

-- CreateIndex
CREATE INDEX "Share_trackId_idx" ON "Share"("trackId");

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackVariant" ADD CONSTRAINT "TrackVariant_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
