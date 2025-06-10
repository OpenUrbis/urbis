import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SqlcDto {
  @ApiProperty({
    description: 'SQLC number in format XXXXXXXX (10 digits) or XXXXXXXXXXXX (12 digits)',
    example: '0080080000',
  })
  @IsString()
  @Matches(/^\d{10}(\d{2})?$/, {
    message: 'SQLC number must be 10 or 12 digits',
  })
  sqlc: string;
} 