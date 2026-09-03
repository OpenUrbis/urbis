import React, { useEffect } from "react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from "@open-urbis/map-ui";
import { Link2, MousePointerClick, Scissors } from "lucide-react";
import type { ElementType, SpecialSituation } from "../../domain/entities";
import type { SpecialSituationType } from "../../domain/types";
import {
  buildRetainedExcerpt,
  normalizeAnnotatedTextSegments,
} from "../../domain/text-utils";
import { DatePartsInput } from "../common/DatePartsInput";
import {
  InspectorField,
  InspectorSection,
  InspectorView,
} from "./InspectorShell";
import { ui } from "./inspector-tokens";
import {
  SITUATION_TYPE_OPTION_GROUPS,
  canMarkSourceTrechos,
  getSituationTypeConfig,
  isSituationDraftValid,
  pruneSituationDraftForType,
} from "./situation-config";

const ELEMENT_TYPES: ElementType[] = [
  "Anexo",
  "Parte",
  "Livro",
  "Título",
  "Capítulo",
  "Seção",
  "Subseção",
  "Divisão desconforme",
  "Artigo",
  "Parágrafo",
  "Inciso",
  "Alínea",
  "Item",
  "Elemento desconforme",
  "Tabela",
  "Figura",
  "Mapa",
  "Nota",
  "Introdução de decisão judicial",
  "Ementa de decisão judicial",
  "Decisão judicial completa",
  "Texto",
];

export interface SituationFormViewProps {
  draft: Partial<SpecialSituation>;
  onChange: (draft: Partial<SpecialSituation>) => void;
  /** Present when editing an existing situation. */
  editingIndex: number | null;
  /** Number of elements the situation will be applied to (bulk). */
  targetCount: number;
  /** Readable reference of the element, e.g. "Art. 1º". */
  elementLabel?: string;
  /** Disabled when there is no single element to mark passages on. */
  canMarkTrechos: boolean;
  onOpenTrechos: () => void;
  /**
   * Readable reference of the linked source device, when its text is available
   * for marking. Absent means the source text is not loaded.
   */
  sourceLabel?: string;
  /** Text of the source device, so the resulting citation can be previewed. */
  sourceBaseText?: string;
  onOpenSourceTrechos: () => void;
  onOpenLink: () => void;
  onSubmit: () => void;
  onBack: () => void;
  onToggleCollapse?: () => void;
  documentValidityDate?: string;
}

