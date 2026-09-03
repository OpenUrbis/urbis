import React, { useState } from "react";
import { cn } from "@open-urbis/map-ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  SituationGroup,
  GROUP_TITLES,
  getIconForType,
  withSpecialSituationCompatibilityFields,
} from "./SituationLogic";
import {
  getSituationPresentation,
  type SituationPresentation,
  type SituationTone,
} from "./situation-presentation";
import type { PageReference } from "../../domain/page-reference";
import { elementAnchorHref } from "../../lib/element-anchor";

const TONE_ACCENT: Record<SituationTone, string> = {
  negative: "border-l-destructive/60",
  positive: "border-l-amber-500/70",
  informative: "border-l-sky-500/70",
  neutral: "border-l-border",
};

/**
 * Tone of the quoted passage. The signal is carried by the edge and the text
 * colour only: a filled block would read as decoration next to the norm.
 */
const TONE_EXCERPT: Record<SituationTone, string> = {
  negative: "border-l-destructive/60 text-destructive",
  positive: "border-l-amber-500/70 text-amber-800 dark:text-amber-200",
  informative: "border-l-sky-500/70 text-sky-800 dark:text-sky-200",
  neutral: "border-l-border text-foreground",
};


interface SituationCardProps {
  group: SituationGroup;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  /**
   * Resolves a normative element id into a readable reference. Without it a raw
   * identifier would be shown to the reader.
   */
  resolveDeviceLabel?: (elementId: string) => string | undefined;
  /**
   * Resolves a document id into a readable, openable reference. Legacy records
   * often keep only the id of the amending act — without this the reader would
   * face something like "lei_revisao_zoneamento".
   */
  resolveDocument?: (documentId: string) => PageReference | undefined;
  documentDate?: string;
}

function cleanCitation(text: string): string {
  if (!text) return "";
  return text.replace(/^(\[\.\.\.\]|\[\u2026\]|\(\u2026\)\s*)+\s*/gi, "").trim();
}

