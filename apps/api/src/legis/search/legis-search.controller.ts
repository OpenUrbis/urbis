import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchNormativeElementsDto } from './dto/search-normative-elements.dto';
import { SearchPagesDto } from './dto/search-pages.dto';
import { LegisSearchService } from './legis-search.service';

@ApiTags('Legis Search')
@Controller('legis/search')
export class LegisSearchController {
  constructor(private readonly legisSearchService: LegisSearchService) {}

  @Post('pages')
  @ApiOperation({ summary: 'Search Legis pages' })
  @ApiResponse({ status: 200, description: 'Search results for Legis pages.' })
  searchPages(@Body() query: SearchPagesDto) {
    return this.legisSearchService.searchPages(query);
  }

  @Post('normative-elements')
  @ApiOperation({ summary: 'Search normative elements inside Legis pages' })
  @ApiResponse({
    status: 200,
    description: 'Search results for normative elements.',
  })
  searchNormativeElements(@Body() payload: SearchNormativeElementsDto) {
    return this.legisSearchService.searchNormativeElements(payload);
  }
}
