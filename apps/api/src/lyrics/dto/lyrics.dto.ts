import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class GenerateLyricsDto {
  @ApiProperty({
    description: 'Prompt for lyrics generation',
    example: 'A happy song about friendship and adventure',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt: string;
}

export class LyricsResponseDto {
  @ApiProperty({
    description: 'Generated lyrics',
    example: '[Verse 1]\n...',
  })
  lyrics: string;
}
