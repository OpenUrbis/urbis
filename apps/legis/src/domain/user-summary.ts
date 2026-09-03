/**
 * Um usuário do sistema, do jeito que o Legis precisa exibi-lo.
 *
 * O backend resolve o `userId` guardado em `authorId`/`createdBy`/`updatedBy` e
 * devolve este resumo já com `name` e `initials` calculados, para que autor,
 * criador e último editor apareçam iguais em todas as telas.
 */
export interface UserSummary {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  socialName?: string;
  email?: string;
  avatarUrl?: string;
  initials: string;
  /** `false` quando a conta foi desativada ou removida. */
  isActive: boolean;
}

/** Forma crua vinda da API (campos anuláveis). */
export type UserSummaryPayload = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  socialName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  initials?: string | null;
  isActive?: boolean | null;
};

export const UNKNOWN_USER_NAME = "Usuário não identificado";

const ACCOUNTS_URL = (
  import.meta.env.VITE_ACCOUNTS_URL ||
  "https://conta.urbis.prefeitura.sp.gov.br"
).replace(/\/+$/, "");

const buildDisplayName = (user: UserSummaryPayload) => {
  const socialName = user.socialName?.trim();
  if (socialName) return socialName;

  const fullName = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  if (fullName) return fullName;

  return user.email?.trim() || UNKNOWN_USER_NAME;
};

export const getUserInitials = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => /\p{L}|\p{N}/u.test(word));

  if (!words.length) return "?";

  const first = words[0];
  const last = words.length > 1 ? words[words.length - 1] : "";

  return `${first.charAt(0)}${last.charAt(0)}`.toLocaleUpperCase("pt-BR");
};

/**
 * Normaliza o resumo da API. Os rótulos são recalculados quando ausentes para
 * que respostas antigas (ou payloads parciais) continuem exibíveis.
 */
export const mapUserSummary = (
  user?: UserSummaryPayload | null,
): UserSummary | undefined => {
  if (!user?.id) return undefined;

  const name = user.name?.trim() || buildDisplayName(user);

  return {
    id: user.id,
    name,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    socialName: user.socialName ?? undefined,
    email: user.email ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    initials: user.initials?.trim() || getUserInitials(name),
    isActive: user.isActive ?? true,
  };
};

/**
 * Rótulo de exibição. O usuário vinculado tem prioridade sobre o texto livre
 * salvo na página, que envelhece quando a pessoa renomeia a conta.
 */
export const getUserDisplayName = (
  user?: UserSummary | null,
  fallbackLabel?: string,
) => user?.name || fallbackLabel?.trim() || UNKNOWN_USER_NAME;

/** Perfil na aplicação de contas, para auditoria. */
export const buildUserProfileUrl = (userId?: string | null) =>
  userId ? `${ACCOUNTS_URL}/users/edit/${userId}` : undefined;
