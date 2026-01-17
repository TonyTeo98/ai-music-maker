import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GenerateLyricsDto, LyricsResponseDto } from './dto/lyrics.dto';

const CQTAI_API_BASE = process.env.CQTAI_API_BASE_URL || 'https://api.cqtai.com';
const CQTAI_API_KEY = process.env.CQTAI_API_KEY || '';

@ApiTags('lyrics')
@Controller('lyrics')
export class LyricsController {
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate lyrics using AI' })
  @ApiResponse({ status: 200, type: LyricsResponseDto })
  async generateLyrics(@Body() dto: GenerateLyricsDto): Promise<LyricsResponseDto> {
    // Mock 模式
    if (!CQTAI_API_KEY) {
      return {
        lyrics: this.getMockLyrics(dto.prompt),
      };
    }

    try {
      const response = await fetch(`${CQTAI_API_BASE}/api/cqt/generator/suno`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CQTAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'lyrics',
          prompt: dto.prompt,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`CQTAI API error: ${response.status} - ${text}`);
      }

      const result = await response.json();

      if (result.code !== 200) {
        throw new Error(`CQTAI API error: ${result.msg}`);
      }

      return {
        lyrics: result.data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[LyricsController] Generate lyrics failed:', message);

      // 降级到 mock
      return {
        lyrics: this.getMockLyrics(dto.prompt),
      };
    }
  }

  private getMockLyrics(prompt: string): string {
    return `[Verse 1]
${prompt}
在这美好的时光里
让我们一起歌唱

[Chorus]
快乐的旋律响起
心中充满希望
让音乐带我们飞翔
飞向梦想的地方

[Verse 2]
每一个音符都闪耀
每一句歌词都动人
让我们用心感受
这份美好的时光

[Chorus]
快乐的旋律响起
心中充满希望
让音乐带我们飞翔
飞向梦想的地方

[Bridge]
无论风雨如何
我们都不会放弃
因为音乐给我们力量
让我们勇敢前行

[Outro]
让歌声永远回荡
在我们的心中`;
  }
}
