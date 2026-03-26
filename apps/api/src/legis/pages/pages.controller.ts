import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { LegisAdminGuard } from '../shared/guards/legis-admin.guard';
import { CreateLegisPageDto } from './dto/create-legis-page.dto';
import { FindLegisPagesDto } from './dto/find-legis-pages.dto';
import { UpdateLegisPageDto } from './dto/update-legis-page.dto';
import { LegisPage } from './entities';
import { PagesService } from './pages.service';

@ApiTags('Legis Pages')
@Controller('legis/pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  @ApiOperation({ summary: 'List Legis pages' })
  @ApiResponse({ status: 200, description: 'Paginated Legis pages.' })
  findAll(@Query() query: FindLegisPagesDto) {
    return this.pagesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a Legis page by ID' })
  @ApiResponse({ status: 200, type: LegisPage })
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Create a Legis page' })
  @ApiResponse({ status: 201, type: LegisPage })
  @ApiForbiddenResponse({
    description: 'Only administrators can create Legis pages.',
  })
  create(@Body() createLegisPageDto: CreateLegisPageDto, @Req() req: any) {
    return this.pagesService.create(createLegisPageDto, req.user?.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Update a Legis page' })
  @ApiResponse({ status: 200, type: LegisPage })
  @ApiForbiddenResponse({
    description: 'Only administrators can update Legis pages.',
  })
  update(
    @Param('id') id: string,
    @Body() updateLegisPageDto: UpdateLegisPageDto,
    @Req() req: any,
  ) {
    return this.pagesService.update(id, updateLegisPageDto, req.user?.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Delete a Legis page' })
  @ApiResponse({ status: 204, description: 'Page deleted successfully.' })
  @ApiForbiddenResponse({
    description: 'Only administrators can delete Legis pages.',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.pagesService.remove(id, req.user?.id);
  }
}
