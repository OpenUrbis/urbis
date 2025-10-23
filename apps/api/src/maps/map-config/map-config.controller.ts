import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchConfig } from 'maps/search/entities/search-config.entity';
import { SearchService } from 'maps/search/search.service';
import { MapConfigResponseDto } from './dto/map-config-response.dto';
import { TextLayerDtoResponse } from './dto/text-layer.dto';
import { MapConfigService } from './map-config.service';

@ApiTags('Configurations Getters')
@Controller('maps/config')
export class MapConfigController {
  constructor(
    private readonly mapConfigService: MapConfigService,
    private readonly searchConfigService: SearchService,
  ) {}

  @Get('map')
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

  @Get('search')
  @ApiOperation({ summary: 'Get configurations of search field in front end' })
  @ApiResponse({
    status: 200,
    description: 'Search field configuration',
    type: [SearchConfig],
  })
  findAll() {
    return this.searchConfigService.findAll();
  }

  @Get('text-layer')
  @ApiOperation({ summary: 'Get array of text-layer' })
  @ApiQuery({
    name: 'origin',
    type: String,
    description: 'URI of the geoserver',
    example:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:distrito_municipal&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
  })
  @ApiResponse({
    status: 200,
    description: 'Features array',
    type: [TextLayerDtoResponse],
  })
  getTextLayer(@Query() params: any) {
    if (!params.origin)
      throw new BadRequestException({ message: 'origin is required' });

    return this.mapConfigService.getTextLayer(params);
  }
}
