import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsArray, IsIn } from 'class-validator';

export class CreateTrackDto {
  @ApiProperty({ description: 'Device ID', required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ description: 'Track title', required: false })
  @IsOptional()
  @IsString()
  title?: string;
}

export class ListTracksQueryDto {
  @ApiProperty({ description: 'Device ID to filter tracks', required: true })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class TrackListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  style?: string;

  @ApiProperty({ required: false })
  primaryVariantId?: string;

  @ApiProperty({ required: false })
  audioUrl?: string;

  @ApiProperty({ required: false })
  duration?: number;

  @ApiProperty()
  createdAt: Date;
}

export class TrackListResponseDto {
  @ApiProperty({ type: [TrackListItemDto] })
  items: TrackListItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  hasMore: boolean;
}

export class GenerateTrackDto {
  @ApiProperty({ description: 'Music style', example: 'pop' })
  @IsString()
  @IsNotEmpty()
  style: string;

  @ApiProperty({ description: 'Input asset ID' })
  @IsString()
  @IsNotEmpty()
  inputAssetId: string;

  @ApiProperty({ description: 'Lyrics or theme text', required: false })
  @IsOptional()
  @IsString()
  lyrics?: string;

  @ApiProperty({ description: 'Segment start in milliseconds', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  segmentStartMs?: number;

  @ApiProperty({ description: 'Segment end in milliseconds', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  segmentEndMs?: number;

  // Advanced Settings
  @ApiProperty({ description: 'Styles to exclude', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeStyles?: string[];

  @ApiProperty({ description: 'Voice type', required: false, enum: ['female', 'male', 'instrumental'] })
  @IsOptional()
  @IsIn(['female', 'male', 'instrumental'])
  voiceType?: 'female' | 'male' | 'instrumental';

  @ApiProperty({ description: 'Text processing mode', required: false, enum: ['exact', 'auto'] })
  @IsOptional()
  @IsIn(['exact', 'auto'])
  textMode?: 'exact' | 'auto';

  @ApiProperty({ description: 'Creative tension (0-100)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tension?: number;

  @ApiProperty({ description: 'Style lock strength (0-100)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  styleLock?: number;
}

export class SetPrimaryVariantDto {
  @ApiProperty({ description: 'Variant ID to set as primary' })
  @IsString()
  @IsNotEmpty()
  variantId: string;
}

export class TrackResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  style?: string;

  @ApiProperty({ required: false })
  primaryVariantId?: string;

  @ApiProperty()
  createdAt: Date;
}

export class GenerateResponseDto {
  @ApiProperty()
  trackId: string;

  @ApiProperty()
  jobId: string;

  @ApiProperty()
  status: string;
}
