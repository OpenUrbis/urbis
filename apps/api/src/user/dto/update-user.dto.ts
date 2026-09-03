import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserStatus } from 'user/enums/user-status.enum';
import { IsValidBirthDate } from '../../common/utils/validators/is-valid-birth-date.validator';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @MinLength(8)
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus = UserStatus.ACTIVE;

  @ApiPropertyOptional()
  @IsOptional()
  govBrData?: any;

  @ApiPropertyOptional()
  @IsOptional()
  lastGovBrLoginAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  govBrFirstLoginAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  socialName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  digitalAddress?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsValidBirthDate({ message: 'invalid' })
  birthDate?: string;

  @ApiProperty({ example: 'fisica_capaz' })
  @IsNotEmpty()
  accountType: string;

  @ApiProperty()
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({
    description: 'Justificativa para alteração de campos sensíveis',
  })
  @IsOptional()
  @IsString()
  sensitiveChangeJustification?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  sensitiveChangeAttachments?: string[];
}
