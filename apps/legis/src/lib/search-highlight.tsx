import React from "react";

/** Marcação que o backend injeta no snippet (`legis-search.service`). */
const MARK_PATTERN = /<mark>([\s\S]*?)<\/mark>/gi;

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const decodeHtmlEntities = (value: string) =>
  value.replace(
    /&(?:amp|lt|gt|quot|#39);/g,
    (entity) => HTML_ENTITIES[entity] ?? entity,
  );

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Realce das ocorrências: sublinhado, sem fundo. Mantém o painel plano do Legis e
 * continua legível nos dois temas, porque deriva de `foreground`.
 */
export const HIGHLIGHT_CLASS =
  "bg-transparent font-medium text-foreground underline decoration-2 underline-offset-2";

/** Equivalente ao HIGHLIGHT_CLASS para snippets já renderizados como HTML. */
export const SNIPPET_HIGHLIGHT_CLASS =
  "[&_mark]:bg-transparent [&_mark]:font-medium [&_mark]:text-foreground [&_mark]:underline [&_mark]:decoration-2 [&_mark]:underline-offset-2";

/**
 * Recupera os trechos que o backend marcou nos snippets. Usar o próprio resultado
 * evita reimplementar a normalização do termo pesquisado no cliente.
 */
export function extractMatchedTerms(matches: { snippet: string }[]): string[] {
  const terms = new Set<string>();

  for (const match of matches) {
    for (const found of match.snippet.matchAll(MARK_PATTERN)) {
      const term = decodeHtmlEntities(found[1]).trim();
      if (term) terms.add(term);
    }
  }

  return Array.from(terms);
}

/** Texto com as ocorrências dos termos pesquisados realçadas. */
export function HighlightedText({
  text,
  terms,
}: {
  text: string;
  terms?: string[];
}) {
  if (!text) return null;

  const usableTerms = (terms ?? []).filter(Boolean);
  if (usableTerms.length === 0) return <>{text}</>;

  const pattern = new RegExp(
    `(${usableTerms.map(escapeRegExp).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        // `split` com um único grupo de captura devolve as ocorrências nos índices ímpares.
        index % 2 === 1 ? (
          <mark key={index} className={HIGHLIGHT_CLASS}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
