import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadUrlDto {
  @ApiProperty({ description: 'File MIME type', example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({ description: 'Folder path in S3', example: 'uploads/' })
  @IsString()
  @IsOptional()
  folderPath?: string;
}
