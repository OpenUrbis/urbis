import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class SearchConditionDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({
    enum: ['term', 'normativeType', 'actDate', 'authorityId', 'scope'],
  })
  @IsString()
  @IsIn(['term', 'normativeType', 'actDate', 'authorityId', 'scope'])
  field: string;

  @ApiProperty({
    enum: ['contains', 'equals', 'not_contains', 'greater', 'less'],
  })
  @IsString()
  @IsIn(['contains', 'equals', 'not_contains', 'greater', 'less'])
  operator: string;

  @ApiProperty()
  @IsString()
  value: string;

  @ApiPropertyOptional({ enum: ['AND', 'OR'], default: 'AND' })
  @IsOptional()
  @IsString()
  @IsIn(['AND', 'OR'])
  connector?: string;
}

export class SearchPagesDto {
  @ApiProperty({ type: [SearchConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchConditionDto)
  conditions: SearchConditionDto[];
}

export { SearchConditionDto };