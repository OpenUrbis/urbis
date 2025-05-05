import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchConfig } from './entities/search-config.entity';
import { SearchConfigService } from './search-config.service';

@ApiTags('Configurations Getters')
@Controller('search-config')
export class SearchConfigController {
  constructor(private readonly searchConfigService: SearchConfigService) {}

  @Get()
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
