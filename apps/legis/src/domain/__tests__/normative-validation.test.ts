import { describe, expect, it } from "vitest";

import type { ElementType, NormativeElementEntity } from "../entities";
import {
  validateElement,
  validateNormativeStructure,
} from "../normative-validation";

/**
 * Mensagens produzidas por `validateElement`. Mantidas aqui como literais para
 * que qualquer mudança de texto na fonte apareça explicitamente no diff.
 */
const digitMessage = (index: string) =>
  `Artigos e parágrafos em geral iniciam por número (encontrado: "${index}")`;
const ORDINAL_MESSAGE =
  'Artigos e parágrafos de 1 a 9 em geral são seguidos por sinal ordinal ("º")';
const romanMessage = (index: string) =>
  "Partes, Livros, Títulos, Capítulos, Seções, Subseções ou Incisos em geral iniciam com número" +
  ` romano (encontrado: "${index}")`;
const LOWERCASE_MESSAGE = "Alíneas em geral iniciam com letras minúsculas";
const CLOSING_PAREN_MESSAGE =
  'Não é necessário incluir o fechamento de parêntesis (")") no final da alínea';
const TRAILING_MESSAGE =
  "Não é necessário incluir espaços ou pontuação ao final do item";

const ROMAN_TYPES: ElementType[] = [
  "Parte",
  "Livro",
  "Título",
  "Capítulo",
  "Seção",
  "Subseção",
  "Inciso",
];

function makeElement(
  type: ElementType,
  index?: string,
  id = `${type}-${index ?? "sem-indice"}`,
): NormativeElementEntity {
  return {
    id,
    type,
    index,
    text: "Texto do dispositivo.",
    originalStartValidity: { date: "01.01.2024", deviceId: "documento-1" },
    specialSituations: [],
  };
}

const messagesFor = (type: ElementType, index?: string) =>
  validateElement(makeElement(type, index)).map((issue) => issue.message);

describe("validateElement - artigos e parágrafos devem iniciar por número", () => {
  it("warns when the index does not start with a digit", () => {
    expect(messagesFor("Artigo", "Primeiro")).toEqual([
      digitMessage("Primeiro"),
    ]);
    expect(messagesFor("Parágrafo", "Segundo")).toEqual([
      digitMessage("Segundo"),
    ]);
  });

  it('exempts "único" in any casing', () => {
    expect(messagesFor("Parágrafo", "único")).toEqual([]);
    expect(messagesFor("Parágrafo", "Único")).toEqual([]);
    expect(messagesFor("Parágrafo", "ÚNICO")).toEqual([]);
    expect(messagesFor("Artigo", "único")).toEqual([]);
  });

  it('does not extend the "único" exemption to unaccented or padded variants', () => {
    expect(messagesFor("Parágrafo", "unico")).toEqual([digitMessage("unico")]);
    expect(messagesFor("Parágrafo", "único ")).toEqual([
      digitMessage("único "),
      TRAILING_MESSAGE,
    ]);
  });

  it("accepts indexes that merely start with a digit", () => {
    expect(messagesFor("Artigo", "10")).toEqual([]);
    expect(messagesFor("Artigo", "1º-A")).toEqual([]);
  });
});

describe("validateElement - sinal ordinal de 1 a 9", () => {
  it("warns for numbers from 1 to 9 without an ordinal sign", () => {
    for (const index of ["1", "2", "5", "9"]) {
      expect(messagesFor("Artigo", index)).toEqual([ORDINAL_MESSAGE]);
      expect(messagesFor("Parágrafo", index)).toEqual([ORDINAL_MESSAGE]);
    }
  });

  it("accepts any of the recognised ordinal signs", () => {
    for (const index of ["1º", "2°", "3o", "4ª"]) {
      expect(messagesFor("Artigo", index)).toEqual([]);
    }
  });

  it("does not require an ordinal sign from 10 onwards", () => {
    for (const index of ["10", "11", "99", "100"]) {
      expect(messagesFor("Artigo", index)).toEqual([]);
    }

    expect(messagesFor("Artigo", "10-A")).toEqual([]);
  });

  it("still requires the ordinal sign on suffixed low numbers", () => {
    expect(messagesFor("Artigo", "9-A")).toEqual([ORDINAL_MESSAGE]);
  });

  it("only applies the numeric rules to artigos and parágrafos", () => {
    expect(messagesFor("Item", "1")).toEqual([]);
    expect(messagesFor("Texto", "Preâmbulo")).toEqual([]);
  });
});

