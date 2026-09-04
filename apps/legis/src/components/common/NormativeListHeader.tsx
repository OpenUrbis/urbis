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
}: NormativeListHeaderProps) {
  const { getAuthorityById } = useAuthorities();
  const authority = React.useMemo(
    () => getAuthorityById(doc.authorityId),
    [doc.authorityId, getAuthorityById],
  );

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
