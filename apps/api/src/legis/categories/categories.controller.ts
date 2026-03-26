import {
  Body,
  Controller,
  Get,
  Post,
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
import { CategoriesService } from './categories.service';
import { CreateLegisCategoryDto } from './dto/create-legis-category.dto';
import { LegisCategory } from './entities';

@ApiTags('Legis Categories')
@Controller('legis/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List Legis categories' })
  @ApiResponse({ status: 200, type: [LegisCategory] })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Create a Legis category' })
  @ApiResponse({ status: 201, type: LegisCategory })
  @ApiForbiddenResponse({
    description: 'Only administrators can create Legis categories.',
  })
  create(
    @Body() createLegisCategoryDto: CreateLegisCategoryDto,
    @Req() req: any,
  ) {
    return this.categoriesService.create(createLegisCategoryDto, req.user?.id);
  }
}