import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class ImportFromUrlDto {
  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  url: string;
}