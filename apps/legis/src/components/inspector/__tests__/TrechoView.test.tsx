import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { withSegmentAnchor } from "../../../domain/segment-anchor";
import type { AnnotatedTextSegment } from "../../../domain/types";
import { TrechoView, type TrechoViewProps } from "../TrechoView";

const BASE = "Fica criado o programa municipal de arborização urbana.";

/** Text of a source act: quoting it keeps a fragment and elides the rest. */
const SOURCE = "Ficam vetados os arts. 3º e 4º do projeto de lei aprovado.";

/**
 * A marked passage is stored the same way in both modes — what changes is the
 * reading: suppressed in `omission`, kept in `citation`.
 */
function omission(base: string, needle: string): AnnotatedTextSegment {
  const start = base.indexOf(needle);
  return withSegmentAnchor(base, {
    start,
    end: start + needle.length,
    type: "omission",
  });
}

/** The opening tag carrying `attribute`, so assertions do not depend on attribute order. */
function tagWith(html: string, attribute: string): string {
  const match = html.match(new RegExp(`<[a-z]+[^>]*${attribute}[^>]*>`));
  expect(match, `no element with ${attribute}`).not.toBeNull();
  return match![0];
}

/** Text wrapped by the highlight of passage `index` inside the panel's own text. */
function highlightedText(html: string, index: number): string {
  const match = html.match(
    new RegExp(`data-trecho-highlight="${index}"[^>]*>([^<]*)<`),
  );
  expect(match, `no highlight for passage ${index}`).not.toBeNull();
  return match![1];
}

/** No editor is passed on purpose: the view must render without Tiptap's DOM. */
function render(overrides: Partial<TrechoViewProps> = {}) {
  return renderToStaticMarkup(
    <TrechoView
      baseText={BASE}
      elementId="art-1"
      elementLabel="Art. 1º"
      situationType="Veto"
      segments={[]}
      onChange={() => undefined}
      onBack={() => undefined}
      {...overrides}
    />,
  );
}

describe("TrechoView list", () => {
  it("numbers every marked passage and shows its text", () => {
    const html = render({
      segments: [
        omission(BASE, "Fica criado"),
        omission(BASE, "arborização urbana"),
      ],
    });

    expect(html).toContain('data-trecho-index="0"');
    expect(html).toContain('data-trecho-index="1"');
    expect(html).toMatch(/>1</);
    expect(html).toMatch(/>2</);
    expect(html).toContain("Fica criado");
    expect(html).toContain("arborização urbana");
    expect(html).toContain("2 trechos");
  });

  it("offers the word-by-word edge adjustments for each passage", () => {
    const html = render({ segments: [omission(BASE, "programa municipal")] });

    expect(html).toContain("Expandir início em uma palavra");
    expect(html).toContain("Encolher início em uma palavra");
    expect(html).toContain("Encolher fim em uma palavra");
    expect(html).toContain("Expandir fim em uma palavra");
  });

  it("shows the supplement badge and its note input", () => {
    const segment: AnnotatedTextSegment = {
      ...omission(BASE, "programa municipal"),
      type: "supplement",
      supplementText: "de arborização",
    };

    const html = render({ segments: [segment] });

    expect(html).toContain("Suplementação");
    expect(html).toContain("Nota do trecho 1");
    expect(html).toContain("de arborização");
  });

  it("flags a supplement as invalid while the note is empty", () => {
    const withoutNote: AnnotatedTextSegment = {
      ...omission(BASE, "programa municipal"),
      type: "supplement",
    };

    const html = render({ segments: [withoutNote] });

    expect(html).toContain('data-invalid="true"');
    expect(html).toContain("Informe a nota");
    expect(html).toContain("1 incompleto");
  });

  it("keeps a valid omission out of the invalid state", () => {
    const html = render({ segments: [omission(BASE, "programa municipal")] });

    expect(html).not.toContain('data-invalid="true"');
    expect(html).toContain("1 trecho");
  });
});

