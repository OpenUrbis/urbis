import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

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

  @IsString()
  @IsOptional()
  format?: 'geojson' | 'dwg';
}
