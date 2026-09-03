import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateLegisAuthorityDto } from './create-legis-authority.dto';

export class UpdateLegisAuthorityDto extends PartialType(
  OmitType(CreateLegisAuthorityDto, ['id'] as const),
) {}
