import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SupportTicketType } from '../enums/support-ticket.enum';

export class CreateSupportTicketDto {
  @ApiProperty({
    description: 'Name of the user submitting the ticket',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email address for contact',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Detailed description of the issue or inquiry',
    example: 'I am unable to access the map layer settings...',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'List of file URLs attached to the ticket',
    example: ['https://example.com/screenshot1.png'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  files?: string[];

  @ApiProperty({
    description: 'Type of the support ticket',
    enum: SupportTicketType,
    example: SupportTicketType.BUG_REPORT,
  })
  @IsEnum(SupportTicketType)
  @IsNotEmpty()
  type: SupportTicketType;
}
