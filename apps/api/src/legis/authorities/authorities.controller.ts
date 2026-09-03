import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { AuthoritiesService } from './authorities.service';
import { CreateLegisAuthorityDto } from './dto/create-legis-authority.dto';
import { LegisAuthorityResponseDto } from './dto/legis-authority-response.dto';
import { UpdateLegisAuthorityDto } from './dto/update-legis-authority.dto';

@ApiTags('Legis Authorities')
@Controller('legis/authorities')
export class AuthoritiesController {
  constructor(private readonly authoritiesService: AuthoritiesService) {}

  @Get()
  @ApiOperation({ summary: 'List Legis authorities' })
  @ApiResponse({ status: 200, type: [LegisAuthorityResponseDto] })
  findAll() {
    return this.authoritiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a Legis authority by ID' })
  @ApiResponse({ status: 200, type: LegisAuthorityResponseDto })
  findOne(@Param('id') id: string) {
    return this.authoritiesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Create a Legis authority' })
  @ApiResponse({ status: 201, type: LegisAuthorityResponseDto })
  @ApiForbiddenResponse({
    description: 'Only administrators can create Legis authorities.',
  })
  create(
    @Body() createLegisAuthorityDto: CreateLegisAuthorityDto,
    @Req() req: any,
  ) {
    return this.authoritiesService.create(
      createLegisAuthorityDto,
      req.user?.id,
    );
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Update a Legis authority' })
  @ApiResponse({ status: 200, type: LegisAuthorityResponseDto })
  @ApiForbiddenResponse({
    description: 'Only administrators can update Legis authorities.',
  })
  update(
    @Param('id') id: string,
    @Body() updateLegisAuthorityDto: UpdateLegisAuthorityDto,
    @Req() req: any,
  ) {
    return this.authoritiesService.update(
      id,
      updateLegisAuthorityDto,
      req.user?.id,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Delete a Legis authority' })
  @ApiResponse({ status: 204, description: 'Authority deleted successfully.' })
  @ApiForbiddenResponse({
    description: 'Only administrators can delete Legis authorities.',
  })
  async remove(@Param('id') id: string) {
    await this.authoritiesService.remove(id);
  }
}
