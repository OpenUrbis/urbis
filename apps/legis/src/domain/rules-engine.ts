import { ElementType, SpecialSituation } from "./types";

export interface ParsingResult {
  type: ElementType;
  index?: string;
  content: string;
  ruleId?: string;
  specialSituations?: SpecialSituation[];
}

export interface ParsingRule {
  id: string;
  name: string;
  regex: RegExp;
  type: ElementType;
  priority: number;
  extract: (match: RegExpMatchArray) => { index?: string; content: string };
}

// Regex helpers from script
const TAGS_PREFIX = "(?:</?(?:b|i|s|u|a|strong|em|strike|span)[^>]*>)*";
const SPACE = "[\\s.-]";
const SPACE_PLUS = SPACE + "+";
const SPACE_OPT = SPACE + "*";

function cleanExtractedContent(content: string): string {
  if (!content) return "";
  return content.replace(/^(?:<\/(?:b|i|s|u|a|strong|em|strike|span)>)+\s*/i, "").trim();
}

const STRUCTURAL_CONNECTOR_WORDS = new Set([
  "DA",
  "DAS",
  "DE",
  "DO",
  "DOS",
  "E",
]);

function spacedWordPattern(word: string): string {
  return word
    .split("")
    .map((char) => (/[A-Za-zÀ-ÿ]/.test(char) ? `${char}${SPACE_OPT}` : char))
    .join("");
}

function normalizeIndexToken(token: string): string {
  return token.replace(/[.]/g, "").trim();
}

function normalizeHierarchicalNumericIndex(index: string): string {
  const trimmed = index.trim();
  const segments = trimmed
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => segment.toUpperCase());

  return segments.join(".");
}

function isStandaloneStructuralIndexToken(token: string): boolean {
  const normalized = normalizeIndexToken(token)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (!normalized || STRUCTURAL_CONNECTOR_WORDS.has(normalized)) {
    return false;
  }

  return (
    /^[IVXLCDM]+$/.test(normalized) ||
    /^\d+$/.test(normalized) ||
    /^(?:[A-Z]+|\d+)(?:[-/](?:[A-Z]+|\d+))*$/.test(normalized)
  );
}

function extractStructuralIndexAndContent(rawValue: string): {
  index?: string;
  content: string;
} {
  const value = rawValue.trim();

  if (!value) {
    return { content: "" };
  }

  if (/^(?:[A-Za-zÀ-ÿ]\s+){1,}[A-Za-zÀ-ÿ]$/u.test(value)) {
    return { index: value, content: "" };
  }

  const [firstToken, ...rest] = value.split(/\s+/);
  if (!firstToken) {
    return { content: "" };
  }

  if (!rest.length) {
    return { index: firstToken, content: "" };
  }

  if (isStandaloneStructuralIndexToken(firstToken)) {
    return { index: firstToken, content: rest.join(" ") };
  }

  return { index: value, content: "" };
}

const PARTE_PATTERN = spacedWordPattern("PARTE");
const LIVRO_PATTERN = spacedWordPattern("LIVRO");
const TITULO_PATTERN = spacedWordPattern("TÍTULO");
const CAPITULO_PATTERN = spacedWordPattern("CAPÍTULO");
const SECAO_PATTERN = spacedWordPattern("SEÇÃO");
const SUBSECAO_PATTERN = spacedWordPattern("SUBSEÇÃO");
const ITEM_HIERARCHICAL_SEGMENT = "(?:\\d+|[A-Za-z])";

