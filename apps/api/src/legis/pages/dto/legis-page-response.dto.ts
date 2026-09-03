import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LegisUserSummaryDto } from '../../shared/dto/legis-user-summary.dto';
import { LegisPage } from '../entities';

/**
 * Wire shape of a Legis page. It keeps every persisted column and adds the
 * hydrated people (`authorUser`, `createdByUser`, `updatedByUser`) so clients
 * never have to render a raw uuid or guess a name from the free-text label.
 */
export class LegisPageResponseDto extends LegisPage {
  @ApiPropertyOptional({
    type: LegisUserSummaryDto,
    nullable: true,
    description:
      'Author resolved from `authorId`. Null for imported or legacy content without a matching system user.',
  })
  authorUser?: LegisUserSummaryDto | null;

  @ApiPropertyOptional({ type: LegisUserSummaryDto, nullable: true })
  createdByUser?: LegisUserSummaryDto | null;

  @ApiPropertyOptional({ type: LegisUserSummaryDto, nullable: true })
  updatedByUser?: LegisUserSummaryDto | null;
}

export class PaginatedLegisPagesDto {
  @ApiProperty({ type: [LegisPageResponseDto] })
  items: LegisPageResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
