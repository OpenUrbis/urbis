import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { GeospatialIntersectionService } from './geospatial-intersection.service';
import { GeoJsonDto } from './dto/geojson.dto';

/**
 * Controller for handling geospatial intersection queries
 */
@ApiTags('Geospatial intersections')
@Controller('geospatial-intersections')
export class GeospatialIntersectionController {
  constructor(
    private readonly geospatialIntersectionService: GeospatialIntersectionService,
  ) {}

  /**
   * Find intersections between a GeoJSON polygon and GeoServer layers
   * @param geojson - GeoJSON Feature with Polygon or MultiPolygon geometry
   * @returns FeatureCollection with intersecting features and metadata
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query geospatial intersections',
    description:
      'Receives a GeoJSON Feature (Polygon or MultiPolygon) and returns a FeatureCollection containing features from GeoServer layers that intersect with the input geometry. Includes intersection areas and layer metadata.',
  })
  @ApiBody({
    description: 'GeoJSON Feature with Polygon or MultiPolygon geometry',
    type: GeoJsonDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved intersecting features',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or empty GeoJSON provided',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error occurred',
  })
  async findIntersections(@Body() geojson: GeoJsonDto): Promise<any> {
    return this.geospatialIntersectionService.findIntersections(
      geojson as any['features'][0],
    );
  }
}
