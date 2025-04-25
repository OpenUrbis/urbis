import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchConfigService } from './search-config.service';

@ApiTags('Configs')
@Controller('search-config')
export class SearchConfigController {
  constructor(private readonly searchConfigService: SearchConfigService) {}

  @Get()
  findAll() {
    return this.searchConfigService.findAll();
  }
}
