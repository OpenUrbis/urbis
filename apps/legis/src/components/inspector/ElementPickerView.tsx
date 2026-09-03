import React, { useMemo, useState } from "react";
import { Input, Badge, cn } from "@open-urbis/map-ui";
import { Check, Search } from "lucide-react";
import type { NormativeElementEntity as NormativeElement } from "../../domain/entities";
import { getCleanDisplayText } from "../../domain/text-utils";
import { InspectorEmpty, InspectorView } from "./InspectorShell";
import { ui } from "./inspector-tokens";

/**
 * Picks an element of the current document. Replaces the dialog that the parent
 * selector used to open on top of the panel.
 */

function getHeading(element: NormativeElement): string {
  return (
    [element.type, element.index].filter(Boolean).join(" ").trim() ||
    element.type
  );
}

function getPreview(element: NormativeElement): string {
  if (typeof element.text !== "string") return "Sem texto disponível.";

  const preview = getCleanDisplayText(element.text, element.type, element.index)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!preview) return "Sem texto disponível.";
  return preview.length > 110 ? `${preview.slice(0, 107)}…` : preview;
}

export interface ElementPickerViewProps {
  title?: string;
  elements: NormativeElement[];
  /** Currently selected element id, or undefined for none. */
  value?: string;
  /** Element being edited, excluded from the list to avoid self-parenting. */
  excludeId?: string;
  /** Shows the "Nenhum (raiz)" option. */
  allowNone?: boolean;
  onSelect: (elementId: string | undefined) => void;
  onBack: () => void;
  onToggleCollapse?: () => void;
}

export function ElementPickerView({
  title = "Selecionar elemento",
  elements,
  value,
  excludeId,
  allowNone = true,
  onSelect,
  onBack,
  onToggleCollapse,
}: ElementPickerViewProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const candidates = elements.filter((element) => element.id !== excludeId);
    const term = search.trim().toLowerCase();
    if (!term) return candidates;

    return candidates.filter(
      (element) =>
        element.type.toLowerCase().includes(term) ||
        element.index?.toLowerCase().includes(term) ||
        (typeof element.text === "string" &&
          element.text.toLowerCase().includes(term)),
    );
  }, [elements, excludeId, search]);

  const choose = (elementId: string | undefined) => {
    onSelect(elementId);
    onBack();
  };

  return (
    <InspectorView
      title={title}
      onBack={onBack}
      onToggleCollapse={onToggleCollapse}
    >
      <div className="sticky top-0 z-10 border-b bg-background px-3 py-1.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-1.5 top-1.5 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrar elementos…"
            className={cn(ui.control, "pl-6")}
            autoFocus
          />
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {allowNone && (
          <button
            type="button"
            className={cn(ui.row, !value && ui.rowActive)}
            onClick={() => choose(undefined)}
          >
            <span className="mt-0.5 w-3 shrink-0">
              {!value && <Check className="h-3 w-3 text-primary" />}
            </span>
            <span className={cn(ui.text, "font-medium")}>Nenhum (raiz)</span>
          </button>
        )}

        {filtered.map((element) => {
          const isSelected = element.id === value;

          return (
            <button
              type="button"
              key={element.id}
              className={cn(ui.row, isSelected && ui.rowActive)}
              onClick={() => choose(element.id)}
            >
              <span className="mt-0.5 w-3 shrink-0">
                {isSelected && <Check className="h-3 w-3 text-primary" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className="h-3.5 px-1 text-[9px] font-normal"
                  >
                    {element.type}
                  </Badge>
                  {element.index && (
                    <span className="font-mono text-[11px] font-semibold text-primary">
                      {element.index}
                    </span>
                  )}
                </span>
                <span className={cn(ui.muted, "mt-0.5 line-clamp-2 block")}>
                  {getPreview(element)}
                </span>
              </span>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <InspectorEmpty icon={<Search className="h-6 w-6" />}>
            Nenhum elemento encontrado.
          </InspectorEmpty>
        )}
      </div>
    </InspectorView>
  );
}

export {
  getHeading as getElementHeadingLabel,
  getPreview as getElementPreviewText,
};
