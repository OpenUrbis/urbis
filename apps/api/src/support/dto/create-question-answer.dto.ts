import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateQuestionAnswerDto {
  @ApiProperty({ description: 'The question text', example: 'What is Urbis?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ description: 'The answer text', example: 'Urbis is a map platform.' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ description: 'Order index of the question answer', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  index?: number;

  @ApiProperty({ description: 'The UUIDs of the associated question tabs', type: [String], required: false })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  tabIds?: string[];
}
