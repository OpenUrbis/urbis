import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserStatus } from 'user/enums/user-status.enum';

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
  cpf?: string;

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
}
