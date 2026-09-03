import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAccessControlGuard } from 'common/guards/access-control/optional-access-control.guard';
import { SearchNormativeElementsDto } from './dto/search-normative-elements.dto';
import { SearchPagesDto } from './dto/search-pages.dto';
import { LegisSearchService } from './legis-search.service';

@ApiTags('Legis Search')
@Controller('legis/search')
export class LegisSearchController {
  constructor(private readonly legisSearchService: LegisSearchService) {}

  @Post('pages')
  @UseGuards(OptionalAccessControlGuard)
  @ApiOperation({ summary: 'Search Legis pages' })
  @ApiResponse({ status: 200, description: 'Search results for Legis pages.' })
  searchPages(@Body() query: SearchPagesDto, @Req() req: any) {
    return this.legisSearchService.searchPages(query, req.user);
  }

  @Post('normative-elements')
  @UseGuards(OptionalAccessControlGuard)
  @ApiOperation({ summary: 'Search normative elements inside Legis pages' })
  @ApiResponse({
    status: 200,
    description: 'Search results for normative elements.',
  })
  searchNormativeElements(
    @Body() payload: SearchNormativeElementsDto,
    @Req() req: any,
  ) {
    return this.legisSearchService.searchNormativeElements(payload, req?.user);
  }
}