export const DEFAULT_RULES: ParsingRule[] = [
  {
    id: "parte",
    name: "Parte",
    regex: new RegExp(`^${TAGS_PREFIX}${PARTE_PATTERN}${SPACE_PLUS}(.*)`, "i"),
    type: "Parte",
    priority: 5,
    extract: (m) => extractStructuralIndexAndContent(m[1]),
  },
  {
    id: "livro",
    name: "Livro",
    regex: new RegExp(`^${TAGS_PREFIX}${LIVRO_PATTERN}${SPACE_PLUS}(.*)`, "i"),
    type: "Livro",
    priority: 6,
    extract: (m) => extractStructuralIndexAndContent(m[1]),
  },
  {
    id: "anexo",
    name: "Anexo",
    regex: new RegExp(
      `^${TAGS_PREFIX}ANEXO${SPACE_PLUS}([IVXLCDM]+(?:[-/][IVXLCDM]+)*)?${SPACE_OPT}[-–—:.]?${SPACE_OPT}(.*)`,
      "i",
    ),
    type: "Anexo",
    priority: 4, // prioridade alta (antes de Parte/Livro, pois vem geralmente no final)
    extract: (m) => {
      let index = m[1] ? m[1].toUpperCase().trim() : undefined;
      let content = m[2] ? m[2].trim() : "";

      // Se não veio número romano mas veio título depois de "Anexo"
      if (!index && content) {
        // Tenta separar o primeiro token como possível índice (ex: "III")
        const parts = content.split(/\s+/);
        if (/^[IVXLCDM]+$|^[0-9]+$/.test(parts[0])) {
          index = parts[0].toUpperCase();
          content = parts.slice(1).join(" ");
        }
      }

      // Normaliza índice romano ou arábico simples
      if (index) {
        index = normalizeIndexToken(index);
      }

      return { index, content };
    },
  },
  {
    id: "titulo",
    name: "Título",
    regex: new RegExp(`^${TAGS_PREFIX}${TITULO_PATTERN}${SPACE_PLUS}(.*)`, "i"),
    type: "Título",
    priority: 7,
    extract: (m) => extractStructuralIndexAndContent(m[1]),
  },
  {
    id: "capitulo",
    name: "Capítulo",
    regex: new RegExp(
      `^${TAGS_PREFIX}${CAPITULO_PATTERN}${SPACE_PLUS}(.*)`,
      "i",
    ),
    type: "Capítulo",
    priority: 10,
    extract: (m) => extractStructuralIndexAndContent(m[1]),
  },
  {
    id: "secao",
    name: "Seção",
    regex: new RegExp(`^${TAGS_PREFIX}${SECAO_PATTERN}${SPACE_PLUS}(.*)`, "i"),
    type: "Seção",
    priority: 11,
    extract: (m) => extractStructuralIndexAndContent(m[1]),
  },
  {
    id: "subsecao",
    name: "Subseção",
    regex: new RegExp(
      `^${TAGS_PREFIX}${SUBSECAO_PATTERN}${SPACE_PLUS}(.*)`,
      "i",
    ),
    type: "Subseção",
    priority: 12,
    extract: (m) => extractStructuralIndexAndContent(m[1]),
  },
  {
    id: "artigo",
    name: "Artigo",
    regex: new RegExp(
      `^${TAGS_PREFIX}Art(?:igo|\\.)${SPACE_OPT}(\\d{1,3}(?:\\.\\d{3})*|\\d+)[.º°oᵒ∘ª]?${SPACE_OPT}(.*)`,
      "i",
    ),
    type: "Artigo",
    priority: 20,
    extract: (m) => {
      const normalizedNumber = m[1].replace(/\./g, "");
      const num = parseInt(normalizedNumber, 10);
      const index = num >= 1 && num <= 9 ? `${num}º` : `${num}`;
      const content = cleanExtractedContent(m[2]);
      return { index, content };
    },
  },
  {
    id: "paragrafo_unico",
    name: "Parágrafo Único",
    regex: new RegExp(
      `^${TAGS_PREFIX}(?:PARÁGRAFO|PARAGRAFO)${SPACE_PLUS}ÚNICO${SPACE_OPT}(.*)`,
      "i",
    ),
    type: "Parágrafo",
    priority: 29,
    extract: (m) => ({ index: "único", content: cleanExtractedContent(m[1]) }),
  },
  {
    id: "paragrafo",
    name: "Parágrafo",
    regex: new RegExp(
      `^${TAGS_PREFIX}§${SPACE_OPT}(\\d+)[.º°oᵒ∘ª]?${SPACE_OPT}(.*)`,
      "i",
    ),
    type: "Parágrafo",
    priority: 30,
    extract: (m) => {
      const num = parseInt(m[1], 10);
      const index = num >= 1 && num <= 9 ? `${num}º` : `${num}`;
      return { index, content: cleanExtractedContent(m[2]) };
    },
  },
  {
    id: "alinea",
    name: "Alínea",
    regex: new RegExp(
      `^${TAGS_PREFIX}([a-z])${SPACE_OPT}[).–-]${SPACE_OPT}(.*)`,
    ),
    type: "Alínea",
    priority: 35,
    extract: (m) => ({ index: m[1], content: cleanExtractedContent(m[2]) }),
  },
  {
    id: "item_hierarchical",
    name: "Item Hierárquico",
    regex: new RegExp(
      `^${TAGS_PREFIX}((?:\\d+(?:\\s*\\.\\s*${ITEM_HIERARCHICAL_SEGMENT})+\\s*\\.))\\s*(.*)`,
      "i",
    ),
    type: "Item",
    priority: 37,
    extract: (m) => ({
      index: normalizeHierarchicalNumericIndex(m[1]),
      content: cleanExtractedContent(m[2]),
    }),
  },
  {
    id: "item",
    name: "Item",
    regex: new RegExp(
      `^${TAGS_PREFIX}(\\d+)${SPACE_OPT}(?:[\\s.\\-)–—]+)${SPACE_OPT}(.*)`,
      "i",
    ),
    type: "Item",
    priority: 38,
    extract: (m) => ({ index: m[1], content: cleanExtractedContent(m[2]) }),
  },
  {
    id: "inciso",
    name: "Inciso",
    regex: new RegExp(
      `^${TAGS_PREFIX}([IVXLCDM]+)${SPACE_OPT}(?:[\\s.\\-)–—]+)${SPACE_OPT}(.*)`,
      "i",
    ),
    type: "Inciso",
    priority: 40,
    extract: (m) => ({ index: m[1].toUpperCase(), content: cleanExtractedContent(m[2]) }),
  },
  {
    id: "nota",
    name: "Nota",
    regex: new RegExp(
      `^${TAGS_PREFIX}(?:NOTA${SPACE_OPT}(?:\\(([A-Za-z0-9]+(?:[\\s-–—.]+[A-Za-z0-9]+)*)\\)|([A-Za-z0-9]+))|\\(([A-Za-z0-9]+(?:[\\s-–—.]+[A-Za-z0-9]+)*)\\))${SPACE_OPT}[)\\s-–—:.]*${SPACE_OPT}(.*)`,
      "i",
    ),
    type: "Nota",
    priority: 45,
    extract: (m) => ({
      index: (m[1] || m[2] || m[3] || "").trim(),
      content: cleanExtractedContent(m[4]),
    }),
  },
];

