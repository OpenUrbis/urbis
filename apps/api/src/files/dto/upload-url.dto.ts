import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadUrlDto {
    @ApiProperty({ description: 'File MIME type', example: 'image/jpeg' })
    @IsString()
    @IsNotEmpty()
    contentType: string;
}