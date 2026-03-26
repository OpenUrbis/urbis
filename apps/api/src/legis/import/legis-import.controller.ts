import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { ImportFromUrlDto } from './dto/import-from-url.dto';
import { LegisImportService } from './legis-import.service';
import { LegisAdminGuard } from '../shared/guards/legis-admin.guard';

@ApiTags('Legis Import')
@Controller('legis/import')
export class LegisImportController {
  constructor(private readonly legisImportService: LegisImportService) {}

  @Post('url')
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard, LegisAdminGuard)
  @ApiOperation({ summary: 'Import Legis content from a URL' })
  @ApiResponse({ status: 200, description: 'Imported content payload.' })
  @ApiForbiddenResponse({
    description: 'Only administrators can import Legis content.',
  })
  importFromUrl(@Body() payload: ImportFromUrlDto) {
    return this.legisImportService.importFromUrl(payload);
  }
}
