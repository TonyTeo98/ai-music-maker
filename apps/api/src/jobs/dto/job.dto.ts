import { ApiProperty } from '@nestjs/swagger';

export class VariantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  variant: string;

  @ApiProperty({ required: false })
  audioUrl?: string | null;

  @ApiProperty({ required: false })
  duration?: number | null;
}

export class JobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  trackId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  progress: number;

  @ApiProperty({ required: false })
  currentStep?: string;

  @ApiProperty({ required: false })
  errorCode?: string;

  @ApiProperty({ required: false })
  errorMsg?: string;

  @ApiProperty({ required: false })
  result?: object;

  @ApiProperty({ type: [VariantDto] })
  variants: VariantDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  startedAt?: Date;

  @ApiProperty({ required: false })
  completedAt?: Date;
}
