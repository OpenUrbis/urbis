import { NormativeElementEntity, ElementType, OriginalNormativo, Authority } from "./entities";
import { parse, isBefore, isValid } from "date-fns";

export interface ValidationIssue {
  elementId: string;
  message: string;
  severity: "warning" | "error";
}

export function validateElement(
  element: NormativeElementEntity,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { type, index } = element;

  const isHierarchicalNumericInciso =
    type === "Inciso" && !!index && /^\d+(?:\.\d+)+\.?$/.test(index);
  const isHierarchicalDottedItem =
    type === "Item" && !!index && /^\d+(?:\.[A-Za-z0-9]+)+\.?$/.test(index);
  const isHierarchicalDottedList =
    isHierarchicalNumericInciso || isHierarchicalDottedItem;

  // Helper to check regex
  const matches = (str: string, regex: RegExp) => regex.test(str);

  // 1. Artigos e Parágrafos devem iniciar por número (exceto Parágrafo Único)
  if (
    (type === "Artigo" || type === "Parágrafo") &&
    index?.toLowerCase() !== "único"
  ) {
    if (index && !matches(index, /^\d/)) {
      issues.push({
        elementId: element.id,
        message: `Artigos e parágrafos em geral iniciam por número (encontrado: "${index}")`,
        severity: "warning",
      });
    }

    // 2. Artigos e Parágrafos de 1 a 9 devem ter ordinal
    if (index) {
      const numMatch = index.match(/^(\d+)/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (num >= 1 && num <= 9) {
          if (!matches(index, /[º°oᵒ∘ª]/)) {
            issues.push({
              elementId: element.id,
              message: `Artigos e parágrafos de 1 a 9 em geral são seguidos por sinal ordinal ("º")`,
              severity: "warning",
            });
          }
        }
      }
    }
  }

  // 3. Romanos para Parte, Livro, Título, Capítulo, Seção, Subseção, Inciso
  const romanTypes: ElementType[] = [
    "Parte",
    "Livro",
    "Título",
    "Capítulo",
    "Seção",
    "Subseção",
    "Inciso",
  ];
  if (romanTypes.includes(type) && index) {
    // Simple roman numeral check (I, V, X, L, C, D, M case insensitive)
    if (
      !isHierarchicalNumericInciso &&
      !matches(index, /^[IVXLCDMivxlcdm]+$/)
    ) {
      issues.push({
        elementId: element.id,
        message: `Partes, Livros, Títulos, Capítulos, Seções, Subseções ou Incisos em geral iniciam com número romano (encontrado: "${index}")`,
        severity: "warning",
      });
    }
  }

  // 4. Alíneas devem iniciar com letra minúscula
  if (type === "Alínea" && index) {
    if (!matches(index, /^[a-z]/)) {
      issues.push({
        elementId: element.id,
        message: `Alíneas em geral iniciam com letras minúsculas`,
        severity: "warning",
      });
    }

    // 5. Alínea não deve ter fechamento de parêntesis no índice (o sistema adiciona na renderização)
    if (index.endsWith(")")) {
      issues.push({
        elementId: element.id,
        message: `Não é necessário incluir o fechamento de parêntesis (")") no final da alínea`,
        severity: "warning", // or error if strict
      });
    }
  }

  // 6. Pontuação final no índice (exceto Alínea)
  if (type !== "Alínea" && index) {
    if (!isHierarchicalDottedList && matches(index, /[.,;:-\s]$/)) {
      issues.push({
        elementId: element.id,
        message: `Não é necessário incluir espaços ou pontuação ao final do item`,
        severity: "warning",
      });
    }
  }

  return issues;
}

export function validateNormativeStructure(
  elements: NormativeElementEntity[],
): ValidationIssue[] {
  return elements.flatMap(validateElement);
}

export function validateOriginalNormativoCopy(
  data: Partial<OriginalNormativo>,
  authority?: Authority | null,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!data.authorityId?.trim()) {
    issues.push({
      elementId: "metadata-authority",
      message: "Selecione uma autoridade emissora responsável pelo ato normativo.",
      severity: "error",
    });
  }

  if (!data.number?.trim() && !data.actDate?.trim() && !data.publicationDate?.trim()) {
    issues.push({
      elementId: "metadata-identification",
      message: "Preencha ao menos o número, data do ato ou data de publicação para identificar o documento.",
      severity: "error",
    });
  }

  if (data.actDate && data.publicationDate) {
    try {
      const act = parse(data.actDate, "dd.MM.yyyy", new Date());
      const pub = parse(data.publicationDate, "dd.MM.yyyy", new Date());
      if (isValid(act) && isValid(pub) && isBefore(pub, act)) {
        issues.push({
          elementId: "metadata-dates",
          message: "A data de publicação não pode ser anterior à data do ato.",
          severity: "error",
        });
      }
    } catch {
      // Ignora erro de parse
    }
  }

  if (authority && data.actDate) {
    try {
      const act = parse(data.actDate, "dd.MM.yyyy", new Date());
      const authStart = parse(authority.startDate, "dd.MM.yyyy", new Date());
      if (isValid(act) && isValid(authStart) && isBefore(act, authStart)) {
        issues.push({
          elementId: "metadata-authority-date",
          message: `A data do ato (${data.actDate}) é anterior ao início de vigência da autoridade (${authority.startDate}).`,
          severity: "warning",
        });
      }
    } catch {
      // Ignora erro de parse
    }
  }

  return issues;
}