describe("validateElement - números romanos", () => {
  it("warns for every roman type whose index is not a roman numeral", () => {
    for (const type of ROMAN_TYPES) {
      expect(messagesFor(type, "1")).toEqual([romanMessage("1")]);
      expect(messagesFor(type, "A")).toEqual([romanMessage("A")]);
    }
  });

  it("accepts roman numerals in upper and lower case", () => {
    for (const type of ROMAN_TYPES) {
      expect(messagesFor(type, "I")).toEqual([]);
      expect(messagesFor(type, "IV")).toEqual([]);
      expect(messagesFor(type, "XLII")).toEqual([]);
      expect(messagesFor(type, "i")).toEqual([]);
      expect(messagesFor(type, "xii")).toEqual([]);
    }
  });

  it("accepts any combination of roman letters, without validating the numeral itself", () => {
    expect(messagesFor("Capítulo", "VVV")).toEqual([]);
    expect(messagesFor("Inciso", "IIII")).toEqual([]);
    expect(messagesFor("Título", "mix")).toEqual([]);
  });

  it("does not apply the roman rule to other types", () => {
    expect(messagesFor("Anexo", "1")).toEqual([]);
    expect(messagesFor("Item", "a")).toEqual([]);
    expect(messagesFor("Divisão desconforme", "1")).toEqual([]);
  });

  it("warns about the decorated index when a roman numeral carries punctuation", () => {
    expect(messagesFor("Inciso", "IV.")).toEqual([
      romanMessage("IV."),
      TRAILING_MESSAGE,
    ]);
    expect(messagesFor("Capítulo", "II -")).toEqual([
      romanMessage("II -"),
      TRAILING_MESSAGE,
    ]);
  });
});

describe("validateElement - índices hierárquicos pontilhados", () => {
  it("exempts hierarchical numeric incisos from the roman and trailing punctuation rules", () => {
    expect(messagesFor("Inciso", "1.1")).toEqual([]);
    expect(messagesFor("Inciso", "1.1.")).toEqual([]);
    expect(messagesFor("Inciso", "2.3.4.")).toEqual([]);
    expect(messagesFor("Inciso", "10.20.30")).toEqual([]);
  });

  it("exempts hierarchical dotted items from the trailing punctuation rule", () => {
    expect(messagesFor("Item", "1.a")).toEqual([]);
    expect(messagesFor("Item", "1.a.")).toEqual([]);
    expect(messagesFor("Item", "8.2.1.")).toEqual([]);
  });

  it("does not exempt incisos whose hierarchical index has a non numeric segment", () => {
    expect(messagesFor("Inciso", "1.A.")).toEqual([
      romanMessage("1.A."),
      TRAILING_MESSAGE,
    ]);
  });

  it("does not exempt single segment indexes", () => {
    expect(messagesFor("Item", "1.")).toEqual([TRAILING_MESSAGE]);
    expect(messagesFor("Inciso", "1.")).toEqual([
      romanMessage("1."),
      TRAILING_MESSAGE,
    ]);
  });
});

