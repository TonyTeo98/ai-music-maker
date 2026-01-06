import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JobResponseDto } from './dto/job.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get job status' })
  @ApiResponse({ status: 200, type: JobResponseDto })
  async getJob(@Param('id') id: string): Promise<JobResponseDto> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        track: {
          include: { variants: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return {
      id: job.id,
      trackId: job.trackId,
      type: job.type,
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep ?? undefined,
      errorCode: job.errorCode ?? undefined,
      errorMsg: job.errorMsg ?? undefined,
      result: job.result as object | undefined,
      variants: job.track.variants.map((v) => ({
        id: v.id,
        variant: v.variant,
        audioUrl: v.audioUrl,
        duration: v.duration,
      })),
      createdAt: job.createdAt,
      startedAt: job.startedAt ?? undefined,
      completedAt: job.completedAt ?? undefined,
    };
  }
}
