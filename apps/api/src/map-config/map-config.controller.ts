import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MapConfigService } from './map-config.service';

@ApiTags('Configs')
@Controller('map-config')
export class MapConfigController {
  constructor(private readonly mapConfigService: MapConfigService) {}

  @Get() getConfigs() {
    return this.mapConfigService.getConfigs();
  }
}