describe("validateElement - alíneas", () => {
  it("accepts lowercase letters", () => {
    expect(messagesFor("Alínea", "a")).toEqual([]);
    expect(messagesFor("Alínea", "z")).toEqual([]);
  });

  it("warns when the alínea starts with an uppercase letter", () => {
    expect(messagesFor("Alínea", "A")).toEqual([LOWERCASE_MESSAGE]);
  });

  it("warns when the alínea index already closes the parenthesis", () => {
    expect(messagesFor("Alínea", "a)")).toEqual([CLOSING_PAREN_MESSAGE]);
  });

  it("reports both alínea problems at once", () => {
    expect(messagesFor("Alínea", "A)")).toEqual([
      LOWERCASE_MESSAGE,
      CLOSING_PAREN_MESSAGE,
    ]);
  });

  it("exempts alíneas from the trailing punctuation rule", () => {
    expect(messagesFor("Alínea", "a.")).toEqual([]);
    expect(messagesFor("Alínea", "a ")).toEqual([]);
  });

  it("treats non ASCII lowercase letters as invalid openings", () => {
    expect(messagesFor("Alínea", "á")).toEqual([LOWERCASE_MESSAGE]);
    expect(messagesFor("Alínea", "1")).toEqual([LOWERCASE_MESSAGE]);
  });
});

describe("validateElement - pontuação e espaços finais", () => {
  it("warns for each kind of trailing punctuation on a non alínea index", () => {
    for (const suffix of [".", ",", ";", ":", "-", " "]) {
      expect(messagesFor("Artigo", `1º${suffix}`)).toEqual([TRAILING_MESSAGE]);
    }
  });

  it("warns for trailing whitespace of any kind", () => {
    expect(messagesFor("Anexo", "I\t")).toEqual([TRAILING_MESSAGE]);
    expect(messagesFor("Texto", "Nota:")).toEqual([TRAILING_MESSAGE]);
  });

  it("does not warn when the index ends with a letter, digit or ordinal sign", () => {
    expect(messagesFor("Anexo", "I")).toEqual([]);
    expect(messagesFor("Artigo", "12")).toEqual([]);
    expect(messagesFor("Artigo", "1º")).toEqual([]);
  });
});

describe("validateElement - índices ausentes", () => {
  it("produces no issues for elements without an index", () => {
    for (const type of [
      "Artigo",
      "Parágrafo",
      "Inciso",
      "Alínea",
      "Item",
    ] as ElementType[]) {
      expect(validateElement(makeElement(type))).toEqual([]);
      expect(validateElement(makeElement(type, ""))).toEqual([]);
    }
  });

  it("always reports issues as warnings and points back to the element id", () => {
    const element = makeElement("Alínea", "A)", "alinea-a");
    const issues = validateElement(element);

    expect(issues).toEqual([
      {
        elementId: "alinea-a",
        message: LOWERCASE_MESSAGE,
        severity: "warning",
      },
      {
        elementId: "alinea-a",
        message: CLOSING_PAREN_MESSAGE,
        severity: "warning",
      },
    ]);
  });
});

describe("validateNormativeStructure", () => {
  it("returns no issues for an empty structure", () => {
    expect(validateNormativeStructure([])).toEqual([]);
  });

  it("flattens the issues of every element, preserving id, message and severity", () => {
    const elements = [
      makeElement("Artigo", "1", "artigo-1"),
      makeElement("Inciso", "primeiro", "inciso-1"),
      makeElement("Alínea", "A)", "alinea-a"),
      makeElement("Artigo", "10", "artigo-10"),
    ];

    expect(validateNormativeStructure(elements)).toEqual([
      { elementId: "artigo-1", message: ORDINAL_MESSAGE, severity: "warning" },
      {
        elementId: "inciso-1",
        message: romanMessage("primeiro"),
        severity: "warning",
      },
      {
        elementId: "alinea-a",
        message: LOWERCASE_MESSAGE,
        severity: "warning",
      },
      {
        elementId: "alinea-a",
        message: CLOSING_PAREN_MESSAGE,
        severity: "warning",
      },
    ]);
  });

  it("returns no issues when every element is well formed", () => {
    const elements = [
      makeElement("Capítulo", "I"),
      makeElement("Artigo", "1º"),
      makeElement("Parágrafo", "único"),
      makeElement("Inciso", "II"),
      makeElement("Alínea", "b"),
      makeElement("Item", "1.a"),
    ];

    expect(validateNormativeStructure(elements)).toEqual([]);
  });
});
