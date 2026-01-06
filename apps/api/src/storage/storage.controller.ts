import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import {
  CreatePresignDto,
  PresignResponseDto,
  ConfirmUploadDto,
  AssetResponseDto,
} from './dto/presign.dto';

@ApiTags('assets')
@Controller('assets')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('presign')
  @ApiOperation({ summary: 'Get presigned URL for uploading an asset' })
  @ApiResponse({ status: 201, type: PresignResponseDto })
  async createPresignedUrl(
    @Body() dto: CreatePresignDto,
  ): Promise<PresignResponseDto> {
    const key = this.storageService.generateKey(dto.trackId ?? null, dto.filename);
    const expiresIn = 3600;

    const uploadUrl = await this.storageService.getPresignedUploadUrl(
      key,
      dto.contentType,
      expiresIn,
    );

    const asset = await this.prisma.asset.create({
      data: {
        trackId: dto.trackId ?? null,
        type: 'input_audio',
        status: 'pending',
        key,
        bucket: this.storageService.bucketName,
        mimeType: dto.contentType,
      },
    });

    return {
      assetId: asset.id,
      uploadUrl,
      key,
      expiresIn,
    };
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm upload completion' })
  @ApiResponse({ status: 200, type: AssetResponseDto })
  async confirmUpload(
    @Param('id') id: string,
    @Body() dto: ConfirmUploadDto,
  ): Promise<AssetResponseDto> {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        status: 'ready',
        size: dto.size,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      key: updated.key,
      size: updated.size ?? undefined,
    };
  }
}
