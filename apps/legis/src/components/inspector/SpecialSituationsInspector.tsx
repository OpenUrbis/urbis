import React, { useCallback, useMemo, useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@open-urbis/map-ui";
import {
  AlertTriangle,
  Ban,
  ClipboardCopy,
  Crosshair,
  Layers,
  Link2,
  ListTree,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type {
  ElementType,
  NormativeElementEntity as NormativeElement,
  SpecialSituation,
} from "../../domain/entities";
import type { SpecialSituationType } from "../../domain/types";
import { validateElement } from "../../domain/normative-validation";
import { getElementKey } from "../../domain/display-logic";
import { getSegmentBaseText } from "../../domain/segment-anchor";
import {
  hasElementNode,
  scrollToElementInEditor,
} from "../Editor/trecho-capture";
import {
  buildRetainedExcerpt,
  getCleanDisplayText,
  normalizeAnnotatedTextSegments,
} from "../../domain/text-utils";
import {
  createEmptyValidity,
  hasValidityValue,
  resolveLinkedElementDate,
  updateValidityNormativeElement,
} from "../../domain/validity";
import { ValidityInputFields } from "../common/ValidityInputFields";
import { withSpecialSituationCompatibilityFields } from "../page/SituationLogic";
import { getSituationPresentation } from "../page/situation-presentation";
import {
  InspectorEmpty,
  InspectorField,
  InspectorSection,
  InspectorShell,
  InspectorView,
} from "./InspectorShell";
import { ElementPickerView } from "./ElementPickerView";
import { LinkPickerView, type LinkPickerSelection } from "./LinkPickerView";
import { SituationFormView } from "./SituationFormView";
import { TrechoView } from "./TrechoView";
import { ui, type InspectorMode } from "./inspector-tokens";
import {
  buildSituationFromDraft,
  getSituationTypeConfig,
  isSituationDraftValid,
  upsertSituation,
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

const TYPES_WITHOUT_INDEX = ["Tabela", "Figura", "Mapa"];

type LinkTarget =
  | "situation"
  | "startValidity"
  | "endValidity"
  | "bulkStart"
  | "bulkEnd";

type Route =
  | { kind: "root" }
  | { kind: "situation" }
  /** `source` marks passages of the linked act, `target` of the element itself. */
  | { kind: "trechos"; target: "target" | "source" }
  | { kind: "link"; target: LinkTarget }
  | { kind: "picker"; target: "parent" | "bulkParent" };

/** Text of the linked source device, kept so its passages can be marked. */
interface SourceContext {
  elementId: string;
  label: string;
  baseText: string;
}

function getElementLabel(element?: NormativeElement | null): string {
  if (!element) return "";
  return (
    [element.type, element.index].filter(Boolean).join(" ").trim() ||
    element.type
  );
}

function getElementPreview(element?: NormativeElement | null): string {
  if (!element || typeof element.text !== "string")
    return "Sem texto disponível.";

  const preview = getCleanDisplayText(element.text, element.type, element.index)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!preview) return "Sem texto disponível.";
  return preview.length > 90 ? `${preview.slice(0, 87)}…` : preview;
}

/**
 * Derives the human-readable excerpt fields from the marked passages, so the
 * stored situation stays consistent with what was marked.
 */

export interface SpecialSituationsInspectorProps {
  selectedElements?: NormativeElement[];
  allElements?: NormativeElement[];
  onUpdate: (element: NormativeElement | NormativeElement[]) => void;
  onSelectElements?: (elements: NormativeElement[]) => void;
  /** Tiptap instance, enabling passage capture straight from the document. */
  editor?: unknown;
  documentValidityDate?: string;
}

export function SpecialSituationsInspector({
  selectedElements = [],
  allElements = [],
  onUpdate,
  onSelectElements,
  editor,
  documentValidityDate,
}: SpecialSituationsInspectorProps) {
  const [route, setRoute] = useState<Route>({ kind: "root" });
  const [collapsed, setCollapsed] = useState(false);
  const [draft, setDraft] = useState<Partial<SpecialSituation>>({
    type: "Veto",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [bulkValidity, setBulkValidity] = useState({
    initial: createEmptyValidity(),
    final: createEmptyValidity(),
  });
  const [linkCache, setLinkCache] = useState<Record<string, { label: string }>>(
    {},
  );
  const [sourceContext, setSourceContext] = useState<SourceContext | null>(
    null,
  );

  const element = selectedElements.length === 1 ? selectedElements[0] : null;
  const isBulk = selectedElements.length > 1;

  const goRoot = useCallback(() => setRoute({ kind: "root" }), []);
  const toggleCollapse = useCallback(() => setCollapsed((value) => !value), []);

  const mode: InspectorMode = useMemo(() => {
    switch (route.kind) {
      case "situation":
        return "situation";
      case "trechos":
        return "trechos";
      case "link":
        return "link";
      case "picker":
        return "picker";
      default:
        if (!selectedElements.length) return "outline";
        return isBulk ? "bulk" : "element";
    }
  }, [route.kind, selectedElements.length, isBulk]);

  const baseText = useMemo(() => getSegmentBaseText(element), [element]);

  /* ---------------------------------------------------------------------- */
  /* Situations                                                             */
  /* ---------------------------------------------------------------------- */

  const openNewSituation = () => {
    setDraft({ type: "Veto", date: documentValidityDate || "" });
    setEditingIndex(null);
    setSourceContext(null);
    setRoute({ kind: "situation" });
  };

  const openEditSituation = (index: number) => {
    const situation = element?.specialSituations?.[index];
    if (!situation) return;

    setDraft(withSpecialSituationCompatibilityFields(situation));
    setEditingIndex(index);
    // The source text is not persisted with the situation; it only becomes
    // available again after the device is re-linked.
    setSourceContext(null);
    setRoute({ kind: "situation" });
  };

  const submitSituation = () => {
    if (!isSituationDraftValid(draft)) return;

    const situation = buildSituationFromDraft(draft);

    if (isBulk) {
      onUpdate(
        selectedElements.map((selected) => ({
          ...selected,
          specialSituations: [...(selected.specialSituations || []), situation],
        })),
      );
    } else if (element) {
      onUpdate({
        ...element,
        specialSituations: upsertSituation(
          element.specialSituations,
          situation,
          editingIndex,
        ),
      });
    }

    setDraft({ type: "Veto" });
    setEditingIndex(null);
    goRoot();
  };

  const removeSituation = (index: number) => {
    if (!element) return;

    const situations = [...(element.specialSituations || [])];
    situations.splice(index, 1);
    onUpdate({ ...element, specialSituations: situations });
  };

  /* ---------------------------------------------------------------------- */
  /* Links                                                                  */
  /* ---------------------------------------------------------------------- */

  const applyLinkSelection = (
    target: LinkTarget,
    selection: LinkPickerSelection,
  ) => {
    const { documentId, documentLabel, elementId, deviceLabel } = selection;
    const label = deviceLabel
      ? `${documentLabel} - ${deviceLabel}`
      : documentLabel;
    const linkedDate =
      resolveLinkedElementDate(selection.document, elementId) ||
      documentValidityDate ||
      "";

    setLinkCache((previous) => ({ ...previous, [elementId]: { label } }));

    switch (target) {
      case "situation": {
        const sourceElement = selection.document?.elements?.find(
          (candidate) => candidate.id === elementId,
        );
        const sourceBaseText = sourceElement
          ? getSegmentBaseText(sourceElement)
          : "";

        setDraft((previous) => {
          const config = getSituationTypeConfig(
            previous.type as SpecialSituationType,
          );
          const shouldAutofill =
            config.supportsNewText &&
            sourceBaseText &&
            (!previous.newText ||
              previous.newText === previous.sourceDocumentLabel);

          return {
            ...previous,
            sourceDocumentId: documentId,
            sourceDocumentLabel: documentLabel,
            relatedDeviceId: elementId,
            normativeElementId: elementId,
            dispositivo: deviceLabel || elementId,
            device: deviceLabel || elementId,
            date: linkedDate || previous.date || documentValidityDate || "",
            newText: shouldAutofill ? sourceBaseText : previous.newText,
          };
        });

        setSourceContext(
          sourceBaseText
            ? {
                elementId,
                label: deviceLabel || documentLabel,
                baseText: sourceBaseText,
              }
            : null,
        );
        break;
      }
      case "startValidity":
        if (element) {
          onUpdate({
            ...element,
            originalStartValidity: updateValidityNormativeElement(
              element.originalStartValidity,
              elementId,
              label,
              linkedDate,
            ),
          });
        }
        break;
      case "endValidity":
        if (element?.originalEndValidity) {
          onUpdate({
            ...element,
            originalEndValidity: updateValidityNormativeElement(
              element.originalEndValidity,
              elementId,
              label,
              linkedDate,
            ),
          });
        }
        break;
      case "bulkStart":
        setBulkValidity((previous) => ({
          ...previous,
          initial: updateValidityNormativeElement(
            previous.initial,
            elementId,
            label,
            linkedDate,
          ),
        }));
        break;
      case "bulkEnd":
        setBulkValidity((previous) => ({
          ...previous,
          final: updateValidityNormativeElement(
            previous.final,
            elementId,
            label,
            linkedDate,
          ),
        }));
        break;
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Bulk                                                                   */
  /* ---------------------------------------------------------------------- */

  const applyBulkType = (type: ElementType) => {
    onUpdate(selectedElements.map((selected) => ({ ...selected, type })));
  };

  const applyBulkParent = (parentId: string | undefined) => {
    onUpdate(selectedElements.map((selected) => ({ ...selected, parentId })));
  };

  const applyBulkValidity = () => {
    onUpdate(
      selectedElements.map((selected) => {
        const changes: Partial<NormativeElement> = {};

        if (hasValidityValue(bulkValidity.initial)) {
          changes.originalStartValidity = {
            ...selected.originalStartValidity,
            ...bulkValidity.initial,
          };
        }

        if (hasValidityValue(bulkValidity.final)) {
          changes.originalEndValidity = {
            ...(selected.originalEndValidity || createEmptyValidity()),
            ...bulkValidity.final,
          };
        }

        return { ...selected, ...changes };
      }),
    );

    setBulkValidity({
      initial: createEmptyValidity(),
      final: createEmptyValidity(),
    });
  };

  /* ---------------------------------------------------------------------- */
  /* Pushed views                                                           */
  /* ---------------------------------------------------------------------- */

  if (route.kind === "trechos" && (element || route.target === "source")) {
    const isSource = route.target === "source";

    // Passages of the source act are marked against the linked device's text,
    // and are stored separately from the passages of the affected element.
    const trechoBaseText = isSource
      ? (sourceContext?.baseText ?? "")
      : baseText;
    const trechoElementId = isSource
      ? (sourceContext?.elementId ?? "")
      : element!.id;
    const trechoLabel = isSource
      ? (sourceContext?.label ?? "Origem")
      : getElementLabel(element);
    const trechoSegments = isSource ? draft.sourceTrechos : draft.trechos;

    return (
      <InspectorShell
        mode={mode}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      >
        <TrechoView
          baseText={trechoBaseText}
          elementId={trechoElementId}
          elementLabel={trechoLabel}
          situationType={(draft.type as SpecialSituationType) ?? "Veto"}
          segments={normalizeAnnotatedTextSegments(trechoSegments)}
          onChange={(next) =>
            setDraft((previous) => {
              if (isSource) {
                const config = getSituationTypeConfig(
                  previous.type as SpecialSituationType,
                );
                const updatedExcerpt =
                  sourceContext?.baseText
                    ? buildRetainedExcerpt(sourceContext.baseText, next)
                    : undefined;

                return {
                  ...previous,
                  sourceTrechos: next,
                  newText:
                    config.supportsNewText && updatedExcerpt
                      ? updatedExcerpt
                      : previous.newText,
                };
              }
              return { ...previous, trechos: next };
            })
          }
          onBack={() => setRoute({ kind: "situation" })}
          editor={isSource ? undefined : editor}
          mode={isSource ? "citation" : "omission"}
          onToggleCollapse={toggleCollapse}
        />
      </InspectorShell>
    );
  }

  if (route.kind === "link") {
    const { target } = route;
    const returnRoute: Route =
      target === "situation" ? { kind: "situation" } : { kind: "root" };

    return (
      <InspectorShell
        mode={mode}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      >
        <LinkPickerView
          title="Vincular dispositivo"
          localElements={allElements}
          initialSelection={
            target === "situation"
              ? {
                  documentId: draft.sourceDocumentId,
                  elementId: draft.relatedDeviceId,
                }
              : undefined
          }
          onSelect={(selection) => applyLinkSelection(target, selection)}
          onBack={() => setRoute(returnRoute)}
          onToggleCollapse={toggleCollapse}
        />
      </InspectorShell>
    );
  }

  if (route.kind === "picker") {
    const isBulkParent = route.target === "bulkParent";

    return (
      <InspectorShell
        mode={mode}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      >
        <ElementPickerView
          title="Elemento pai"
          elements={allElements}
          value={isBulkParent ? undefined : element?.parentId}
          excludeId={isBulkParent ? undefined : element?.id}
          onSelect={(parentId) => {
            if (isBulkParent) {
              applyBulkParent(parentId);
            } else if (element) {
              onUpdate({ ...element, parentId });
            }
          }}
          onBack={goRoot}
          onToggleCollapse={toggleCollapse}
        />
      </InspectorShell>
    );
  }

  if (route.kind === "situation") {
    return (
      <InspectorShell
        mode={mode}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      >
        <SituationFormView
          draft={draft}
          onChange={setDraft}
          editingIndex={editingIndex}
          targetCount={selectedElements.length}
          elementLabel={getElementLabel(element)}
          canMarkTrechos={!!element && !!baseText}
          onOpenTrechos={() => setRoute({ kind: "trechos", target: "target" })}
          sourceLabel={sourceContext?.label}
          sourceBaseText={sourceContext?.baseText}
          onOpenSourceTrechos={() =>
            setRoute({ kind: "trechos", target: "source" })
          }
          onOpenLink={() => setRoute({ kind: "link", target: "situation" })}
          onSubmit={submitSituation}
          onBack={goRoot}
          onToggleCollapse={toggleCollapse}
          documentValidityDate={documentValidityDate}
        />
      </InspectorShell>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Root views                                                             */
  /* ---------------------------------------------------------------------- */

  if (!selectedElements.length) {
    return (
      <InspectorShell
        mode={mode}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        rail={<ListTree className="h-3.5 w-3.5 text-muted-foreground" />}
      >
        <InspectorView title="Estrutura" onToggleCollapse={toggleCollapse}>
          {allElements.length === 0 ? (
            <InspectorEmpty icon={<ListTree className="h-6 w-6" />}>
              Nenhum elemento estruturado ainda.
            </InspectorEmpty>
          ) : (
            <>
              <p className={cn(ui.hint, "border-b px-3 py-1.5")}>
                Clique no texto para selecionar um elemento.
              </p>
              <div className="divide-y divide-border/50">
                {allElements.map((item) => {
                  const issues = validateElement(item);
                  const situations = item.specialSituations?.length ?? 0;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={ui.row}
                      onClick={() => onSelectElements?.([item])}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1">
                          <span className="font-mono text-[11px] font-semibold text-primary">
                            {getElementKey(item).replace(/[\s\-–—]+$/, "") ||
                              item.type}
                          </span>
                          {situations > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {situations}
                            </span>
                          )}
                          {issues.length > 0 && (
                            <span
                              title={`${issues.length} problemas encontrados`}
                            >
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(ui.muted, "mt-0.5 line-clamp-1 block")}
                        >
                          {getElementPreview(item)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </InspectorView>
      </InspectorShell>
    );
  }

  if (isBulk) {
    return (
      <InspectorShell
        mode={mode}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      >
        <InspectorView
          title={`${selectedElements.length} elementos`}
          onToggleCollapse={toggleCollapse}
          actions={
            <Button
              variant="ghost"
              size="sm"
              className={ui.iconButton}
              onClick={() => onSelectElements?.([])}
              title="Limpar seleção"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          }
        >
          <InspectorSection title="Classificação">
            <InspectorField label="Tipo">
              <Select
                onValueChange={(value) => applyBulkType(value as ElementType)}
              >
                <SelectTrigger className={ui.control}>
                  <SelectValue placeholder="Definir tipo…" />
                </SelectTrigger>
                <SelectContent>
                  {ELEMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-[11px]">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InspectorField>

            <InspectorField label="Elemento pai">
              <Button
                variant="outline"
                size="sm"
                className={cn(ui.smallButton, "w-full justify-start")}
                onClick={() =>
                  setRoute({ kind: "picker", target: "bulkParent" })
                }
              >
                <Layers className="h-3 w-3" />
                Definir pai…
              </Button>
            </InspectorField>
          </InspectorSection>

          <InspectorSection title="Vigência">
            <InspectorField label="Inicial">
              <ValidityInputFields
                value={bulkValidity.initial}
                onChange={(initial) =>
                  setBulkValidity({ ...bulkValidity, initial })
                }
                onOpenLinkManager={() =>
                  setRoute({ kind: "link", target: "bulkStart" })
                }
                linkLabel={
                  bulkValidity.initial.normativeElementId
                    ? linkCache[bulkValidity.initial.normativeElementId]?.label
                    : undefined
                }
                compact
              />
            </InspectorField>
            <InspectorField label="Final">
              <ValidityInputFields
                value={bulkValidity.final}
                onChange={(final) =>
                  setBulkValidity({ ...bulkValidity, final })
                }
                onOpenLinkManager={() =>
                  setRoute({ kind: "link", target: "bulkEnd" })
                }
                linkLabel={
                  bulkValidity.final.normativeElementId
                    ? linkCache[bulkValidity.final.normativeElementId]?.label
                    : undefined
                }
                compact
              />
            </InspectorField>
            <Button
              variant="outline"
              size="sm"
              className={cn(ui.smallButton, "w-full")}
              onClick={applyBulkValidity}
            >
              Aplicar vigência
            </Button>
          </InspectorSection>

          <InspectorSection title="Situações especiais">
            <Button
              variant="outline"
              size="sm"
              className={cn(ui.smallButton, "w-full justify-start")}
              onClick={openNewSituation}
            >
              <Plus className="h-3 w-3" />
              Adicionar em {selectedElements.length} elementos
            </Button>
          </InspectorSection>
        </InspectorView>
      </InspectorShell>
    );
  }

  if (!element) return null;

  const validationIssues = validateElement(element);
  const parentElement = element.parentId
    ? allElements.find((item) => item.id === element.parentId)
    : undefined;
  const situations = element.specialSituations || [];
  const canReachElementInText = hasElementNode(editor, element.id);

  return (
    <InspectorShell
      mode={mode}
      collapsed={collapsed}
      onToggleCollapse={toggleCollapse}
    >
      <InspectorView
        title={getElementLabel(element)}
        onToggleCollapse={toggleCollapse}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              className={ui.iconButton}
              onClick={() => scrollToElementInEditor(editor, element.id)}
              disabled={!canReachElementInText}
              title={
                canReachElementInText
                  ? "Ir para o texto no documento"
                  : "Elemento ainda não existe no texto"
              }
            >
              <Crosshair className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={ui.iconButton}
              onClick={() =>
                navigator.clipboard?.writeText(JSON.stringify(element, null, 2))
              }
              title="Copiar JSON do elemento"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={ui.iconButton}
              onClick={() => onSelectElements?.([])}
              title="Limpar seleção"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        }
      >
        {validationIssues.length > 0 && (
          <div className="border-b px-3 py-1.5 text-[11px] text-amber-700 dark:text-amber-500">
            <div className="mb-0.5 flex items-center gap-1 font-medium">
              <AlertTriangle className="h-3 w-3" />
              Atenção
            </div>
            <ul className="list-disc space-y-0.5 pl-3.5">
              {validationIssues.map((issue, index) => (
                <li key={index}>{issue.message}</li>
              ))}
            </ul>
          </div>
        )}

        <InspectorSection title="Classificação">
          <div className="flex gap-1">
            <div className="min-w-0 flex-1">
              <InspectorField label="Tipo">
                <Select
                  value={element.type}
                  onValueChange={(value) => {
                    const type = value as ElementType;
                    onUpdate({
                      ...element,
                      type,
                      ...(TYPES_WITHOUT_INDEX.includes(type)
                        ? { index: "" }
                        : {}),
                    });
                  }}
                >
                  <SelectTrigger className={ui.control}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ELEMENT_TYPES.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="text-[11px]"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InspectorField>
            </div>
            {!TYPES_WITHOUT_INDEX.includes(element.type) && (
              <div className="w-20 shrink-0">
                <InspectorField label="Índice">
                  <Input
                    value={element.index || ""}
                    onChange={(event) =>
                      onUpdate({ ...element, index: event.target.value })
                    }
                    className={ui.control}
                  />
                </InspectorField>
              </div>
            )}
          </div>

          <InspectorField label="Elemento pai">
            <Button
              variant="outline"
              size="sm"
              className={cn(ui.smallButton, "w-full justify-start")}
              onClick={() => setRoute({ kind: "picker", target: "parent" })}
            >
              <Layers className="h-3 w-3 shrink-0" />
              <span className="min-w-0 truncate">
                {parentElement
                  ? getElementLabel(parentElement)
                  : "Nenhum (raiz)"}
              </span>
            </Button>
          </InspectorField>

          {element.type === "Nota" && (
            <InspectorField label="Elemento de destino (Nota)">
              <Button
                variant="outline"
                size="sm"
                className={cn(ui.smallButton, "w-full justify-start")}
                onClick={() => setRoute({ kind: "picker", target: "parent" })}
              >
                <Link2 className="h-3 w-3 shrink-0 text-primary" />
                <span className="min-w-0 truncate">
                  {element.noteData && element.noteData.length > 0
                    ? `Vinculado (${element.noteData[0].targetElementId})`
                    : "Vincular a elemento normativo..."}
                </span>
              </Button>
            </InspectorField>
          )}
        </InspectorSection>

        <InspectorSection title="Vigência original">
          <InspectorField label="Inicial (obrigatória)">
            <ValidityInputFields
              value={element.originalStartValidity}
              onChange={(originalStartValidity) =>
                onUpdate({ ...element, originalStartValidity })
              }
              onOpenLinkManager={() =>
                setRoute({ kind: "link", target: "startValidity" })
              }
              linkLabel={
                element.originalStartValidity?.normativeElementId
                  ? linkCache[element.originalStartValidity.normativeElementId]
                      ?.label
                  : undefined
              }
              compact
            />
          </InspectorField>

          {element.originalEndValidity ? (
            <div className="relative rounded border p-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0.5 top-0.5 h-4 w-4 p-0"
                onClick={() =>
                  onUpdate({ ...element, originalEndValidity: undefined })
                }
                title="Remover vigência final"
              >
                <X className="h-3 w-3" />
              </Button>
              <InspectorField label="Final">
                <ValidityInputFields
                  value={element.originalEndValidity}
                  onChange={(originalEndValidity) =>
                    onUpdate({ ...element, originalEndValidity })
                  }
                  onOpenLinkManager={() =>
                    setRoute({ kind: "link", target: "endValidity" })
                  }
                  linkLabel={
                    element.originalEndValidity.normativeElementId
                      ? linkCache[
                          element.originalEndValidity.normativeElementId
                        ]?.label
                      : undefined
                  }
                  compact
                />
              </InspectorField>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={cn(ui.smallButton, "w-full justify-start")}
              onClick={() =>
                onUpdate({
                  ...element,
                  originalEndValidity: createEmptyValidity(),
                })
              }
            >
              <Plus className="h-3 w-3" />
              Adicionar vigência final
            </Button>
          )}
        </InspectorSection>

        <InspectorSection
          title={`Situações especiais (${situations.length})`}
          action={
            <Button
              variant="ghost"
              size="sm"
              className={cn(ui.smallButton, "h-5 px-1 text-[10px]")}
              onClick={openNewSituation}
            >
              <Plus className="h-3 w-3" />
              Nova
            </Button>
          }
        >
          {situations.length === 0 ? (
            <InspectorEmpty icon={<Ban className="h-5 w-5" />}>
              Nenhuma situação registrada.
            </InspectorEmpty>
          ) : (
            <div className="space-y-1">
              {situations.map((situation, index) => {
                const presentation = getSituationPresentation(
                  withSpecialSituationCompatibilityFields(situation),
                );
                const trechoCount = normalizeAnnotatedTextSegments(
                  situation.trechos,
                ).length;

                return (
                  <div
                    key={`${situation.type}-${index}`}
                    className="group rounded border px-1.5 py-1"
                  >
                    <div className="flex items-start gap-1">
                      <span className="min-w-0 flex-1">
                        <span className={cn(ui.text, "block font-medium")}>
                          {presentation.title}
                        </span>
                        <span className={cn(ui.hint, "block")}>
                          {presentation.dateLabel || "sem data"}
                          {trechoCount > 0 &&
                            ` · ${trechoCount} ${trechoCount === 1 ? "trecho" : "trechos"}`}
                        </span>
                      </span>
                      <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => openEditSituation(index)}
                          title="Editar situação"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-destructive"
                          onClick={() => removeSituation(index)}
                          title="Remover situação"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </InspectorSection>
      </InspectorView>
    </InspectorShell>
  );
}
