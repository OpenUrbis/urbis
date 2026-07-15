import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Validate,
} from 'class-validator';
import { IsNotExist } from './../../common/utils/validators/is-not-exists.validator';
import { Transform } from 'class-transformer';
import { IsCountryCode } from './validators/isCountry.validator';
import { IsCPF } from '../../common/utils/validators/is-cpf.validator';

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(({ value }) => value.toLowerCase().trim())
  @Validate(IsNotExist, ['User'], {
    message: 'alreadyExists',
  })
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({ example: 'BR' })
  @IsCountryCode()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: '+554599900000' })
  @IsOptional()
  phone?: string;

  @ApiProperty()
  @IsOptional()
  socialName?: string;

  @ApiProperty()
  @IsOptional()
  address?: string;

  @ApiProperty()
  @IsOptional()
  digitalAddress?: string;

  @ApiProperty()
  @IsOptional()
  termsAccepted?: string[];

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '111.444.777-35' })
  @IsCPF({ message: 'invalid' })
  @Validate(IsNotExist, ['User'], {
    message: 'alreadyExists',
  })
  cpf: string;

  @ApiProperty()
  @IsOptional()
  govBrData?: any;

  @ApiProperty()
  @IsOptional()
  lastGovBrLoginAt?: Date;

  @ApiProperty()
  @IsOptional()
  govBrFirstLoginAt?: Date;

  @ApiProperty()
  @IsOptional()
  avatarUrl?: string;
}
