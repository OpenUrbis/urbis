import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MapConfigService } from './map-config.service';

@ApiTags('Configurations Getters')
@Controller('map-config')
export class MapConfigController {
  constructor(private readonly mapConfigService: MapConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'Get configurations of map view and schemas in front end',
  })
  getConfigs() {
    return this.mapConfigService.getConfigs();
  }
}
