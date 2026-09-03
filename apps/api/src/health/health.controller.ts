import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller(['health', 'api/health'])
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check probe (liveness)' })
  @ApiResponse({ status: 200, description: 'Application is running' })
  check() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness check probe' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to accept traffic',
  })
  readiness() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }
}
