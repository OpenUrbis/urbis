import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class RequestRepresentationDto {
  @ApiProperty({ example: '11144477735' })
  @IsNotEmpty()
  @IsString()
  document: string;

  @ApiProperty({ example: 'attorney' })
  @IsNotEmpty()
  @IsString()
  representationType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tradeName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  socialName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  documents?: Array<{ category: string; files: string[] }>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  otherRepresentatives?: string[];
}
