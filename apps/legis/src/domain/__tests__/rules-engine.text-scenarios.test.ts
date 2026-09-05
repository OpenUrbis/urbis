import { describe, expect, it } from "vitest";
import { ParsingRule, RulesEngine } from "../rules-engine";

/**
 * Real-world text scenarios for `RulesEngine.parseLine`.
 *
 * These lines are the kind of thing that actually lands in the editor when
 * someone pastes a Brazilian normative act copied from a PDF, from the Diário
 * Oficial or from a municipal website: HTML formatting noise, OCR
 * letter-spacing, ordinal-sign variants, strikethrough markers, ementas,
 * preambles and signature lines.
 *
 * Several assertions below document *current* behaviour that is arguably wrong
 * for a legislation editor. Those tests are explicitly labelled
 * "documenta comportamento atual" so a future fix knows it must update them.
 */
describe("RulesEngine - real-world text scenarios", () => {
  const engine = new RulesEngine();
  const parse = (line: string) => engine.parseLine(line);

  describe("1. formatting noise from copy/paste (HTML tag prefixes)", () => {
    it("matches an article behind a <strong> prefix and cleans the closing tag from content", () => {
      const result = parse(
        "<strong>Art. 1º</strong> Fica instituído o Plano Diretor.",
      );

      expect(result.type).toBe("Artigo");
      expect(result.ruleId).toBe("artigo");
      expect(result.index).toBe("1º");
      expect(result.content).toBe("Fica instituído o Plano Diretor.");
    });

    it("matches an article behind stacked <b><i> prefixes", () => {
      const result = parse("<b><i>Art. 2º</i></b> Fica criado o programa.");

      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("2º");
      expect(result.content).toBe("Fica criado o programa.");
    });

    it('matches a paragraph behind a <span style="..."> prefix', () => {
      const result = parse(
        '<span style="font-weight:bold">§ 3º</span> Aplica-se o disposto no caput.',
      );

      expect(result.type).toBe("Parágrafo");
      expect(result.ruleId).toBe("paragrafo");
      expect(result.index).toBe("3º");
      expect(result.content).toBe("Aplica-se o disposto no caput.");
    });

    it("matches an inciso behind an <em> prefix", () => {
      const result = parse("<em>I -</em> identificação do imóvel;");

      expect(result.type).toBe("Inciso");
      expect(result.ruleId).toBe("inciso");
      expect(result.index).toBe("I");
      expect(result.content).toBe("identificação do imóvel;");
    });

    it("matches an article wrapped in a hyperlink <a> tag", () => {
      const result = parse(
        '<a href="https://mapa.urbis.prefeitura.sp.gov.br/art1">Art. 1º</a> Esta lei entra em vigor na data de sua publicação.',
      );

      expect(result.type).toBe("Artigo");
      expect(result.ruleId).toBe("artigo");
      expect(result.index).toBe("1º");
      expect(result.content).toBe("Esta lei entra em vigor na data de sua publicação.");
    });

    it("does not match tags outside TAGS_PREFIX: <p> keeps the line as Texto", () => {
      const line = "<p>Art. 1º Fica instituído o Plano Diretor.</p>";
      const result = parse(line);

      expect(result.type).toBe("Texto");
      expect(result.content).toBe(line);
      expect(result.ruleId).toBeUndefined();
    });

    it("does not match tags outside TAGS_PREFIX: <div> keeps the line as Texto", () => {
      const line = "<div>Art. 1º Fica instituído o Plano Diretor.</div>";
      const result = parse(line);

      expect(result.type).toBe("Texto");
      expect(result.content).toBe(line);
    });
  });

  describe("2. article numbering variants", () => {
    // Every one of these ordinal markers appears in published Brazilian law.
    const ordinalVariants: [string, string][] = [
      // 'º' = U+00BA masculine ordinal indicator (the correct one)
      ["Art. 1º Fica aprovado o plano.", "ordinal indicator U+00BA"],
      // '°' = U+00B0 degree sign (typo that survives most PDF exports)
      ["Art. 1° Fica aprovado o plano.", "degree sign U+00B0"],
      ["Art. 1o Fica aprovado o plano.", "letter o"],
      // 'ª' = U+00AA feminine ordinal indicator
      ["Art. 1ª Fica aprovado o plano.", "feminine ordinal U+00AA"],
      ["Art. 1. Fica aprovado o plano.", "plain dot"],
      ["Artigo 1º Fica aprovado o plano.", 'spelled out "Artigo"'],
    ];

    for (const [line, label] of ordinalVariants) {
      it(`normalises "${line}" (${label}) to index 1º`, () => {
        const result = parse(line);

        expect(result.type).toBe("Artigo");
        expect(result.ruleId).toBe("artigo");
        expect(result.index).toBe("1º");
        expect(result.content).toBe("Fica aprovado o plano.");
      });
    }

    it('documenta comportamento atual: "Art 1º" without the dot after "Art" is NOT recognised', () => {
      const line = "Art 1º Fica aprovado o plano.";
      const result = parse(line);

      // The regex is `Art(?:igo|\.)`, so "Art " (no dot, not spelled out)
      // falls through to the Texto fallback.
      expect(result.type).toBe("Texto");
      expect(result.content).toBe(line);
    });

    it("drops the ordinal sign for articles >= 10", () => {
      expect(parse("Art. 10 Fica aprovado o plano.").index).toBe("10");
      expect(parse("Art. 10º Fica aprovado o plano.").index).toBe("10");
    });

    it("strips thousands separators from large article numbers", () => {
      const result = parse("Art. 16.402 Fica aprovado o plano.");

      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("16402");
      expect(result.content).toBe("Fica aprovado o plano.");
    });

    it("strips multiple thousands separators", () => {
      const result = parse("Art. 1.234.567 Fica aprovado o plano.");

      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("1234567");
    });

    it('documenta comportamento atual: the "-A" suffix of an inserted article leaks into content', () => {
      const result = parse("Art. 1º-A Fica criado o programa.");

      expect(result.type).toBe("Artigo");
      // Expected for a legislation editor would be index '1º-A'.
      expect(result.index).toBe("1º");
      expect(result.content).toBe("A Fica criado o programa.");
    });

    it('documenta comportamento atual: the "-B" suffix of an inserted article leaks into content', () => {
      const result = parse("Art. 5º-B Aplica-se o disposto no art. 5º-A.");

      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("5º");
      expect(result.content).toBe("B Aplica-se o disposto no art. 5º-A.");
    });

    it("accepts an article marker alone on its line (caput starts on the next line)", () => {
      const result = parse("Art. 1º");

      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("1º");
      expect(result.content).toBe("");
    });
  });

  describe("3. paragraph variants", () => {
    it('accepts "§1º" without a space after the sign', () => {
      const result = parse("§1º O sistema será implantado em etapas.");

      expect(result.type).toBe("Parágrafo");
      expect(result.index).toBe("1º");
      expect(result.content).toBe("O sistema será implantado em etapas.");
    });

    it("drops the ordinal sign for paragraphs >= 10", () => {
      const result = parse("§ 10 O sistema será implantado em etapas.");

      expect(result.type).toBe("Parágrafo");
      expect(result.index).toBe("10");
    });

    it('accepts "Parágrafo único." alone on its line', () => {
      const result = parse("Parágrafo único.");

      expect(result.type).toBe("Parágrafo");
      expect(result.ruleId).toBe("paragrafo_unico");
      expect(result.index).toBe("único");
      expect(result.content).toBe("");
    });

    it('accepts "Parágrafo Único -" with a dash separator', () => {
      const result = parse(
        "Parágrafo Único - A identificação será feita por ofício.",
      );

      expect(result.type).toBe("Parágrafo");
      expect(result.ruleId).toBe("paragrafo_unico");
      expect(result.index).toBe("único");
      expect(result.content).toBe("A identificação será feita por ofício.");
    });

    it('accepts all-caps "PARÁGRAFO ÚNICO"', () => {
      const result = parse(
        "PARÁGRAFO ÚNICO A identificação será feita por ofício.",
      );

      expect(result.type).toBe("Parágrafo");
      expect(result.index).toBe("único");
      expect(result.content).toBe("A identificação será feita por ofício.");
    });

    it('documenta comportamento atual: unaccented "PARAGRAFO UNICO" is NOT recognised', () => {
      const line = "PARAGRAFO UNICO A identificação será feita por ofício.";
      const result = parse(line);

      // The rule accepts PARAGRAFO/PARÁGRAFO but only the accented ÚNICO.
      expect(result.type).toBe("Texto");
      expect(result.content).toBe(line);
    });

    it('documenta comportamento atual: the "-A" suffix of an inserted paragraph leaks into content', () => {
      const result = parse("§ 2º-A O sistema será revisado anualmente.");

      expect(result.type).toBe("Parágrafo");
      expect(result.index).toBe("2º");
      expect(result.content).toBe("A O sistema será revisado anualmente.");
    });
  });

  describe("4. inciso / alínea / item separators and the case ambiguity", () => {
    it("accepts an en dash separator (U+2013)", () => {
      const result = parse("III – das diretrizes;");

      expect(result.type).toBe("Inciso");
      expect(result.index).toBe("III");
      expect(result.content).toBe("das diretrizes;");
    });

    it("accepts an em dash separator (U+2014)", () => {
      const result = parse("IV — dos instrumentos;");

      expect(result.type).toBe("Inciso");
      expect(result.index).toBe("IV");
      expect(result.content).toBe("dos instrumentos;");
    });

    it("accepts a closing parenthesis separator", () => {
      const result = parse("V) das definições;");

      expect(result.type).toBe("Inciso");
      expect(result.index).toBe("V");
      expect(result.content).toBe("das definições;");
    });

    it("accepts a two-letter inciso with a dash", () => {
      const result = parse("II - dos objetivos;");

      expect(result.type).toBe("Inciso");
      expect(result.index).toBe("II");
    });

    it("accepts a multi-letter inciso", () => {
      const result = parse("XXIII - das penalidades;");

      expect(result.type).toBe("Inciso");
      expect(result.index).toBe("XXIII");
      expect(result.content).toBe("das penalidades;");
    });

    it("upper-cases a lowercase roman inciso", () => {
      const result = parse("iv - dos instrumentos;");

      expect(result.type).toBe("Inciso");
      expect(result.ruleId).toBe("inciso");
      expect(result.index).toBe("IV");
    });

    it('documenta comportamento atual: uppercase "A)" matches nothing and stays Texto', () => {
      const line = "A) coordenadas geográficas";
      const result = parse(line);

      // `alinea` is case-sensitive ([a-z], no 'i' flag) and 'A' is not a
      // roman numeral, so no rule fires.
      expect(result.type).toBe("Texto");
      expect(result.content).toBe(line);
    });

    // Letters that are simultaneously valid alínea letters and valid roman
    // numerals. `alinea` (priority 35) is evaluated before `inciso` (40),
    // but it only accepts lowercase.
    const ambiguousLowercase = ["c", "d", "i", "v", "x", "l", "m"];

    for (const letter of ambiguousLowercase) {
      it(`lowercase "${letter})" wins for Alínea (priority 35) over Inciso (40)`, () => {
        const result = parse(`${letter}) texto do dispositivo`);

        expect(result.type).toBe("Alínea");
        expect(result.ruleId).toBe("alinea");
        expect(result.index).toBe(letter);
        expect(result.content).toBe("texto do dispositivo");
      });

      it(`uppercase "${letter.toUpperCase()})" falls through to Inciso`, () => {
        const upper = letter.toUpperCase();
        const result = parse(`${upper}) texto do dispositivo`);

        expect(result.type).toBe("Inciso");
        expect(result.ruleId).toBe("inciso");
        expect(result.index).toBe(upper);
        expect(result.content).toBe("texto do dispositivo");
      });
    }

    it("accepts an item with a closing parenthesis", () => {
      const result = parse("1) primeiro item");

      expect(result.type).toBe("Item");
      expect(result.ruleId).toBe("item");
      expect(result.index).toBe("1");
      expect(result.content).toBe("primeiro item");
    });

    it("accepts an item with an en dash", () => {
      const result = parse("2 – segundo item");

      expect(result.type).toBe("Item");
      expect(result.index).toBe("2");
      expect(result.content).toBe("segundo item");
    });

    it("accepts a two-digit item with a dot", () => {
      const result = parse("10. décimo item");

      expect(result.type).toBe("Item");
      expect(result.ruleId).toBe("item");
      expect(result.index).toBe("10");
      expect(result.content).toBe("décimo item");
    });

    it("parses a two-level hierarchical item", () => {
      const result = parse("1.1. primeiro nível");

      expect(result.type).toBe("Item");
      expect(result.ruleId).toBe("item_hierarchical");
      expect(result.index).toBe("1.1");
      expect(result.content).toBe("primeiro nível");
    });

    it("parses a three-level hierarchical item", () => {
      const result = parse("2.3.4. terceiro nível");

      expect(result.type).toBe("Item");
      expect(result.ruleId).toBe("item_hierarchical");
      expect(result.index).toBe("2.3.4");
    });

    it("upper-cases the alphabetic segment of a hierarchical item", () => {
      const result = parse("1.a. alfanumérico");

      expect(result.type).toBe("Item");
      expect(result.ruleId).toBe("item_hierarchical");
      expect(result.index).toBe("1.A");
      expect(result.content).toBe("alfanumérico");
    });

    it('documenta comportamento atual: "1.234 - texto" is split as item 1 with the thousands group in content', () => {
      const result = parse("1.234 - texto do dispositivo");

      // No trailing dot, so `item_hierarchical` (37) does not apply and
      // `item` (38) consumes only "1", treating the dot as a separator.
      expect(result.type).toBe("Item");
      expect(result.ruleId).toBe("item");
      expect(result.index).toBe("1");
      expect(result.content).toBe("234 - texto do dispositivo");
    });
  });

  describe("5. structural headers as they appear in real documents", () => {
    const headersAlone: [string, string, string][] = [
      ["CAPÍTULO I", "Capítulo", "I"],
      ["SEÇÃO II", "Seção", "II"],
      ["SUBSEÇÃO I", "Subseção", "I"],
      ["TÍTULO III", "Título", "III"],
      ["LIVRO II", "Livro", "II"],
      ["PARTE ESPECIAL", "Parte", "ESPECIAL"],
    ];

    for (const [line, type, index] of headersAlone) {
      it(`parses "${line}" as ${type} with empty content`, () => {
        const result = parse(line);

        expect(result.type).toBe(type);
        expect(result.index).toBe(index);
        expect(result.content).toBe("");
      });
    }

    it("splits header index from title on the same line", () => {
      const result = parse("SEÇÃO I DAS DISPOSIÇÕES PRELIMINARES");

      expect(result.type).toBe("Seção");
      expect(result.ruleId).toBe("secao");
      expect(result.index).toBe("I");
      expect(result.content).toBe("DAS DISPOSIÇÕES PRELIMINARES");
    });

    it("documenta comportamento atual: a header starting with a connector word puts the whole title in index", () => {
      const result = parse("CAPÍTULO DAS DISPOSIÇÕES GERAIS");

      // 'DAS' is in STRUCTURAL_CONNECTOR_WORDS, so it is not accepted as a
      // standalone index and the whole string becomes the index.
      expect(result.type).toBe("Capítulo");
      expect(result.index).toBe("DAS DISPOSIÇÕES GERAIS");
      expect(result.content).toBe("");
    });

    it('documenta comportamento atual: "TÍTULO DA POLÍTICA URBANA" puts the whole title in index', () => {
      const result = parse("TÍTULO DA POLÍTICA URBANA");

      expect(result.type).toBe("Título");
      expect(result.index).toBe("DA POLÍTICA URBANA");
      expect(result.content).toBe("");
    });

    it("accepts mixed-case headers as typed by humans", () => {
      expect(parse("Capítulo I")).toMatchObject({
        type: "Capítulo",
        index: "I",
        content: "",
      });
      expect(parse("Seção II")).toMatchObject({
        type: "Seção",
        index: "II",
        content: "",
      });
      expect(parse("Subseção Única")).toMatchObject({
        type: "Subseção",
        index: "Única",
        content: "",
      });
    });

    it('survives OCR letter-spacing in "C A P Í T U L O   I"', () => {
      const result = parse("C A P Í T U L O   I");

      expect(result.type).toBe("Capítulo");
      expect(result.index).toBe("I");
      expect(result.content).toBe("");
    });

    it('survives OCR letter-spacing in "S E Ç Ã O   II"', () => {
      const result = parse("S E Ç Ã O   II");

      expect(result.type).toBe("Seção");
      expect(result.index).toBe("II");
      expect(result.content).toBe("");
    });

    it("treats a hyphen as a separator because SPACE is [\\s.-]", () => {
      const result = parse("CAPÍTULO-I");

      expect(result.type).toBe("Capítulo");
      expect(result.index).toBe("I");
      expect(result.content).toBe("");
    });

    it("treats a dot as a separator because SPACE is [\\s.-]", () => {
      const result = parse("SEÇÃO.II");

      expect(result.type).toBe("Seção");
      expect(result.index).toBe("II");
      expect(result.content).toBe("");
    });

    it("keeps compound roman indexes with a hyphen", () => {
      const result = parse("CAPÍTULO IV-A");

      expect(result.type).toBe("Capítulo");
      expect(result.index).toBe("IV-A");
      expect(result.content).toBe("");
    });

    it("keeps compound roman indexes with a slash", () => {
      const result = parse("SEÇÃO II/A");

      expect(result.type).toBe("Seção");
      expect(result.index).toBe("II/A");
      expect(result.content).toBe("");
    });
  });

  describe("6. anexos", () => {
    it("parses a roman annex index", () => {
      const result = parse("ANEXO I");

      expect(result.type).toBe("Anexo");
      expect(result.ruleId).toBe("anexo");
      expect(result.index).toBe("I");
      expect(result.content).toBe("");
    });

    it("parses an arabic annex index", () => {
      const result = parse("ANEXO 1");

      expect(result.type).toBe("Anexo");
      expect(result.index).toBe("1");
      expect(result.content).toBe("");
    });

    it("splits annex index from its title", () => {
      const result = parse("ANEXO III - QUADRO DE USOS");

      expect(result.type).toBe("Anexo");
      expect(result.index).toBe("III");
      expect(result.content).toBe("QUADRO DE USOS");
    });

    it('documenta comportamento atual: "ANEXO IV-A" loses the "-A" suffix to content', () => {
      const result = parse("ANEXO IV-A");

      // The compound pattern only allows [IVXLCDM] on both sides, so 'A'
      // is not absorbed into the index.
      expect(result.type).toBe("Anexo");
      expect(result.index).toBe("IV");
      expect(result.content).toBe("A");
    });

    it('documenta comportamento atual: "Anexo Único" yields no index', () => {
      const result = parse("Anexo Único");

      expect(result.type).toBe("Anexo");
      expect(result.index).toBeUndefined();
      expect(result.content).toBe("Único");
    });

    it('documenta comportamento atual: "ANEXO ÚNICO" yields no index', () => {
      const result = parse("ANEXO ÚNICO");

      expect(result.type).toBe("Anexo");
      expect(result.index).toBeUndefined();
      expect(result.content).toBe("ÚNICO");
    });

    it('documenta comportamento atual: a bare "ANEXO" falls through to Texto', () => {
      const result = parse("ANEXO");

      // The rule requires SPACE_PLUS after ANEXO.
      expect(result.type).toBe("Texto");
      expect(result.content).toBe("ANEXO");
    });
  });

  describe("7. revoked / vetoed lines (specialSituations)", () => {
    it("flags a line fully wrapped in <s> as Revogação", () => {
      const result = parse("<s>Art. 1º Fica revogado o dispositivo.</s>");

      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("1º");
      expect(result.specialSituations).toEqual([
        { type: "Revogação", date: "", relatedDeviceId: "Texto Original" },
      ]);
    });

    it("flags a line fully wrapped in <strike> as Revogação", () => {
      const result = parse(
        "<strike>Art. 2º Fica revogado o dispositivo.</strike>",
      );

      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("2º");
      expect(result.specialSituations).toEqual([
        { type: "Revogação", date: "", relatedDeviceId: "Texto Original" },
      ]);
    });

    it("prefers Veto over Revogação when the line contains (VETADO)", () => {
      const result = parse("<s>Art. 3º (VETADO)</s>");

      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("3º");
      expect(result.specialSituations).toEqual([
        { type: "Veto", date: "", relatedDeviceId: "Texto Original" },
      ]);
    });

    it('documenta comportamento atual: a plain "(REVOGADO)" marker without a strike tag produces no situation', () => {
      const result = parse("Art. 4º (REVOGADO)");

      // The outer guard requires <s>/<strike>/line-through, so the very
      // common consolidated-text marker is silently ignored.
      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("4º");
      expect(result.content).toBe("(REVOGADO)");
      expect(result.specialSituations).toEqual([]);
    });

    it("documenta comportamento atual: text-decoration: line-through alone produces no situation", () => {
      const result = parse(
        '<span style="text-decoration: line-through">Art. 5º Fica revogado.</span>',
      );

      // Outer guard passes, but the inner heuristic requires the line to
      // start with <s>/<strike> or to contain (REVOGADO)/(VETADO). This is
      // exactly how strikethrough pasted from Word/Google Docs arrives.
      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("5º");
      expect(result.specialSituations).toEqual([]);
    });

    it("documenta comportamento atual: a strike tag not wrapping the whole line produces no situation", () => {
      const result = parse(
        "<s>Art. 6º Fica revogado.</s> observação posterior",
      );

      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("6º");
      expect(result.content).toBe("Fica revogado.</s> observação posterior");
      expect(result.specialSituations).toEqual([]);
    });

    it("returns an empty array (not undefined) for a normal article", () => {
      const result = parse(
        "Art. 7º Esta lei entra em vigor na data de sua publicação.",
      );

      expect(result.specialSituations).toBeDefined();
      expect(Array.isArray(result.specialSituations)).toBe(true);
      expect(result.specialSituations).toEqual([]);
    });
  });

  describe("8. lines that must NOT be parsed as structure", () => {
    const plainTextLines = [
      "Ficam revogados os arts. 1º e 2º da Lei nº 16.402, de 22 de março de 2016.",
      "LEI Nº 16.402, DE 22 DE MARÇO DE 2016",
      "O PREFEITO DO MUNICÍPIO DE SÃO PAULO, no uso das atribuições que lhe são conferidas por lei,",
      "DECRETA:",
      "PROMULGA A SEGUINTE LEI:",
      "São Paulo, 22 de março de 2016, 463º da fundação de São Paulo.",
      "Esta lei entra em vigor na data de sua publicação.",
    ];

    for (const line of plainTextLines) {
      it(`keeps as Texto: "${line.slice(0, 48)}"`, () => {
        const result = parse(line);

        expect(result.type).toBe("Texto");
        expect(result.content).toBe(line);
        expect(result.index).toBeUndefined();
        expect(result.ruleId).toBeUndefined();
        expect(result.specialSituations).toBeUndefined();
      });
    }

    it('documenta comportamento atual: letter-spaced "D E C R E T A :" is mis-parsed as Inciso D', () => {
      const result = parse("D E C R E T A :");

      // Suspected bug: the `inciso` rule sees the leading 'D' plus a space
      // separator. Realistic OCR artifact of an enacting clause.
      expect(result.type).toBe("Inciso");
      expect(result.ruleId).toBe("inciso");
      expect(result.index).toBe("D");
      expect(result.content).toBe("E C R E T A :");
    });

    it("returns the RAW (untrimmed) line for the Texto fallback", () => {
      const line = "   Esta lei entra em vigor na data de sua publicação.   ";
      const result = parse(line);

      expect(result.type).toBe("Texto");
      expect(result.content).toBe(line);
      expect(result.content).not.toBe(line.trim());
    });
  });

  describe("9. whitespace and degenerate input", () => {
    it("handles an empty string", () => {
      const result = parse("");

      expect(result.type).toBe("Texto");
      expect(result.content).toBe("");
    });

    it("handles a spaces-only line without trimming the fallback content", () => {
      const result = parse("   ");

      expect(result.type).toBe("Texto");
      expect(result.content).toBe("   ");
    });

    it("handles a tab-only line", () => {
      const result = parse("\t");

      expect(result.type).toBe("Texto");
      expect(result.content).toBe("\t");
    });

    it("still matches an article surrounded by stray whitespace and trims its content", () => {
      const result = parse("   Art. 1º  Fica instituído o Plano Diretor.  ");

      expect(result.type).toBe("Artigo");
      expect(result.index).toBe("1º");
      expect(result.content).toBe("Fica instituído o Plano Diretor.");
    });

    it("keeps a hyphen-only separator line as Texto", () => {
      const result = parse("---");

      expect(result.type).toBe("Texto");
      expect(result.content).toBe("---");
    });

    it("keeps an ellipsis-only line as Texto", () => {
      const result = parse("...");

      expect(result.type).toBe("Texto");
      expect(result.content).toBe("...");
    });

    it("identifies parenthesized and prefixed notes as Nota", () => {
      const numericNote = parse("(1) Texto da nota explicativa.");
      expect(numericNote.type).toBe("Nota");
      expect(numericNote.index).toBe("1");
      expect(numericNote.content).toBe("Texto da nota explicativa.");

      const dashedNote = parse("(4A - a) - Parâmetro especial aplicável.");
      expect(dashedNote.type).toBe("Nota");
      expect(dashedNote.index).toBe("4A - a");
      expect(dashedNote.content).toBe("Parâmetro especial aplicável.");

      const explicitNote = parse("Nota (2): Observação técnica complementar.");
      expect(explicitNote.type).toBe("Nota");
      expect(explicitNote.index).toBe("2");
      expect(explicitNote.content).toBe("Observação técnica complementar.");
    });
  });

  describe("10. custom rules and priority", () => {
    const makeEmentaRule = (priority: number): ParsingRule => ({
      id: `ementa_custom_${priority}`,
      name: "Ementa customizada",
      regex: /^Art\.\s*\d+/i,
      type: "Nota",
      priority,
      extract: () => ({
        index: "custom",
        content: "capturado pela regra customizada",
      }),
    });

    it("works with no arguments", () => {
      const bare = new RulesEngine();

      expect(bare.parseLine("Art. 1º Fica aprovado.").type).toBe("Artigo");
    });

    it("lets a custom rule with a LOWER priority number win over the default artigo rule", () => {
      const custom = new RulesEngine([makeEmentaRule(1)]);
      const result = custom.parseLine("Art. 1º Fica aprovado o plano.");

      expect(result.type).toBe("Nota");
      expect(result.ruleId).toBe("ementa_custom_1");
      expect(result.index).toBe("custom");
      expect(result.content).toBe("capturado pela regra customizada");
    });

    it("lets the default artigo rule win over a custom rule with a HIGHER priority number", () => {
      const custom = new RulesEngine([makeEmentaRule(100)]);
      const result = custom.parseLine("Art. 1º Fica aprovado o plano.");

      expect(result.type).toBe("Artigo");
      expect(result.ruleId).toBe("artigo");
      expect(result.index).toBe("1º");
      expect(result.content).toBe("Fica aprovado o plano.");
    });

    it("does not leak custom rules into other engine instances", () => {
      new RulesEngine([makeEmentaRule(1)]);

      expect(engine.parseLine("Art. 1º Fica aprovado o plano.").ruleId).toBe(
        "artigo",
      );
    });

    it("lets a custom rule capture a line the defaults would leave as Texto", () => {
      const ementaRule: ParsingRule = {
        id: "lei_header",
        name: "Cabeçalho da lei",
        regex: /^LEI\s+N[ºo°]?\s*([\d.]+)/i,
        type: "Nota",
        priority: 1,
        extract: (m) => ({ index: m[1], content: "" }),
      };
      const custom = new RulesEngine([ementaRule]);
      const result = custom.parseLine("LEI Nº 16.402, DE 22 DE MARÇO DE 2016");

      expect(result.type).toBe("Nota");
      expect(result.ruleId).toBe("lei_header");
      expect(result.index).toBe("16.402");
    });
  });

  describe("11. full-document integration", () => {
    it("parses a realistic São Paulo law excerpt into the expected type sequence", () => {
      const document = [
        "LEI Nº 16.402, DE 22 DE MARÇO DE 2016",
        "Disciplina o parcelamento, o uso e a ocupação do solo do Município de São Paulo.",
        "FERNANDO HADDAD, Prefeito do Município de São Paulo, no uso das atribuições que lhe são conferidas por lei,",
        "DECRETA:",
        "TÍTULO I",
        "DAS DISPOSIÇÕES PRELIMINARES",
        "CAPÍTULO I",
        "DOS PRINCÍPIOS E OBJETIVOS",
        "Art. 1º Esta lei disciplina o parcelamento, o uso e a ocupação do solo.",
        "§ 1º São objetivos desta lei:",
        "I - ordenar o pleno desenvolvimento das funções sociais da cidade;",
        "a) a função social da propriedade urbana;",
        "1. o coeficiente de aproveitamento máximo;",
        "Parágrafo único. Aplica-se o disposto nesta lei a todo o território municipal.",
        "<s>Art. 2º Ficam revogados os incisos I e II do art. 1º.</s>",
        "Art. 3º Esta lei entra em vigor na data de sua publicação.",
        "ANEXO I",
        "QUADRO DE USOS E PARÂMETROS DE OCUPAÇÃO",
        "São Paulo, 22 de março de 2016, 463º da fundação de São Paulo.",
        "FERNANDO HADDAD, PREFEITO",
      ];

      const results = document.map(parse);

      expect(results.map((r) => r.type)).toEqual([
        "Texto",
        "Texto",
        "Texto",
        "Texto",
        "Título",
        "Texto",
        "Capítulo",
        "Texto",
        "Artigo",
        "Parágrafo",
        "Inciso",
        "Alínea",
        "Item",
        "Parágrafo",
        "Artigo",
        "Artigo",
        "Anexo",
        "Texto",
        "Texto",
        "Texto",
      ]);
    });

    it("keeps the indexes and the revocation flag of the excerpt consistent", () => {
      const document = [
        "TÍTULO I",
        "CAPÍTULO I",
        "Art. 1º Esta lei disciplina o parcelamento, o uso e a ocupação do solo.",
        "§ 1º São objetivos desta lei:",
        "I - ordenar o pleno desenvolvimento das funções sociais da cidade;",
        "a) a função social da propriedade urbana;",
        "1. o coeficiente de aproveitamento máximo;",
        "Parágrafo único. Aplica-se o disposto nesta lei a todo o território municipal.",
        "<s>Art. 2º Ficam revogados os incisos I e II do art. 1º.</s>",
        "ANEXO I",
      ];

      const results = document.map(parse);

      expect(results.map((r) => r.index)).toEqual([
        "I",
        "I",
        "1º",
        "1º",
        "I",
        "a",
        "1",
        "único",
        "2º",
        "I",
      ]);

      expect(results.map((r) => r.ruleId)).toEqual([
        "titulo",
        "capitulo",
        "artigo",
        "paragrafo",
        "inciso",
        "alinea",
        "item",
        "paragrafo_unico",
        "artigo",
        "anexo",
      ]);

      const revoked = results.filter(
        (r) => (r.specialSituations ?? []).length > 0,
      );
      expect(revoked).toHaveLength(1);
      expect(revoked[0].index).toBe("2º");
      expect(revoked[0].specialSituations).toEqual([
        { type: "Revogação", date: "", relatedDeviceId: "Texto Original" },
      ]);
    });
  });
});