export class RulesEngine {
  private rules: ParsingRule[];

  constructor(customRules: ParsingRule[] = []) {
    this.rules = [...DEFAULT_RULES, ...customRules].sort(
      (a, b) => a.priority - b.priority,
    );
  }

  parseLine(line: string): ParsingResult {
    const trimmed = line.trim();

    // 1. Detect if line is "riscado" (Revoked/Vetoed)
    let isRevoked = false;
    // Logic from script: checks if wrapped in <s> or if contains "REVOGADO"
    // If the *entire* content is wrapped in <s>, it's revoked.
    // We check this by removing outer tags and seeing if <s> wraps inner content?
    // Or simple regex check.
    if (
      /<s\b[^>]*>(.*?)<\/s>/i.test(trimmed) ||
      /<strike\b[^>]*>(.*?)<\/strike>/i.test(trimmed) ||
      /text-decoration:\s*line-through/i.test(trimmed)
    ) {
      // Heuristic: if it starts with <s> and ends with </s>
      if (
        (trimmed.startsWith("<s>") && trimmed.endsWith("</s>")) ||
        (trimmed.startsWith("<strike>") && trimmed.endsWith("</strike>"))
      ) {
        isRevoked = true;
      }
      // Or if it contains "(REVOGADO)" or "(VETADO)"
      if (/\(REVOGADO\)/i.test(trimmed) || /\(VETADO\)/i.test(trimmed)) {
        isRevoked = true;
      }
    }

    // We do NOT strip HTML for matching anymore, because we use regex that handles tags prefix.
    // This ensures bold/italic prefixes don't break matching.

    for (const rule of this.rules) {
      const match = trimmed.match(rule.regex);
      if (match) {
        const extracted = rule.extract(match);

        const situations: SpecialSituation[] = [];
        if (isRevoked) {
          // Refine type based on content
          let type: any = "Revogação";
          if (/\(VETADO\)/i.test(trimmed)) type = "Veto";

          situations.push({
            type: type,
            date: "",
            relatedDeviceId: "Texto Original",
          });
        }

        return {
          type: rule.type,
          index: extracted.index,
          content: extracted.content, // Return extracted content (stripped of prefix)
          ruleId: rule.id,
          specialSituations: situations,
        };
      }
    }

    return { type: "Texto", content: line };
  }
}
