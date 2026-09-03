import React, { useState } from "react";
import { Button, Textarea, cn } from "@open-urbis/map-ui";
import { AlertTriangle } from "lucide-react";
import { InspectorSection, InspectorView } from "./InspectorShell";
import { ui } from "./inspector-tokens";

/**
 * Raw HTML step. Replaces the dialog that used to insert HTML into the editor.
 *
 * Unlike that dialog, this one can be seeded with existing markup, so it also
 * serves as an edit step and not only as a one-way insert.
 */

/** Flags markup that the editor schema will silently discard. */
function getSchemaWarnings(html: string): string[] {
  const warnings: string[] = [];
  if (!html.trim()) return warnings;

  if (/<script\b/i.test(html)) {
    warnings.push("Tags <script> são removidas ao inserir.");
  }
  if (/<style\b/i.test(html)) {
    warnings.push("Tags <style> são removidas ao inserir.");
  }
  if (/\sdata-special-situations=/i.test(html)) {
    warnings.push(
      "Situações especiais no HTML só são aceitas em JSON válido; JSON inválido é descartado sem aviso.",
    );
  }

  const openTags = (html.match(/<([a-z][a-z0-9]*)\b[^>]*>/gi) || []).length;
  const closeTags = (html.match(/<\/([a-z][a-z0-9]*)\s*>/gi) || []).length;
  const selfClosing = (html.match(/<[^>]+\/>/g) || []).length;

  if (openTags - selfClosing > closeTags) {
    warnings.push(
      "Há tags abertas sem fechamento; o editor vai normalizar o trecho.",
    );
  }

  return warnings;
}

export interface HtmlEditorViewProps {
  title?: string;
  initialValue?: string;
  onConfirm: (html: string) => void;
  onBack: () => void;
  onToggleCollapse?: () => void;
}

export function HtmlEditorView({
  title = "Inserir HTML",
  initialValue = "",
  onConfirm,
  onBack,
  onToggleCollapse,
}: HtmlEditorViewProps) {
  const [html, setHtml] = useState(initialValue);
  const warnings = getSchemaWarnings(html);
  const canConfirm = html.trim().length > 0;

  return (
    <InspectorView
      title={title}
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
            onClick={() => {
              onConfirm(html);
              onBack();
            }}
            disabled={!canConfirm}
          >
            {initialValue ? "Salvar" : "Inserir"}
          </Button>
        </>
      }
    >
      <InspectorSection>
        <Textarea
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          placeholder="<p>Conteúdo…</p>"
          className="min-h-64 font-mono text-[11px] leading-relaxed"
          spellCheck={false}
          autoFocus
        />
        <p className={ui.hint}>
          O HTML passa pelo esquema do editor: tags desconhecidas são
          descartadas.
        </p>
      </InspectorSection>

      {warnings.length > 0 && (
        <InspectorSection>
          <div className="rounded border px-1.5 py-1">
            <div
              className={cn(
                ui.label,
                "flex items-center gap-1 text-amber-700 dark:text-amber-500",
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              Atenção
            </div>
            <ul className="mt-0.5 list-disc space-y-0.5 pl-3.5 text-[11px]">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </InspectorSection>
      )}
    </InspectorView>
  );
}

export { getSchemaWarnings };
