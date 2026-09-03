import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Matches, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const AUTHORITY_DATE_REGEX = /^\d{2}\.\d{2}\.\d{4}$/;

export class CreateLegisAuthorityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complementFull?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complementAbbr?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  commonRefFull: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  commonRefAbbr: string;

  @ApiProperty({
    description: 'Start of authority validity in dd.MM.yyyy format',
    example: '24.02.1891',
  })
  @IsString()
  @Matches(AUTHORITY_DATE_REGEX, {
    message: 'startDate must be in dd.MM.yyyy format',
  })
  startDate: string;

  @ApiPropertyOptional({
    description: 'End of authority validity in dd.MM.yyyy format',
    example: '02.01.2019',
  })
  @IsOptional()
  @IsString()
  @Matches(AUTHORITY_DATE_REGEX, {
    message: 'endDate must be in dd.MM.yyyy format',
  })
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageId?: string;
}
