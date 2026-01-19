import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateShareDto {
  @ApiProperty({ description: 'Is public share', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: 'Expiration date', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ShareResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  trackId: string;

  @ApiProperty()
  shareUrl: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty({ required: false })
  expiresAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class ShareDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  track: {
    id: string;
    title?: string;
    style?: string;
    status: string;
  };

  @ApiProperty()
  variant: {
    id: string;
    variant: string;
    audioUrl?: string;
    duration?: number;
    imageUrl?: string;
    imageLargeUrl?: string;
    lyrics?: string;
  } | null;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  createdAt: Date;
}
