import { Body, Controller, Header, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExportGeoJsonDto } from './dto/export-geojson.dto';
import { ExportService } from './export.service';

@ApiTags('Maps Export')
@Controller('maps/export')
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Post('geojson')
  @ApiOperation({ summary: 'Export data to GeoJSON' })
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="export.geojson"')
  async exportGeoJson(@Body() dto: ExportGeoJsonDto) {
    return this.service.exportGeoJson(dto);
  }
}