describe("TrechoView drift", () => {
  it("marks a passage as re-anchored when the offsets drifted but the text is still there", () => {
    const segment = omission(BASE, "programa municipal");
    const edited = `Nos termos do regulamento, ${BASE}`;

    const html = render({ baseText: edited, segments: [segment] });

    expect(html).toContain('data-trecho-status="reanchored"');
    expect(html).toContain("reancorado");
  });

  it("warns and offers removal when the passage no longer exists", () => {
    const html = render({
      segments: [
        {
          start: 0,
          end: 10,
          type: "omission",
          selectedText: "saneamento básico",
        },
      ],
    });

    expect(html).toContain('data-trecho-status="lost"');
    expect(html).toContain('data-trecho-lost="true"');
    expect(html).toContain("Trecho não encontrado no texto atual.");
    expect(html).toContain("Remover");
  });

  it("warns about overlapping passages and offers merging", () => {
    const html = render({
      segments: [
        omission(BASE, "Fica criado o programa"),
        omission(BASE, "programa municipal"),
      ],
    });

    expect(html).toContain('data-trecho-overlap="true"');
    expect(html).toContain("Mesclar");
  });
});

describe("TrechoView preview", () => {
  it("replaces an omitted passage with the placeholder of the situation type", () => {
    const html = render({
      situationType: "Veto",
      segments: [omission(BASE, "programa municipal")],
    });

    expect(html).toContain('data-trecho-preview="true"');
    expect(html).toContain("Fica criado o (VETADO) de arborização urbana.");
  });

  it("uses the placeholder of a revocation-like type", () => {
    const html = render({
      situationType: "Revogação",
      segments: [omission(BASE, "programa municipal")],
    });

    expect(html).toContain("Fica criado o [...] de arborização urbana.");
  });

  it("keeps the text of a supplement and appends its note", () => {
    const html = render({
      segments: [
        {
          ...omission(BASE, "programa municipal"),
          type: "supplement",
          supplementText: "15,4m",
        },
      ],
    });

    expect(html).toContain("programa municipal");
    expect(html).toContain("[15,4m]");
  });
});

describe("TrechoView without an editor", () => {
  it("renders the selectable fallback instead of the capture toggle", () => {
    const html = render();

    expect(html).toContain('data-trecho-source="panel"');
    expect(html).toContain("Selecione o trecho no texto abaixo.");
    expect(html).not.toContain("Capturar no texto");
  });

  it("renders the empty state with an instruction and default omission preview", () => {
    const html = render();

    expect(html).toContain("Nenhum trecho marcado");
    expect(html).toContain("0 trechos");
    expect(html).toContain('data-trecho-preview="true"');
    expect(html).toContain("(VETADO)");
  });

  it("highlights the marked passages inside the panel text", () => {
    const html = render({ segments: [omission(BASE, "programa municipal")] });

    expect(html).toContain('data-trecho-source="panel"');
    expect(highlightedText(html, 0)).toBe("programa municipal");
  });
});

/**
 * The inverse semantics: passages of the source act. What is marked is what is
 * quoted, and the text around it is elided.
 */
function citation(overrides: Partial<TrechoViewProps> = {}) {
  return render({
    baseText: SOURCE,
    elementLabel: "Mensagem de veto",
    mode: "citation",
    ...overrides,
  });
}

