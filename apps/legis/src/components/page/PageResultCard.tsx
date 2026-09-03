import React, { useMemo } from "react";
import { Link } from "wouter";
import {
  Badge,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@open-urbis/map-ui";
import {
  Book,
  Calendar,
  Edit,
  FileText,
  Layers,
  Link as LinkIcon,
  Lock,
  RotateCcw,
  Scale,
  Trash2,
} from "lucide-react";
import { Page } from "../../types/page";
import { ColetaneaTematica, OriginalNormativo } from "../../domain/entities";
import { htmlToPlainText } from "../../domain/text-utils";
import { getElementKey } from "../../domain/display-logic";
import { useAuthorities } from "@/contexts/authorities-context";
import { UserChip } from "@/components/common/UserChip";
import { getExcerpt } from "@/lib/content";
import {
  HighlightedText,
  SNIPPET_HIGHLIGHT_CLASS,
  extractMatchedTerms,
} from "@/lib/search-highlight";
import { elementAnchorHref } from "@/lib/element-anchor";
import {
  formatNormativeDate,
  getAuthorityFullLabel,
  getAuthorityShortLabel,
  getNormativeDesignation,
} from "../../domain/normative-labels";

export interface PageResultMatch {
  field: string;
  snippet: string;
  elementId?: string;
}

interface PageResultCardProps {
  page: Page;
  matches?: PageResultMatch[];
  viewMode: "grid" | "list";
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (event: React.MouseEvent) => void;
  onDelete?: (event: React.MouseEvent) => void;
  onRestore?: (event: React.MouseEvent) => void;
  onPermanentDelete?: (event: React.MouseEvent) => void;
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType }> = {
  original_normativo: { label: "Original normativo", icon: Scale },
  coletanea_tematica: { label: "Coletânea temática", icon: Book },
};

/** Campos que o backend devolve e que já têm lugar próprio no card. */
const FIELD_TITLE = "Título";
const FIELD_CONTENT = "Conteúdo";
const FIELD_EMENTA = "Ementa";

const formatShortDate = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toLocaleDateString("pt-BR");
};