function OriginLine({
  presentation,
  resolveDeviceLabel,
  resolveDocument,
}: {
  presentation: SituationPresentation;
  resolveDeviceLabel?: (elementId: string) => string | undefined;
  resolveDocument?: (documentId: string) => PageReference | undefined;
}) {
  const [expandedCitation, setExpandedCitation] = useState(false);
  const origin = presentation.origin;
  if (!origin) return null;

  const resolvedDevice = origin.deviceId
    ? resolveDeviceLabel?.(origin.deviceId)
    : undefined;
  const deviceText = origin.deviceLabel || resolvedDevice;

  /*
   * Registros antigos gravaram o id do ato de origem em `relatedDeviceId`, no
   * lugar de um dispositivo deste documento. Quando o id não é daqui, ele é
   * tratado como documento — é o que ele de fato é.
   */
  const documentRef =
    (origin.documentId ? resolveDocument?.(origin.documentId) : undefined) ??
    (!resolvedDevice && origin.deviceId
      ? resolveDocument?.(origin.deviceId)
      : undefined);

  const documentText = origin.documentLabel || documentRef?.label;
  const readable = [documentText, deviceText].filter(Boolean).join(" · ");
  const identifier = origin.documentId || origin.deviceId;

  if (!readable && !identifier) return null;

  // Sem nada legível, o leitor recebe uma frase e o id fica no tooltip: mostrar
  // "lei_revisao_zoneamento" na página só expõe o modelo de dados.
  const body = readable || "documento não identificado";
  const isUnresolved = !readable;

  // Dispositivo deste documento âncora na própria página; origem externa abre a
  // página do ato. Sem alvo real, nada de link morto.
  const anchor =
    resolvedDevice && origin.deviceId
      ? elementAnchorHref(origin.deviceId)
      : documentRef?.href;
  const tooltip = isUnresolved
    ? `Identificador de origem: ${identifier}`
    : [documentRef?.title, identifier].filter(Boolean).join(" — ") || undefined;

  const sharedClassName = cn(
    "min-w-0 break-words text-foreground",
    isUnresolved && "italic text-muted-foreground",
  );

  return (
    <div className="space-y-0.5">
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
        <span className="shrink-0">Origem:</span>
        {anchor ? (
          <a
            href={anchor}
            className={cn(
              sharedClassName,
              "underline decoration-dotted underline-offset-2 hover:decoration-solid",
            )}
            title={tooltip}
          >
            {body}
          </a>
        ) : (
          <span className={sharedClassName} title={tooltip}>
            {body}
          </span>
        )}
      </div>

      {origin.citation && (
        <div className="space-y-0.5">
          <blockquote
            className={cn(
              "border-l-2 border-border pl-1.5 text-[11px] italic leading-relaxed text-muted-foreground transition-all",
              !expandedCitation && "line-clamp-3",
            )}
          >
            {cleanCitation(origin.citation)}
          </blockquote>
          {cleanCitation(origin.citation).length > 100 && (
            <button
              type="button"
              className="text-[10px] font-medium text-primary hover:underline cursor-pointer"
              onClick={() => setExpandedCitation(!expandedCitation)}
            >
              {expandedCitation ? "Mostrar menos" : "Ver texto completo"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SituationEntry({
  presentation,
  resolveDeviceLabel,
  resolveDocument,
}: {
  presentation: SituationPresentation;
  resolveDeviceLabel?: (elementId: string) => string | undefined;
  resolveDocument?: (documentId: string) => PageReference | undefined;
}) {
  const [expandedExcerpt, setExpandedExcerpt] = useState(false);

  return (
    <div className={cn("border-l-2 pl-2.5 py-0.5 space-y-1 max-w-full min-w-0 break-words", TONE_ACCENT[presentation.tone])}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <span className="text-xs font-semibold leading-snug text-foreground">
          {presentation.title}
        </span>
        {presentation.dateLabel && (
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground font-medium">
            {presentation.dateLabel}
          </span>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {presentation.effect}
      </p>

      {presentation.excerpt && (
        <figure
          className={cn(
            "mt-1 border-l-2 pl-2 space-y-0.5",
            TONE_EXCERPT[presentation.tone],
          )}
        >
          <figcaption className="text-[10px] font-medium opacity-70">
            {presentation.excerpt.label}
          </figcaption>
          <blockquote
            className={cn(
              "text-[11px] leading-relaxed break-words",
              presentation.excerpt.struck &&
                "line-through decoration-current/50",
              !expandedExcerpt && "line-clamp-3",
            )}
          >
            {presentation.excerpt.text}
          </blockquote>
          {presentation.excerpt.text.length > 100 && (
            <button
              type="button"
              className="text-[10px] font-medium text-primary hover:underline cursor-pointer block"
              onClick={() => setExpandedExcerpt(!expandedExcerpt)}
            >
              {expandedExcerpt ? "Mostrar menos" : "Ver trecho completo"}
            </button>
          )}
        </figure>
      )}

      {presentation.details.map((detail) => (
        <div
          key={detail.label}
          className="text-[11px] text-muted-foreground"
        >
          <span>{detail.label}: </span>
          <span className="font-medium text-foreground">{detail.value}</span>
        </div>
      ))}

      <div className="pt-0.5">
        <OriginLine
          presentation={presentation}
          resolveDeviceLabel={resolveDeviceLabel}
          resolveDocument={resolveDocument}
        />
      </div>
    </div>
  );
}

function getGroupDisplayTitle(group: SituationGroup): string {
  return GROUP_TITLES[group.type] || "Situação especial";
}

export function SituationCard({
  group,
  defaultExpanded,
  onToggle,
  resolveDeviceLabel,
  resolveDocument,
  documentDate,
}: SituationCardProps) {
  const count = group.situations.length;
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const displayTitle = getGroupDisplayTitle(group);

  const toggleExpand = () => {
    const nextState = !expanded;
    setExpanded(nextState);
    if (onToggle) {
      // Let the DOM settle before the caller measures anything.
      setTimeout(() => onToggle(nextState), 50);
    }
  };

  return (
    <section
      id={`card-${group.id}`}
      className="mb-3 border-b pb-2 text-left last:border-b-0 max-w-full overflow-hidden"
      aria-label={displayTitle}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 py-1 text-left text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        onClick={toggleExpand}
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-foreground">
          {getIconForType(group.type)}
          <span className="truncate">{displayTitle}</span>
          {count > 1 && (
            <span className="shrink-0 text-[10px] font-normal tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </span>
        <span className="shrink-0" aria-hidden="true">
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="space-y-3 pt-1">
          {group.situations.map((situation, index) => (
            <SituationEntry
              key={`${situation.type}-${situation.date ?? index}-${index}`}
              presentation={getSituationPresentation(
                withSpecialSituationCompatibilityFields(situation),
                documentDate,
              )}
              resolveDeviceLabel={resolveDeviceLabel}
              resolveDocument={resolveDocument}
            />
          ))}
        </div>
      )}
    </section>
  );
}
