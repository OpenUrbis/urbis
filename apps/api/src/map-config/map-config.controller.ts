import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MapConfigResponseDto } from './dto/map-config-response.dto';
import { MapConfigService } from './map-config.service';

@ApiTags('Configurations Getters')
@Controller('map-config')
export class MapConfigController {
  constructor(private readonly mapConfigService: MapConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'Get configurations of map view and schemas in front end',
  })
  @ApiResponse({
    status: 200,
    description: 'Map configurations, layers and groups to use in front end',
    type: MapConfigResponseDto,
  })
  getConfigs() {
    return this.mapConfigService.getConfigs();
  }
}
