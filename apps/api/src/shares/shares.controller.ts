import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareDto, ShareResponseDto, ShareDetailDto } from './dto/share.dto';
import { randomBytes } from 'crypto';

@ApiTags('shares')
@Controller()
export class SharesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Post('tracks/:id/share')
  @ApiOperation({ summary: 'Create a share link for a track' })
  @ApiResponse({ status: 201, type: ShareResponseDto })
  async createShare(
    @Param('id') trackId: string,
    @Body() dto: CreateShareDto,
  ): Promise<ShareResponseDto> {
    // 检查 Track 是否存在
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // 检查是否已选择主版本
    if (!track.primaryVariantId) {
      throw new BadRequestException('Please select a primary variant before sharing');
    }

    // 检查是否已有分享链接
    const existingShare = await this.prisma.share.findFirst({
      where: { trackId },
    });

    if (existingShare) {
      const webUrl = this.configService.get<string>('WEB_URL', 'http://localhost:3000');
      return {
        id: existingShare.id,
        token: existingShare.token,
        trackId: existingShare.trackId,
        shareUrl: `${webUrl}/s/${existingShare.token}`,
        isPublic: existingShare.isPublic,
        expiresAt: existingShare.expiresAt ?? undefined,
        createdAt: existingShare.createdAt,
      };
    }

    // 生成唯一 token
    const token = randomBytes(6).toString('base64url');

    const share = await this.prisma.share.create({
      data: {
        trackId,
        token,
        isPublic: dto.isPublic ?? true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    const webUrl = this.configService.get<string>('WEB_URL', 'http://localhost:3000');

    return {
      id: share.id,
      token: share.token,
      trackId: share.trackId,
      shareUrl: `${webUrl}/s/${share.token}`,
      isPublic: share.isPublic,
      expiresAt: share.expiresAt ?? undefined,
      createdAt: share.createdAt,
    };
  }

  @Get('shares/:token')
  @ApiOperation({ summary: 'Get share details by token' })
  @ApiResponse({ status: 200, type: ShareDetailDto })
  async getShare(@Param('token') token: string): Promise<ShareDetailDto> {
    const share = await this.prisma.share.findUnique({
      where: { token },
      include: {
        track: {
          include: {
            variants: true,
          },
        },
      },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // 检查是否过期
    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new NotFoundException('Share link has expired');
    }

    // 增加访问计数
    await this.prisma.share.update({
      where: { id: share.id },
      data: { viewCount: { increment: 1 } },
    });

    // 获取主版本
    const primaryVariant = share.track.variants.find(
      (v) => v.id === share.track.primaryVariantId,
    );

    return {
      id: share.id,
      token: share.token,
      track: {
        id: share.track.id,
        title: share.track.title ?? undefined,
        style: share.track.style ?? undefined,
        status: share.track.status,
      },
      variant: primaryVariant
        ? {
            id: primaryVariant.id,
            variant: primaryVariant.variant,
            audioUrl: primaryVariant.audioUrl ?? undefined,
            duration: primaryVariant.duration ?? undefined,
            imageUrl: primaryVariant.imageUrl ?? undefined,
            imageLargeUrl: primaryVariant.imageLargeUrl ?? undefined,
            lyrics: primaryVariant.lyrics ?? undefined,
          }
        : null,
      viewCount: share.viewCount + 1,
      createdAt: share.createdAt,
    };
  }
}
