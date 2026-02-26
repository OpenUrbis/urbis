import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class RequestRepresentationDto {
  @ApiProperty({ example: '11144477735' })
  @IsNotEmpty()
  @IsString()
  document: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  justification?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];
}
