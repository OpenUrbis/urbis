import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { RepresentationStatus } from '../enums/representation-status.enum';

export class UpdateRepresentationStatusDto {
  @ApiProperty({ enum: RepresentationStatus })
  @IsEnum(RepresentationStatus)
  status: RepresentationStatus;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
