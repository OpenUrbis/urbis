import { ApiPropertyOptional } from '@nestjs/swagger';
import { LegisUserSummaryDto } from '../../shared/dto/legis-user-summary.dto';
import { LegisAuthority } from '../entities';

/**
 * Wire shape of a Legis authority: the persisted columns plus the hydrated
 * people behind `createdBy`/`updatedBy`, so the audit panel shows names instead
 * of uuids.
 */
export class LegisAuthorityResponseDto extends LegisAuthority {
  @ApiPropertyOptional({ type: LegisUserSummaryDto, nullable: true })
  createdByUser?: LegisUserSummaryDto | null;

  @ApiPropertyOptional({ type: LegisUserSummaryDto, nullable: true })
  updatedByUser?: LegisUserSummaryDto | null;
}