export function SituationFormView({
  draft,
  onChange,
  editingIndex,
  targetCount,
  elementLabel,
  canMarkTrechos,
  onOpenTrechos,
  sourceLabel,
  sourceBaseText,
  onOpenSourceTrechos,
  onOpenLink,
  onSubmit,
  onBack,
  onToggleCollapse,
  documentValidityDate,
}: SituationFormViewProps) {
  const type = draft.type as SpecialSituationType | undefined;
  const config = getSituationTypeConfig(type);

  const isLinked = Boolean(
    draft.relatedDeviceId?.trim() ||
      draft.normativeElementId?.trim() ||
      draft.sourceDocumentId?.trim(),
  );
  const segments = normalizeAnnotatedTextSegments(draft.trechos);
  const sourceSegments = normalizeAnnotatedTextSegments(draft.sourceTrechos);
  const isEditing = editingIndex !== null;

  const patch = (changes: Partial<SpecialSituation>) =>
    onChange({ ...draft, ...changes });

  const handleTypeChange = (nextType: string) => {
    onChange(
      pruneSituationDraftForType(draft, nextType as SpecialSituationType),
    );
  };

  const excerptValue = config.excerptField
    ? draft[config.excerptField]
    : undefined;

  const originText = sourceBaseText
    ? buildRetainedExcerpt(sourceBaseText, sourceSegments)
    : sourceSegments
        .map((segment) => segment.selectedText)
        .filter(Boolean)
        .join(" […] ");

  useEffect(() => {
    if (config.supportsNewText && originText && draft.newText !== originText) {
      patch({ newText: originText });
    }
  }, [config.supportsNewText, originText, draft.newText]);

  const isValid = isSituationDraftValid(draft);

  const submitLabel = isEditing
    ? "Salvar"
    : targetCount > 1
      ? `Aplicar em ${targetCount}`
      : "Adicionar";

  return (
    <InspectorView
      title={isEditing ? "Editar situação" : "Nova situação"}
      subtitle={targetCount > 1 ? `${targetCount} elementos` : elementLabel}
      onBack={onBack}
      onToggleCollapse={onToggleCollapse}
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            className={ui.smallButton}
            onClick={onBack}
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={ui.smallButton}
            onClick={onSubmit}
            disabled={!isValid}
            title={
              !isValid
                ? "Vincule um dispositivo/elemento normativo para salvar a situação especial"
                : undefined
            }
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <InspectorSection>
        <InspectorField label="Tipo">
          <Select value={type} onValueChange={handleTypeChange}>
            <SelectTrigger className={ui.control}>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {SITUATION_TYPE_OPTION_GROUPS.map((group) => (
                <SelectGroup key={group.group}>
                  <SelectLabel className="text-[10px] font-normal text-muted-foreground">
                    {group.label}
                  </SelectLabel>
                  {group.types.map((optionType) => (
                    <SelectItem
                      key={optionType}
                      value={optionType}
                      className="text-[11px]"
                    >
                      {optionType}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </InspectorField>

        <InspectorField
          label={
            isLinked
              ? `${config.dateLabel} (do elemento vinculado)`
              : config.dateLabel
          }
          hint={config.helpText}
          action={
            !isLinked && documentValidityDate ? (
              <Button
                variant="ghost"
                size="sm"
                className={cn(ui.smallButton, "h-5 px-1 text-[10px]")}
                onClick={() => patch({ date: documentValidityDate })}
                title="Puxar a data de vigência/publicação do documento"
              >
                Usar data da norma
              </Button>
            ) : undefined
          }
        >
          <DatePartsInput
            value={draft.date}
            onChange={(date) => patch({ date: date || "" })}
            disabled={isLinked}
          />
        </InspectorField>
      </InspectorSection>

      {type && (
        <>
          <InspectorSection title="Origem">
            <Button
              variant="outline"
              size="sm"
              className={cn(ui.smallButton, "w-full justify-start")}
              onClick={onOpenLink}
            >
              <Link2 className="h-3 w-3" />
              {draft.dispositivo ||
                draft.sourceDocumentLabel ||
                "Vincular dispositivo"}
            </Button>

            {!isLinked && (
              <p className="text-[11px] font-medium text-destructive mt-1">
                É obrigatório vincular a situação especial a um elemento/dispositivo normativo.
              </p>
            )}

            {(draft.sourceDocumentLabel || draft.relatedDeviceId) && (
              <div className="rounded border px-1.5 py-1">
                {draft.sourceDocumentLabel && (
                  <div className={ui.text}>{draft.sourceDocumentLabel}</div>
                )}
                {draft.relatedDeviceId && (
                  <div className={cn(ui.mono, "text-muted-foreground")}>
                    {draft.relatedDeviceId}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(ui.smallButton, "mt-0.5 h-5 px-1 text-[10px]")}
                  onClick={() =>
                    patch({
                      sourceDocumentId: undefined,
                      sourceDocumentLabel: undefined,
                      relatedDeviceId: undefined,
                      normativeElementId: undefined,
                      dispositivo: undefined,
                      device: undefined,
                      sourceTrechos: undefined,
                    })
                  }
                >
                  Remover vínculo
                </Button>
              </div>
            )}

            {canMarkSourceTrechos(draft) && (
              <div className="space-y-1 rounded border px-1.5 py-1">
                <div className="flex items-center justify-between gap-1">
                  <span className={ui.label}>
                    Citação da origem
                    {sourceSegments.length > 0 && ` (${sourceSegments.length})`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(ui.smallButton, "h-5 px-1 text-[10px]")}
                    onClick={onOpenSourceTrechos}
                    disabled={!sourceLabel}
                    title={
                      sourceLabel
                        ? `Citar trechos de ${sourceLabel}`
                        : "Revincule o dispositivo para carregar o texto de origem"
                    }
                  >
                    <Scissors className="h-3 w-3" />
                    {sourceSegments.length ? "Ajustar" : "Citar trechos"}
                  </Button>
                </div>

                {sourceSegments.length > 0 && (
                  <p className={cn(ui.muted, "line-clamp-3 italic")}>
                    {sourceBaseText
                      ? buildRetainedExcerpt(sourceBaseText, sourceSegments)
                      : sourceSegments
                          .map((segment) => segment.selectedText)
                          .filter(Boolean)
                          .join(" […] ")}
                  </p>
                )}
              </div>
            )}
          </InspectorSection>

          {config.supportsTrechos && (
            <InspectorSection
              title={config.trechoLabel}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(ui.smallButton, "h-5 px-1 text-[10px]")}
                  onClick={onOpenTrechos}
                  disabled={!canMarkTrechos}
                  title={
                    canMarkTrechos
                      ? undefined
                      : "Selecione um único elemento para marcar trechos"
                  }
                >
                  <Scissors className="h-3 w-3" />
                  {segments.length ? "Ajustar" : "Marcar"}
                </Button>
              }
            >
              {segments.length > 0 && (
                <button
                  type="button"
                  className="w-full rounded border px-1.5 py-1 text-left hover:bg-muted/40"
                  onClick={onOpenTrechos}
                  disabled={!canMarkTrechos}
                >
                  <span className={cn(ui.label, "block")}>
                    {segments.length} {segments.length === 1 ? "trecho" : "trechos"}
                  </span>
                  <span
                    className={cn(ui.muted, "mt-0.5 line-clamp-3 block italic")}
                  >
                    {excerptValue ||
                      segments
                        .map((segment) => segment.selectedText)
                        .filter(Boolean)
                        .join(" […] ")}
                  </span>
                </button>
              )}
            </InspectorSection>
          )}

          {config.supportsNewText && (
            <InspectorSection
              title={config.newTextLabel}
              action={
                sourceLabel ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(ui.smallButton, "h-5 px-1 text-[10px]")}
                    onClick={onOpenSourceTrechos}
                    title="Selecionar o texto alterado dentro do dispositivo vinculado"
                  >
                    <Scissors className="h-3 w-3 mr-1" />
                    {sourceSegments.length ? "Ajustar texto alterado" : "Selecionar texto alterado"}
                  </Button>
                ) : undefined
              }
            >
              <Textarea
                value={draft.newText || originText || ""}
                readOnly={Boolean(isLinked && (originText || sourceBaseText))}
                onChange={(event) => patch({ newText: event.target.value })}
                className="min-h-20 text-[11px] bg-muted/30"
                placeholder="Vincule um dispositivo para carregar o texto da nova redação"
              />
            </InspectorSection>
          )}

          {config.supportsRenumbering && (
            <InspectorSection title="Renumeração">
              <InspectorField label="Novo índice">
                <Input
                  value={draft.newIndex || ""}
                  onChange={(event) => patch({ newIndex: event.target.value })}
                  className={ui.control}
                  placeholder="Ex.: 4º"
                />
              </InspectorField>
              <InspectorField label="Novo tipo">
                <Select
                  value={draft.newType}
                  onValueChange={(value) =>
                    patch({ newType: value as ElementType })
                  }
                >
                  <SelectTrigger className={ui.control}>
                    <SelectValue placeholder="Manter o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ELEMENT_TYPES.map((elementType) => (
                      <SelectItem
                        key={elementType}
                        value={elementType}
                        className="text-[11px]"
                      >
                        {elementType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InspectorField>
            </InspectorSection>
          )}
        </>
      )}

      {targetCount > 1 && (
        <InspectorSection>
          <p className={cn(ui.hint, "flex items-start gap-1")}>
            <MousePointerClick className="mt-0.5 h-3 w-3 shrink-0" />A situação
            será adicionada aos {targetCount} elementos selecionados.
          </p>
        </InspectorSection>
      )}
    </InspectorView>
  );
}
