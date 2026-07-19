import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MapDataService } from './mapdata.service';

@ApiTags('MapData Proxy')
@Controller('maps/mapdata')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MapDataController {
  constructor(private readonly mapDataService: MapDataService) {}

  @Post('file/:id')
  @ApiOperation({ summary: 'Request file processing on MapData API' })
  @ApiParam({
    name: 'id',
    description: 'File ID (or key) to process',
    example: 'teste.dwg',
  })
  @ApiResponse({
    status: 200,
    description: 'File processing requested successfully',
  })
  async requestFileProcessing(@Param('id') id: string) {
    return this.mapDataService.requestFileProcessing(id);
  }

  @Get('file/:id')
  @ApiOperation({
    summary: 'Check file processing status and get extracted data',
  })
  @ApiParam({
    name: 'id',
    description: 'File ID (or key) to check',
    example: 'teste.dwg',
  })
  @ApiResponse({
    status: 200,
    description: 'File processing status retrieved successfully',
  })
  async checkFileProcessingStatus(@Param('id') id: string) {
    return this.mapDataService.checkFileProcessingStatus(id);
  }

  @Post('approve/:id')
  @ApiOperation({ summary: 'Request file approval on MapData API' })
  @ApiParam({
    name: 'id',
    description: 'File ID (or key) to approve',
    example: 'teste.dwg',
  })
  @ApiBody({
    description: 'Key-value pairs representing block attributes to fill',
    schema: {
      example: {
        NumeroProjeto: '12345',
        Responsavel: 'João Silva',
        Data: '27/02/2026',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File approval requested successfully',
  })
  async approveFile(
    @Param('id') id: string,
    @Body() body: Record<string, string>,
  ) {
    return this.mapDataService.approveFile(id, body);
  }

  @Get('approve/:id')
  @ApiOperation({ summary: 'Check file approval status' })
  @ApiParam({
    name: 'id',
    description: 'File ID (or key) to check approval',
    example: 'teste.dwg',
  })
  @ApiResponse({
    status: 200,
    description: 'File approval status retrieved successfully',
  })
  async checkApprovalStatus(@Param('id') id: string) {
    return this.mapDataService.checkApprovalStatus(id);
  }
}
