import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchConfig } from 'search/entities/search-config.entity';
import { SearchService } from 'search/search.service';
import { MapConfigResponseDto } from './dto/map-config-response.dto';
import { MapConfigService } from './map-config.service';

@ApiTags('Configurations Getters')
@Controller()
export class MapConfigController {
  constructor(
    private readonly mapConfigService: MapConfigService,
    private readonly searchConfigService: SearchService,
  ) {}

  @Get('map-config')
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

  @Get('search-config')
  @ApiOperation({ summary: 'Get configurations of search field in front end' })
  @ApiResponse({
    status: 200,
    description: 'Search field configuration',
    type: [SearchConfig],
  })
  findAll() {
    return this.searchConfigService.findAll();
  }
}
