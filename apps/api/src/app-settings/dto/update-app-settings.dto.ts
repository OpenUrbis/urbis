import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';

class OrganizationAppSettingsDto {
  @IsNotEmpty()
  @IsBoolean()
  allowUserCreation: boolean;
}

export class UpdateAppSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationAppSettingsDto)
  organizations: OrganizationAppSettingsDto;
}
