import React from "react";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { OriginalNormativo } from "../../domain/entities";
import { useAuthorities } from "@/contexts/authorities-context";
import {
  getAuthorityFullLabel,
  getAuthorityShortLabel,
  getNormativeTypeLabel,
  getNormativeYear,
} from "../../domain/normative-labels";

interface NormativeListHeaderProps {
  doc: OriginalNormativo;
  showLink?: boolean;
  elementIds?: string[];
}

export function NormativeListHeader({
  doc,
  showLink = true,
  elementIds,
}: NormativeListHeaderProps) {
  const { getAuthorityById } = useAuthorities();
  const authority = React.useMemo(
    () => getAuthorityById(doc.authorityId),
    [doc.authorityId, getAuthorityById],
  );

  const structuralContext = React.useMemo(() => {
    if (!elementIds || elementIds.length === 0 || !doc.elements) return null;

    const firstId = elementIds[0];
    const elements = doc.elements;
    const firstIdx = elements.findIndex((el) => el.id === firstId);
    if (firstIdx === -1) return null;

    // Collect parents (structural elements: Parte, Livro, Título, Capítulo, Seção, Subseção, Artigo)
    const parents: string[] = [];
    const levels: Record<string, number> = {
      Parte: 0,
      Livro: 1,
      Título: 2,
      Capítulo: 3,
      Seção: 4,
      Subseção: 5,
      Artigo: 6,
    };

    let currentMaxLevel =
      levels[elements[firstIdx].type as keyof typeof levels] ?? 99;

    for (let i = firstIdx - 1; i >= 0; i--) {
      const el = elements[i];
      const level = levels[el.type as keyof typeof levels];
      if (level !== undefined && level < currentMaxLevel) {
        let label = `${el.type} ${el.index || ""}`;
        if (el.type === "Artigo") label = `Art. ${el.index || ""}`;
        parents.unshift(label);
        currentMaxLevel = level;
      }
    }

    return parents.length > 0 ? parents.join(" > ") : null;
  }, [doc, elementIds]);

  const normativeTypeLabel = getNormativeTypeLabel(doc.normativeType);
  const authorityShortLabel = getAuthorityShortLabel(authority);
  const authorityFullLabel = getAuthorityFullLabel(authority);
  const normativeYear = getNormativeYear(doc.actDate || doc.publicationDate);
  const normativeDate = doc.actDate?.trim() || doc.publicationDate?.trim();
  const normativeDescriptor = doc.name?.trim() || doc.ementa?.trim();

  return (
    <div className="mb-4 pl-2 border-b pb-2">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 space-y-1">
          <div className="text-sm md:text-base font-semibold leading-relaxed text-foreground">
            {authority ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help underline decoration-dotted underline-offset-4">
                      {authorityShortLabel}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[320px] p-3 space-y-2">
                    <div>
                      <span className="font-medium text-xs text-muted-foreground block">
                        Nome por extenso
                      </span>
                      <span>{authorityFullLabel}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : doc.authorityId ? (
              <span>{doc.authorityId}</span>
            ) : null}

            {(authorityShortLabel || doc.authorityId) && <span>. </span>}

            <span>{normativeTypeLabel}</span>

            {doc.number?.trim() ? (
              <span>
                {" "}
                nº {doc.number.trim()}
                {normativeYear && `/${normativeYear}`}
              </span>
            ) : normativeDate ? (
              <span> de {normativeDate}</span>
            ) : null}

            {normativeDescriptor && (
              <span className="font-normal text-muted-foreground">
                {" "}
                {`(“${normativeDescriptor}”)`}
              </span>
            )}
          </div>

          {structuralContext && (
            <div className="text-[10px] text-muted-foreground">
              {structuralContext}
            </div>
          )}
        </div>

        {showLink && (
          <Link href={`/pages/${doc.id}`}>
            <a
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Abrir Original Normativo"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </Link>
        )}
      </div>
    </div>
  );
}
