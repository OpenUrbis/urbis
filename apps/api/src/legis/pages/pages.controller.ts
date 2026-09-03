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
import { OptionalAccessControlGuard } from 'common/guards/access-control/optional-access-control.guard';
import { LegisAdminGuard } from '../shared/guards/legis-admin.guard';
import { CreateLegisPageDto } from './dto/create-legis-page.dto';
import { FindLegisPagesDto } from './dto/find-legis-pages.dto';
import {
  LegisPageResponseDto,
  PaginatedLegisPagesDto,
} from './dto/legis-page-response.dto';
import { UpdateLegisPageDto } from './dto/update-legis-page.dto';
import { PagesService } from './pages.service';

@ApiTags('Legis Pages')
@Controller('legis/pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  @UseGuards(OptionalAccessControlGuard)
  @ApiOperation({ summary: 'List Legis pages' })
  @ApiResponse({
    status: 200,
    type: PaginatedLegisPagesDto,
    description: 'Paginated Legis pages with hydrated authors.',
  })
  findAll(@Query() query: FindLegisPagesDto, @Req() req: any) {
    return this.pagesService.findAll(query, req.user);
  }

  @Get(':id')
  @UseGuards(OptionalAccessControlGuard)
  @ApiOperation({ summary: 'Find a Legis page by ID' })
  @ApiResponse({ status: 200, type: LegisPageResponseDto })
  findOne(
    @Param('id') id: string,
    @Query('withDeleted') withDeleted?: boolean,
    @Req() req?: any,
  ) {
    return this.pagesService.findOne(id, Boolean(withDeleted), req?.user);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Create a Legis page' })
  @ApiResponse({ status: 201, type: LegisPageResponseDto })
  @ApiForbiddenResponse({
    description: 'Only administrators can create Legis pages.',
  })
  create(@Body() createLegisPageDto: CreateLegisPageDto, @Req() req: any) {
    return this.pagesService.create(createLegisPageDto, req.user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Update a Legis page' })
  @ApiResponse({ status: 200, type: LegisPageResponseDto })
  @ApiForbiddenResponse({
    description: 'Only administrators can update Legis pages.',
  })
  update(
    @Param('id') id: string,
    @Body() updateLegisPageDto: UpdateLegisPageDto,
    @Req() req: any,
  ) {
    return this.pagesService.update(id, updateLegisPageDto, req.user);
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
    await this.pagesService.remove(id, req.user);
  }

  @Post(':id/restore')
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Restore a deleted Legis page' })
  @ApiResponse({ status: 200, type: LegisPageResponseDto })
  @ApiForbiddenResponse({
    description: 'Only administrators can restore Legis pages.',
  })
  async restore(@Param('id') id: string, @Req() req: any) {
    return this.pagesService.restore(id, req.user);
  }

  @Delete(':id/permanent')
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Permanently delete a Legis page' })
  @ApiResponse({ status: 204, description: 'Page permanently deleted.' })
  @ApiForbiddenResponse({
    description: 'Only administrators can permanently delete Legis pages.',
  })
  async hardDelete(@Param('id') id: string, @Req() req: any) {
    await this.pagesService.hardDelete(id, req.user);
  }
}