export function PageResultCard({
  page,
  matches = [],
  viewMode,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
}: PageResultCardProps) {
  const { getAuthorityById } = useAuthorities();

  const isGrid = viewMode === "grid";
  const normative =
    page.type === "original_normativo"
      ? (page.entity as OriginalNormativo | undefined)
      : undefined;
  const coletanea =
    page.type === "coletanea_tematica"
      ? (page.entity as ColetaneaTematica | undefined)
      : undefined;

  const typeMeta = TYPE_META[page.type] ?? { label: "Página", icon: FileText };
  const TypeIcon = typeMeta.icon;

  const authority = normative
    ? getAuthorityById(normative.authorityId)
    : undefined;
  const authorityShortLabel = getAuthorityShortLabel(authority);
  const authorityFullLabel = getAuthorityFullLabel(authority);
  const normativeDesignation = normative
    ? getNormativeDesignation(normative)
    : "";
  const normativeDate = normative
    ? formatNormativeDate(normative.actDate || normative.publicationDate)
    : "";

  const normalizedTitle = page.title.trim().toLowerCase();
  // A normalização do serviço pode replicar o título em `ementa`/`theme`; evita repetição visual.
  const isSameAsTitle = (value?: string) =>
    !!value && value.trim().toLowerCase() === normalizedTitle;

  const ementa = normative?.ementa?.trim();
  const shortDescription = coletanea?.shortDescription?.trim();
  const theme = isSameAsTitle(coletanea?.theme)
    ? ""
    : (coletanea?.theme?.trim() ?? "");

  const summaryLabel =
    !isSameAsTitle(ementa) && ementa
      ? "Ementa"
      : shortDescription
        ? "Resumo"
        : "Prévia";
  const summary =
    (!isSameAsTitle(ementa) ? ementa : "") ||
    shortDescription ||
    (page.content ? getExcerpt(page.content, isGrid ? 320 : 420) : "");

  const visibleTags = page.tags?.slice(0, isGrid ? 2 : 4) ?? [];

  /*
   * O backend devolve uma ocorrência por campo (título, ementa, conteúdo e cada
   * dispositivo). Título e ementa já aparecem no card, então em vez de repetir o
   * texto numa lista os termos são realçados no próprio lugar; do restante mostramos
   * apenas a primeira ocorrência, com a chave do dispositivo como no documento.
   */
  const terms = useMemo(() => extractMatchedTerms(matches), [matches]);

  const elementMatch = matches.find((match) => match.elementId);
  const contentMatch = matches.find(
    (match) => match.field === FIELD_CONTENT && !match.elementId,
  );
  const excerptMatch = elementMatch ?? contentMatch;
  const hasOwnPlaceMatch = matches.some(
    (match) => match.field === FIELD_TITLE || match.field === FIELD_EMENTA,
  );
  const showExcerptMatch =
    !!excerptMatch && (!!elementMatch || !hasOwnPlaceMatch);

  const matchedElement = useMemo(() => {
    if (!elementMatch?.elementId) return undefined;
    return normative?.elements?.find(
      (element) => element.id === elementMatch.elementId,
    );
  }, [elementMatch?.elementId, normative?.elements]);

  const excerptKey = matchedElement
    ? getElementKey(matchedElement).trim()
    : (elementMatch?.field ?? "");

  /*
   * A busca sabe qual dispositivo casou com os termos: o resultado abre nele, e
   * não no topo de um ato de duzentos artigos. Só quando o dispositivo existe
   * mesmo no documento carregado — âncora sem alvo não leva a lugar nenhum.
   */
  const href = `/pages/${page.id}${matchedElement ? elementAnchorHref(matchedElement.id) : ""}`;

  return (
    <Link
      href={href}
      className={cn(
        "block",
        isGrid && "h-full",
        page.deletedAt && "opacity-75 bg-muted/10",
      )}
    >
      <article
        className={cn(
          "group relative cursor-pointer transition-colors",
          isGrid
            ? "flex h-full flex-col border p-4 hover:border-foreground/30 hover:bg-muted/20"
            : "flex flex-col gap-2 border-b px-1 py-4 hover:bg-muted/20",
        )}
      >
        {/* Classificação + ações */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="gap-1 font-normal text-muted-foreground"
            >
              <TypeIcon className="h-3 w-3" />
              {typeMeta.label}
            </Badge>
            {coletanea?.collectionType && (
              <Badge
                variant="outline"
                className="font-normal text-muted-foreground"
              >
                {coletanea.collectionType}
              </Badge>
            )}
            {!page.isPublic && (
              <Badge
                variant="outline"
                className="gap-1 font-normal text-muted-foreground"
              >
                <Lock className="h-3 w-3" />
                Privada
              </Badge>
            )}
            {page.deletedAt && (
              <Badge
                variant="destructive"
                className="gap-1 font-normal bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50"
              >
                Excluído
              </Badge>
            )}
          </div>

          {(canEdit || canDelete || page.deletedAt) && (
            <div className="-mr-1 -mt-1 flex shrink-0 gap-0.5">
              {page.deletedAt ? (
                <>
                  {onRestore && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      title="Restaurar página"
                      aria-label="Restaurar página"
                      onClick={onRestore}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {(onPermanentDelete || onDelete) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      title="Deletar em definitivo"
                      aria-label="Deletar em definitivo"
                      onClick={onPermanentDelete ?? onDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Editar"
                      aria-label="Editar página"
                      onClick={onEdit}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Excluir"
                      aria-label="Excluir página"
                      onClick={onDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Referência normativa (padrão Legis) */}
        {normative && (normativeDesignation || authorityShortLabel) && (
          <div className="mt-2 text-sm font-semibold leading-relaxed text-foreground">
            {authorityShortLabel && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help underline decoration-dotted underline-offset-4">
                      {authorityShortLabel}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[320px] p-3">
                    <span className="block text-xs font-medium text-muted-foreground">
                      Nome por extenso
                    </span>
                    <span>{authorityFullLabel}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {authorityShortLabel && normativeDesignation && <span>. </span>}
            <span>{normativeDesignation}</span>
          </div>
        )}

        {/* Título */}
        <h3
          className={cn(
            "font-medium leading-snug text-foreground transition-colors group-hover:text-primary",
            normative ? "mt-1" : "mt-2",
            isGrid ? "text-base line-clamp-2" : "text-lg",
          )}
        >
          <HighlightedText text={page.title} terms={terms} />
        </h3>

        {/* Complementos de identificação */}
        {(normativeDate || theme) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {theme && <span className="truncate">Tema: {theme}</span>}
            {theme && normativeDate && <span aria-hidden="true">·</span>}
            {normativeDate && <span>{normativeDate}</span>}
          </div>
        )}

        {/* Ementa / Resumo / Prévia */}
        {summary && (
          <div className="mt-3 border-l pl-3">
            <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
              {summaryLabel}
            </span>
            <p
              className={cn(
                "text-sm leading-relaxed text-muted-foreground",
                isGrid ? "line-clamp-4" : "line-clamp-3 text-justify",
              )}
            >
              <HighlightedText text={htmlToPlainText(summary)} terms={terms} />
            </p>
          </div>
        )}

        {/* Primeira ocorrência em dispositivo, exibida como no documento */}
        {showExcerptMatch && excerptMatch && (
          <div className="mt-3 border-l pl-3">
            <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Trecho
            </span>
            <p
              className={cn(
                "font-serif text-sm leading-relaxed text-muted-foreground",
                isGrid ? "line-clamp-3" : "line-clamp-2 text-justify",
              )}
            >
              {excerptKey && (
                <span className="font-medium text-foreground">
                  {excerptKey}{" "}
                </span>
              )}
              <span
                className={SNIPPET_HIGHLIGHT_CLASS}
                dangerouslySetInnerHTML={{ __html: excerptMatch.snippet }}
              />
            </p>
          </div>
        )}

        {/* Metadados */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground",
            isGrid ? "mt-auto pt-3" : "mt-3",
          )}
        >
          <UserChip
            user={page.authorUser}
            fallbackLabel={page.author}
            size="sm"
            className="max-w-[140px]"
          />
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatShortDate(page.updatedAt)}</span>
          </span>
          {normative?.elements?.length ? (
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span>{normative.elements.length} elementos</span>
            </span>
          ) : null}
          {coletanea?.links?.length ? (
            <span className="flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              <span>{coletanea.links.length} vínculos</span>
            </span>
          ) : null}
          {visibleTags.length > 0 && (
            <span className="flex min-w-0 flex-wrap items-center gap-1">
              {visibleTags.map((tag) => (
                <span key={tag} className="truncate">
                  #{tag}
                </span>
              ))}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
