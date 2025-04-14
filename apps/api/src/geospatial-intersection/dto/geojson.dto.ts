import { IsNotEmpty, IsObject, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Represents a GeoJSON geometry for Polygon or MultiPolygon
 */
class GeoJsonGeometry {
  @ApiProperty({
    description: 'Type of geometry, either "Polygon" or "MultiPolygon"',
    enum: ['Polygon', 'MultiPolygon'],
    example: 'Polygon',
  })
  @IsString()
  @IsNotEmpty()
  type: 'Polygon' | 'MultiPolygon';

  @ApiProperty({
    description:
      'Coordinates array. For Polygon: Array of linear ring coordinate arrays. For MultiPolygon: Array of Polygon coordinate arrays.',
    type: 'array',
    items: { type: 'array', items: { type: 'number' } },
    example: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
  })
  @IsArray()
  @IsNotEmpty()
  coordinates: number[][][] | number[][][][];
}

/**
 * Represents a GeoJSON Feature for geospatial intersection queries
 */
export class GeoJsonDto {
  @ApiProperty({
    description: 'GeoJSON type, must be "Feature"',
    enum: ['Feature'],
    example: 'Feature',
  })
  @IsString()
  @IsNotEmpty()
  type: 'Feature';

  @ApiProperty({
    description: 'Geometry of the GeoJSON feature (Polygon or MultiPolygon)',
    type: GeoJsonGeometry,
  })
  @IsObject()
  @IsNotEmpty()
  geometry: GeoJsonGeometry;

  @ApiPropertyOptional({
    description: 'Optional properties of the GeoJSON feature',
    type: 'object',
    example: { name: 'Sample Polygon' },
  })
  properties?: Record<string, any>;
}