import { UserStatus } from 'user/enums/user-status.enum';
import {
  UNKNOWN_LEGIS_USER_NAME,
  buildLegisUserDisplayName,
  buildLegisUserInitials,
  toLegisUserSummary,
} from './legis-user-summary.dto';

describe('buildLegisUserDisplayName', () => {
  it('prefers the social name over the registry name', () => {
    expect(
      buildLegisUserDisplayName({
        id: 'user-1',
        socialName: 'Ana Prado',
        firstName: 'Antonio',
        lastName: 'Prado',
      }),
    ).toBe('Ana Prado');
  });

  it('joins first and last name', () => {
    expect(
      buildLegisUserDisplayName({
        id: 'user-1',
        firstName: 'Maria',
        lastName: 'Silva',
      }),
    ).toBe('Maria Silva');
  });

  it('tolerates a half-filled profile', () => {
    expect(
      buildLegisUserDisplayName({ id: 'user-1', firstName: '  Maria  ' }),
    ).toBe('Maria');
  });

  it('falls back to the e-mail when there is no name', () => {
    expect(
      buildLegisUserDisplayName({ id: 'user-1', email: 'maria@sp.gov.br' }),
    ).toBe('maria@sp.gov.br');
  });

  it('never returns an empty label', () => {
    expect(buildLegisUserDisplayName({ id: 'user-1' })).toBe(
      UNKNOWN_LEGIS_USER_NAME,
    );
  });
});

describe('buildLegisUserInitials', () => {
  it('uses the first and last words', () => {
    expect(buildLegisUserInitials('Maria de Souza Silva')).toBe('MS');
  });

  it('uses a single initial for a single word', () => {
    expect(buildLegisUserInitials('Maria')).toBe('M');
  });

  it('falls back to a placeholder when there is nothing to initial', () => {
    expect(buildLegisUserInitials('   ')).toBe('?');
  });
});

describe('toLegisUserSummary', () => {
  it('exposes the label and the raw columns together', () => {
    expect(
      toLegisUserSummary({
        id: 'user-1',
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@sp.gov.br',
        avatarUrl: 'https://cdn/avatar.png',
        status: UserStatus.ACTIVE,
      }),
    ).toEqual({
      id: 'user-1',
      name: 'Maria Silva',
      firstName: 'Maria',
      lastName: 'Silva',
      socialName: null,
      email: 'maria@sp.gov.br',
      avatarUrl: 'https://cdn/avatar.png',
      initials: 'MS',
      isActive: true,
    });
  });

  /* Removed accounts must keep naming the author of historical Legis content. */
  it('still names a removed account, but marks it inactive', () => {
    const summary = toLegisUserSummary({
      id: 'user-1',
      firstName: 'Maria',
      lastName: 'Silva',
      deletedAt: new Date('2024-01-01'),
    });

    expect(summary.name).toBe('Maria Silva');
    expect(summary.isActive).toBe(false);
  });

  it('marks a deactivated account as inactive', () => {
    expect(
      toLegisUserSummary({
        id: 'user-1',
        firstName: 'Maria',
        status: UserStatus.INACTIVE,
      }).isActive,
    ).toBe(false);
  });
});
