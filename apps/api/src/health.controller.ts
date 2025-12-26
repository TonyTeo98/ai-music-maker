import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ai-music-maker-api',
      version: '0.1.0',
    };
  }

  @Get()
  @ApiOperation({ summary: '根路径' })
  root() {
    return {
      name: 'AI Music Maker API',
      version: '0.1.0',
      docs: '/docs',
    };
  }
}
