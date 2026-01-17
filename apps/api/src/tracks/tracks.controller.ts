import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { LangfuseService } from '../langfuse/langfuse.service';
import { TrackStatus } from '@prisma/client';
import {
  CreateTrackDto,
  GenerateTrackDto,
  SetPrimaryVariantDto,
  TrackResponseDto,
  GenerateResponseDto,
  TrackListResponseDto,
} from './dto/track.dto';

@ApiTags('tracks')
@Controller('tracks')
export class TracksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly langfuseService: LangfuseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List tracks for a device' })
  @ApiQuery({ name: 'deviceId', required: true, description: 'Device ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, type: TrackListResponseDto })
  async listTracks(
    @Query('deviceId') deviceId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<TrackListResponseDto> {
    if (!deviceId) {
      throw new BadRequestException('deviceId is required');
    }

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
    const skip = (pageNum - 1) * limitNum;

    // 查询已完成的作品（有主版本的）
    const where = {
      deviceId,
      deletedAt: null,
      status: { in: [TrackStatus.ready, TrackStatus.generating] },
    };

    const [tracks, total] = await Promise.all([
      this.prisma.track.findMany({
        where,
        include: {
          variants: {
            where: { variant: 'A' }, // 默认取 A 版本作为封面
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.track.count({ where }),
    ]);

    const items = tracks.map((track) => {
      const primaryVariant = track.variants[0];
      return {
        id: track.id,
        status: track.status,
        title: track.title ?? undefined,
        style: track.style ?? undefined,
        primaryVariantId: track.primaryVariantId ?? undefined,
        audioUrl: primaryVariant?.audioUrl ?? undefined,
        duration: primaryVariant?.duration ?? undefined,
        createdAt: track.createdAt,
      };
    });

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + tracks.length < total,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new track' })
  @ApiResponse({ status: 201, type: TrackResponseDto })
  async createTrack(@Body() dto: CreateTrackDto): Promise<TrackResponseDto> {
    let deviceId = dto.deviceId;

    if (deviceId) {
      // 前端传入 deviceId，确保 Device 记录存在（upsert）
      await this.prisma.device.upsert({
        where: { id: deviceId },
        update: {},
        create: { id: deviceId, platform: 'web' },
      });
    } else {
      // 没有 deviceId，创建新设备
      const device = await this.prisma.device.create({
        data: { platform: 'web' },
      });
      deviceId = device.id;
    }

    const track = await this.prisma.track.create({
      data: {
        deviceId,
        title: dto.title,
        status: 'draft',
      },
    });

    return {
      id: track.id,
      status: track.status,
      title: track.title ?? undefined,
      createdAt: track.createdAt,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get track details' })
  @ApiResponse({ status: 200, type: TrackResponseDto })
  async getTrack(@Param('id') id: string): Promise<TrackResponseDto> {
    const track = await this.prisma.track.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    return {
      id: track.id,
      status: track.status,
      title: track.title ?? undefined,
      style: track.style ?? undefined,
      primaryVariantId: track.primaryVariantId ?? undefined,
      createdAt: track.createdAt,
    };
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Start music generation for a track' })
  @ApiResponse({ status: 201, type: GenerateResponseDto })
  async generateTrack(
    @Param('id') id: string,
    @Body() dto: GenerateTrackDto,
  ): Promise<GenerateResponseDto> {
    // 检查 Track 是否存在
    const track = await this.prisma.track.findUnique({ where: { id } });
    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // 检查是否已在生成中
    if (track.status === 'generating') {
      throw new BadRequestException('Track is already generating');
    }

    // 检查输入 Asset 是否存在且 ready
    const inputAsset = await this.prisma.asset.findUnique({
      where: { id: dto.inputAssetId },
    });
    if (!inputAsset || inputAsset.status !== 'ready') {
      throw new BadRequestException('Input asset not found or not ready');
    }

    // 关联 Asset 到 Track
    await this.prisma.asset.update({
      where: { id: dto.inputAssetId },
      data: { trackId: id },
    });

    // 创建 Job 记录
    const job = await this.prisma.job.create({
      data: {
        trackId: id,
        type: 'generate',
        status: 'queued',
        params: {
          style: dto.style,
          inputAssetId: dto.inputAssetId,
          lyrics: dto.lyrics,
          segment: dto.segmentStartMs !== undefined ? {
            startMs: dto.segmentStartMs,
            endMs: dto.segmentEndMs,
          } : undefined,
          excludeStyles: dto.excludeStyles,
          voiceType: dto.voiceType,
          textMode: dto.textMode,
          tension: dto.tension,
          styleLock: dto.styleLock,
        },
      },
    });

    // 添加到队列
    await this.queueService.addGenerateJob({
      trackId: id,
      jobId: job.id,
      style: dto.style,
      inputAssetKey: inputAsset.key,
      lyrics: dto.lyrics,
      segment: dto.segmentStartMs !== undefined ? {
        startMs: dto.segmentStartMs,
        endMs: dto.segmentEndMs ?? dto.segmentStartMs + 30000,
      } : undefined,
      excludeStyles: dto.excludeStyles,
      voiceType: dto.voiceType,
      textMode: dto.textMode,
      tension: dto.tension,
      styleLock: dto.styleLock,
    });

    return {
      trackId: id,
      jobId: job.id,
      status: 'queued',
    };
  }

  @Post(':id/primary')
  @ApiOperation({ summary: 'Set primary variant for a track' })
  @ApiResponse({ status: 200, type: TrackResponseDto })
  async setPrimaryVariant(
    @Param('id') id: string,
    @Body() dto: SetPrimaryVariantDto,
  ): Promise<TrackResponseDto> {
    const track = await this.prisma.track.findUnique({
      where: { id },
      include: { variants: true, jobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    const variant = track.variants.find((v) => v.id === dto.variantId);
    if (!variant) {
      throw new BadRequestException('Variant not found for this track');
    }

    const updated = await this.prisma.track.update({
      where: { id },
      data: { primaryVariantId: dto.variantId },
    });

    // 上报 chosen_variant score 到 Langfuse
    const latestJob = track.jobs[0];
    if (latestJob) {
      const chosenVariant = variant.variant as 'A' | 'B';
      this.langfuseService.reportChosenVariant(latestJob.id, chosenVariant);
    }

    return {
      id: updated.id,
      status: updated.status,
      title: updated.title ?? undefined,
      style: updated.style ?? undefined,
      primaryVariantId: updated.primaryVariantId ?? undefined,
      createdAt: updated.createdAt,
    };
  }

  @Get(':id/variants')
  @ApiOperation({ summary: 'Get track variants' })
  async getVariants(@Param('id') id: string) {
    const track = await this.prisma.track.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    return track.variants.map((v) => ({
      id: v.id,
      variant: v.variant,
      batchIndex: v.batchIndex,
      audioUrl: v.audioUrl,
      duration: v.duration,
      inputSimilarity: v.inputSimilarity,
      audioQuality: v.audioQuality,
      createdAt: v.createdAt,
    }));
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get track generation history grouped by batch' })
  async getHistory(@Param('id') id: string) {
    const track = await this.prisma.track.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: [{ batchIndex: 'desc' }, { variant: 'asc' }],
        },
      },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // 按 batchIndex 分组
    const batches = new Map<number, typeof track.variants>();
    for (const v of track.variants) {
      if (!batches.has(v.batchIndex)) {
        batches.set(v.batchIndex, []);
      }
      batches.get(v.batchIndex)!.push(v);
    }

    // 转换为数组格式
    const history = Array.from(batches.entries()).map(([batchIndex, variants]) => ({
      batchIndex,
      createdAt: variants[0]?.createdAt,
      variants: variants.map((v) => ({
        id: v.id,
        variant: v.variant,
        audioUrl: v.audioUrl,
        duration: v.duration,
        isPrimary: v.id === track.primaryVariantId,
      })),
    }));

    return {
      trackId: track.id,
      title: track.title,
      style: track.style,
      primaryVariantId: track.primaryVariantId,
      totalBatches: batches.size,
      history,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a track' })
  @ApiResponse({ status: 200, description: 'Track deleted successfully' })
  async deleteTrack(@Param('id') id: string) {
    const track = await this.prisma.track.findUnique({
      where: { id },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    if (track.deletedAt) {
      throw new BadRequestException('Track already deleted');
    }

    const now = new Date();
    const scheduledDeleteAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后

    await this.prisma.track.update({
      where: { id },
      data: {
        deletedAt: now,
        scheduledDeleteAt,
      },
    });

    return {
      success: true,
      message: 'Track deleted successfully. Files will be permanently removed after 30 days.',
      scheduledDeleteAt,
    };
  }
}
