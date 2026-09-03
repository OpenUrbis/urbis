import React, { useState } from "react";
import { ExternalLink, User } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@open-urbis/map-ui";
import {
  buildUserProfileUrl,
  getUserDisplayName,
  type UserSummary,
} from "@/domain/user-summary";

export interface UserChipProps {
  /** Usuário resolvido pela API a partir do id do sistema. */
  user?: UserSummary;
  /** Rótulo salvo na página, usado quando não há usuário vinculado. */
  fallbackLabel?: string;
  /** Exibido quando não há usuário nem rótulo. */
  emptyLabel?: string;
  size?: "sm" | "md";
  showAvatar?: boolean;
  /** Link para o perfil na aplicação de contas, útil em painéis de auditoria. */
  showProfileLink?: boolean;
  className?: string;
}

const AVATAR_CLASS = {
  sm: "h-4 w-4 text-[8px]",
  md: "h-5 w-5 text-[10px]",
} as const;

const ICON_CLASS = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
} as const;

/**
 * Exibe uma pessoa do sistema de forma idêntica em toda a aplicação: avatar,
 * nome resolvido e — sob demanda — o vínculo com a conta.
 *
 * O `fallbackLabel` cobre o conteúdo importado/legado, que tem apenas o texto
 * livre do autor e nenhum usuário vinculado.
 */
export function UserChip({
  user,
  fallbackLabel,
  emptyLabel = "Sem autor",
  size = "md",
  showAvatar = true,
  showProfileLink = false,
  className,
}: UserChipProps) {
  const [avatarError, setAvatarError] = useState(false);
  const hasIdentity = Boolean(user || fallbackLabel?.trim());
  const name = hasIdentity
    ? getUserDisplayName(user, fallbackLabel)
    : emptyLabel;
  const profileUrl = showProfileLink
    ? buildUserProfileUrl(user?.id)
    : undefined;

  const details = [
    user?.email,
    user && !user.isActive ? "Conta inativa ou removida" : undefined,
    !user && fallbackLabel?.trim()
      ? "Autoria registrada como texto, sem usuário vinculado"
      : undefined,
  ].filter(Boolean) as string[];

  const isGovBrOrValidAvatar =
    user?.avatarUrl &&
    (user.avatarUrl.includes("gov.br") ||
      user.avatarUrl.includes("govbr") ||
      user.avatarUrl.startsWith("http"));

  const label = (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      {showAvatar && (
        <span
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center rounded-full bg-muted/90 font-semibold text-muted-foreground overflow-hidden border border-border/50 select-none",
            AVATAR_CLASS[size],
          )}
        >
          {isGovBrOrValidAvatar && !avatarError ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setAvatarError(true)}
            />
          ) : user ? (
            <span className="font-semibold uppercase tracking-tighter text-[85%]">
              {user.initials}
            </span>
          ) : (
            <User className={cn("shrink-0 opacity-70", ICON_CLASS[size])} />
          )}
        </span>
      )}

      <span
        className={cn(
          "truncate",
          user && !user.isActive && "line-through decoration-1",
        )}
      >
        {name}
      </span>
    </span>
  );

  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
      {details.length ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="min-w-0 cursor-help">{label}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-0.5">
                <span className="block font-medium">{name}</span>
                {details.map((detail) => (
                  <span
                    key={detail}
                    className="block text-xs text-muted-foreground"
                  >
                    {detail}
                  </span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        label
      )}

      {profileUrl && (
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs hover:underline"
        >
          Abrir perfil <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </span>
  );
}
