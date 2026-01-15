import { IsEnum, IsHexColor, IsOptional } from 'class-validator';
import { ApplicationTheme } from '../enums/application-theme.enum';

export class UpdateWhitelabelDto {
  @IsOptional()
  @IsEnum(ApplicationTheme)
  theme?: ApplicationTheme;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;
}
