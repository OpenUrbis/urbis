import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class AddCommentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
