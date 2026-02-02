import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User nickname (max 20 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nickname?: string;

  @ApiPropertyOptional({ description: 'User bio (max 200 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;
}

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  nickname?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  bio?: string;

  @ApiProperty()
  emailVerified: boolean;
}
