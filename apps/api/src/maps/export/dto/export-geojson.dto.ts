import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ExternalLayerDto {
  @IsString()
  id: string;

  @IsString()
  wfsUrl: string;

  @IsString()
  typeName: string;

  @IsString()
  @IsOptional()
  cqlFilter?: string;

  @IsNumber()
  @IsOptional()
  minZoom?: number;
}

export class ExportGeoJsonDto {
  @IsArray()
  @IsNumber({}, { each: true })
  bounds: number[]; // [minLon, minLat, maxLon, maxLat]

  @IsNumber()
  @IsOptional()
  zoom?: number;

  @IsArray()
  @IsString({ each: true })
  layers: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalLayerDto)
  @IsOptional()
  externalLayers?: ExternalLayerDto[];

  @IsString()
  @IsOptional()
  format?: 'geojson' | 'dwg';
}
