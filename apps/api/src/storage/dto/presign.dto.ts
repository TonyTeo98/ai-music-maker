import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
] as const;

export class CreatePresignDto {
  @ApiProperty({ description: 'Track ID (optional for new tracks)', required: false })
  @IsOptional()
  @IsString()
  trackId?: string;

  @ApiProperty({ description: 'Original filename', example: 'my-song.mp3' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'Content type',
    enum: ALLOWED_AUDIO_TYPES,
    example: 'audio/mpeg',
  })
  @IsIn(ALLOWED_AUDIO_TYPES)
  contentType: string;
}

export class PresignResponseDto {
  @ApiProperty({ description: 'Asset ID' })
  assetId: string;

  @ApiProperty({ description: 'Presigned upload URL' })
  uploadUrl: string;

  @ApiProperty({ description: 'S3 object key' })
  key: string;

  @ApiProperty({ description: 'URL expires in seconds' })
  expiresIn: number;
}

export class ConfirmUploadDto {
  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @IsPositive()
  size: number;
}

export class AssetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  key: string;

  @ApiProperty({ required: false })
  size?: number;
}
