import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DownloadUrlDto {
  @ApiProperty({ description: 'S3 file key', example: 'uploads/file.jpg' })
  @IsString()
  @IsNotEmpty()
  key: string;
}
