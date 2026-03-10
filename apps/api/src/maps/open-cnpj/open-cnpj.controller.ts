import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OpenCnpjService } from './open-cnpj.service';
import { AccessControlGuard } from '../../common/guards/access-control/access-control.guard';

@ApiTags('maps/open-cnpj')
@ApiBearerAuth()
@UseGuards(AccessControlGuard)
@Controller('maps/open-cnpj')
export class OpenCnpjController {
  constructor(private readonly openCnpjService: OpenCnpjService) {}

  @Get(':cnpj')
  @ApiOperation({ summary: 'Get CNPJ data from OpenCNPJ API' })
  @ApiParam({
    name: 'cnpj',
    description: 'CNPJ with or without punctuation',
    example: '00.000.000/0000-00',
  })
  @ApiResponse({ status: 200, description: 'CNPJ found' })
  @ApiResponse({ status: 404, description: 'CNPJ not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async getCnpjData(@Param('cnpj') cnpj: string) {
    return this.openCnpjService.getCnpjData(cnpj);
  }
}
