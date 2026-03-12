import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQuestionTabDto {
  @ApiProperty({ description: 'Name of the question tab', example: 'General' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the question tab', example: 'General questions', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Icon of the question tab', example: 'info-circle', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: 'Order index of the question tab', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  index?: number;
}
