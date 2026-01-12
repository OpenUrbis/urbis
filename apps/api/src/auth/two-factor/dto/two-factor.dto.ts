import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class TwoFactorDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}
