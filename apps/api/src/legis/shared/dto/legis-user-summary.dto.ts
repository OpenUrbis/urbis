import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from 'user/enums/user-status.enum';

/**
 * Everything Legis needs to render a person: the plain columns plus the derived
 * `name`/`initials` labels, so every client (page header, result card, audit
 * panel) shows the same person the same way instead of re-deriving a label from
 * a raw uuid.
 */
export class LegisUserSummaryDto {
  @ApiProperty({ description: 'System user id (users.id).' })
  id: string;

  @ApiProperty({
    description:
      'Best available display name: social name, full name, e-mail, or a neutral fallback.',
    example: 'Maria Silva',
  })
  name: string;

  @ApiPropertyOptional()
  firstName?: string | null;

  @ApiPropertyOptional()
  lastName?: string | null;

  @ApiPropertyOptional()
  socialName?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'Uppercase initials, ready for avatar fallbacks.',
    example: 'MS',
  })
  initials: string;

  @ApiProperty({
    description:
      'False when the account is inactive or was removed. The summary is still returned so audit trails keep a readable name.',
  })
  isActive: boolean;
}

/** Subset of `User` the summary is built from, so callers may select only these columns. */
export type LegisUserSummarySource = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  socialName?: string | null;
  avatarUrl?: string | null;
  status?: UserStatus | null;
  deletedAt?: Date | null;
};

export const UNKNOWN_LEGIS_USER_NAME = 'Usuário não identificado';

export const buildLegisUserDisplayName = (
  user: LegisUserSummarySource,
): string => {
  const socialName = user.socialName?.trim();
  if (socialName) {
    return socialName;
  }

  const fullName = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  if (fullName) {
    return fullName;
  }

  return user.email?.trim() || UNKNOWN_LEGIS_USER_NAME;
};

export const buildLegisUserInitials = (name: string): string => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => /\p{L}|\p{N}/u.test(word));

  if (!words.length) {
    return '?';
  }

  const first = words[0];
  const last = words.length > 1 ? words[words.length - 1] : '';

  return `${first.charAt(0)}${last.charAt(0)}`.toLocaleUpperCase('pt-BR');
};

export const toLegisUserSummary = (
  user: LegisUserSummarySource,
): LegisUserSummaryDto => {
  const name = buildLegisUserDisplayName(user);

  return {
    id: user.id,
    name,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    socialName: user.socialName ?? null,
    email: user.email ?? null,
    avatarUrl: user.avatarUrl ?? null,
    initials: buildLegisUserInitials(name),
    isActive: !user.deletedAt && user.status !== UserStatus.INACTIVE,
  };
};
