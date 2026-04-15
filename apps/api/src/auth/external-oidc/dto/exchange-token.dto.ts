import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExchangeTokenDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  redirect_uri: string;

  @IsString()
  @IsOptional()
  code_verifier?: string;
}