describe("TrechoView citation preview", () => {
  it("keeps the marked passage and elides around it", () => {
    const html = citation({ segments: [omission(SOURCE, "arts. 3º e 4º")] });

    expect(html).toContain("Citação resultante");
    expect(html).toContain('data-trecho-preview="true"');
    expect(html).toContain("[...] arts. 3º e 4º [...]");
  });

  it("elides between several marked parts", () => {
    const html = citation({
      segments: [omission(SOURCE, "vetados"), omission(SOURCE, "3º e 4º")],
    });

    expect(html).toContain("[...] vetados [...] 3º e 4º [...]");
  });

  it("does not elide before a passage that opens the text", () => {
    const html = citation({ segments: [omission(SOURCE, "Ficam vetados")] });

    expect(html).toContain("Ficam vetados [...]");
  });

  it("shows the note of a supplemented passage inside the citation", () => {
    const html = citation({
      segments: [
        {
          ...omission(SOURCE, "arts. 3º e 4º"),
          type: "supplement",
          supplementText: "redação original",
        },
      ],
    });

    expect(html).toContain("[...] arts. 3º e 4º [redação original] [...]");
  });

  it("renders the citation as text, never as markup", () => {
    const html = citation({
      baseText: "Vetado o <script>alerta</script> do projeto.",
      segments: [],
    });

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});

describe("TrechoView citation scope", () => {
  it("presents the whole element as the citation when nothing is marked", () => {
    const html = citation({ segments: [] });

    expect(html).toContain('data-citation-scope="whole"');
    expect(html).toContain('data-citation-whole="true"');
    expect(html).toContain("A citação é o elemento inteiro.");
    // The preview already reproduces the element in full.
    expect(html).toContain('data-trecho-preview="true"');
    expect(html).toContain(SOURCE);
    expect(html).toContain("Citação do elemento inteiro");
  });

  it('marks "Elemento inteiro" as the active option while nothing is marked', () => {
    const html = citation({ segments: [] });

    expect(tagWith(html, 'data-citation-scope-option="whole"')).toContain(
      'aria-pressed="true"',
    );
    expect(tagWith(html, 'data-citation-scope-option="specific"')).toContain(
      'aria-pressed="false"',
    );
  });

  it("switches to specific passages as soon as one is marked", () => {
    const html = citation({ segments: [omission(SOURCE, "arts. 3º e 4º")] });

    expect(html).toContain('data-citation-scope="specific"');
    expect(html).not.toContain('data-citation-whole="true"');
    expect(tagWith(html, 'data-citation-scope-option="specific"')).toContain(
      'aria-pressed="true"',
    );
    expect(tagWith(html, 'data-citation-scope-option="whole"')).toContain(
      'aria-pressed="false"',
    );
    expect(html).toContain("Trechos citados");
  });

  it("offers both options in either state", () => {
    [
      citation({ segments: [] }),
      citation({ segments: [omission(SOURCE, "vetados")] }),
    ].forEach((html) => {
      expect(html).toContain("Elemento inteiro");
      expect(html).toContain("Trechos específicos");
    });
  });

  it("hides the selection area while the citation covers the whole element", () => {
    const html = citation({ segments: [] });

    expect(html).not.toContain('data-trecho-source="panel"');
  });
});

describe("TrechoView citation labels", () => {
  it("never describes the marked passage as an omission", () => {
    [
      citation({ segments: [] }),
      citation({ segments: [omission(SOURCE, "arts. 3º e 4º")] }),
    ].forEach((html) => {
      expect(html).not.toMatch(/omiss|omitir|omitid/i);
    });
  });

  it("says the marked passage is what stays", () => {
    const html = citation({ segments: [omission(SOURCE, "arts. 3º e 4º")] });

    expect(html).toContain("Citado");
    expect(html).toContain("o que fica na citação");
  });

  it("asks for a selection of what should stay, in the source text", () => {
    const html = citation({ segments: [omission(SOURCE, "vetados")] });

    expect(html).toContain("Texto de origem");
    expect(html).toContain("Selecione abaixo o que deve ficar na citação");
  });
});

describe("TrechoView citation without an editor", () => {
  it("highlights the quoted passages inside the source text", () => {
    const html = citation({
      segments: [omission(SOURCE, "vetados"), omission(SOURCE, "3º e 4º")],
    });

    expect(html).toContain('data-trecho-source="panel"');
    expect(highlightedText(html, 0)).toBe("vetados");
    expect(highlightedText(html, 1)).toBe("3º e 4º");
  });

  it("keeps the source text readable around the highlights", () => {
    const html = citation({ segments: [omission(SOURCE, "arts. 3º e 4º")] });
    const panel = html.slice(html.indexOf('data-trecho-source="panel"'));

    expect(panel).toContain("Ficam vetados os ");
    expect(panel).toContain(" do projeto de lei aprovado.");
  });
});
