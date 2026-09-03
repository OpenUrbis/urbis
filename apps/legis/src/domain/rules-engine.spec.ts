import { describe, it, expect } from "vitest";
import { RulesEngine } from "./rules-engine";

describe("RulesEngine", () => {
  const engine = new RulesEngine();

  it("should parse Articles correctly", () => {
    const line = "Art. 1º Fica instituída...";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Artigo");
    expect(result.index).toBe("1º");
    expect(result.content).toBe("Fica instituída...");
  });

  it("should parse Articles with thousand separators correctly", () => {
    const line = "Art. 1.000. A sociedade simples que instituir sucursal...";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Artigo");
    expect(result.index).toBe("1000");
    expect(result.content).toBe(
      "A sociedade simples que instituir sucursal...",
    );
  });

  it("should parse structural headings with spaced letters and arbitrary index text", () => {
    const line = "P A R T E   G E R A L";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Parte");
    expect(result.index).toBe("G E R A L");
    expect(result.content).toBe("");
  });

  it("should not merge chapter index with the beginning of the title content", () => {
    const line = "CAPÍTULO I Da Personalidade e da Capacidade";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Capítulo");
    expect(result.index).toBe("I");
    expect(result.content).toBe("Da Personalidade e da Capacidade");
  });

  it("should parse structural headings with non-roman indices", () => {
    const line = "TÍTULO ESPECIAL";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Título");
    expect(result.index).toBe("ESPECIAL");
    expect(result.content).toBe("");
  });

  it("should parse Paragraphs correctly", () => {
    const line1 = "§ 1º O sistema...";
    const result1 = engine.parseLine(line1);
    expect(result1.type).toBe("Parágrafo");
    expect(result1.index).toBe("1º");
    expect(result1.content).toBe("O sistema...");

    const line2 = "Parágrafo único. A identificação...";
    const result2 = engine.parseLine(line2);
    expect(result2.type).toBe("Parágrafo");
    expect(result2.index).toBe("único");
    expect(result2.content).toBe("A identificação...");
  });

  it("should parse Incisos correctly", () => {
    const line = "I - identificação...";
    const result = engine.parseLine(line);
    expect(result.type).toBe("Inciso");
    expect(result.index).toBe("I");
    expect(result.content).toBe("identificação...");
  });

  it("should parse Incisos with dot separator correctly", () => {
    const line = "I. identificação...";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Inciso");
    expect(result.index).toBe("I");
    expect(result.content).toBe("identificação...");
  });

  it("should parse dotted numeric indexes as item", () => {
    const line =
      "8.1.2. Admite-se a adoção de outro sistema ou tecnologia que assegure o mesmo desempenho";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Item");
    expect(result.index).toBe("8.1.2.");
    expect(result.content).toBe(
      "Admite-se a adoção de outro sistema ou tecnologia que assegure o mesmo desempenho",
    );
  });

  it("should parse dotted numeric item indexes with optional spaces between segments", () => {
    const line = "9. 9. 1. detalhamento complementar...";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Item");
    expect(result.index).toBe("9.9.1.");
    expect(result.content).toBe("detalhamento complementar...");
  });

  it("should parse alphanumeric hierarchical item indexes", () => {
    const line =
      "3.A. A descaracterização da Área de Preservação Permanente - APP deverá ser comprovada pelo interessado";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Item");
    expect(result.index).toBe("3.A.");
    expect(result.content).toBe(
      "A descaracterização da Área de Preservação Permanente - APP deverá ser comprovada pelo interessado",
    );
  });

  it("should parse nested alphanumeric hierarchical item indexes with optional spaces between segments", () => {
    const line =
      "3. A. 1. A execução de qualquer tipo de obra junto a represa deverá atender à legislação aplicável";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Item");
    expect(result.index).toBe("3.A.1.");
    expect(result.content).toBe(
      "A execução de qualquer tipo de obra junto a represa deverá atender à legislação aplicável",
    );
  });

  it("should parse Items correctly", () => {
    const line = "1 - detalhamento complementar...";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Item");
    expect(result.index).toBe("1");
    expect(result.content).toBe("detalhamento complementar...");
  });

  it("should parse Items with dot separator correctly", () => {
    const line = "1. detalhamento complementar...";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Item");
    expect(result.index).toBe("1");
    expect(result.content).toBe("detalhamento complementar...");
  });

  it("should parse Alíneas correctly", () => {
    const line = "a) coordenadas...";
    const result = engine.parseLine(line);
    expect(result.type).toBe("Alínea");
    expect(result.index).toBe("a");
    expect(result.content).toBe("coordenadas...");
  });

  it("should parse Alíneas with dot separator correctly", () => {
    const line = "a. coordenadas...";
    const result = engine.parseLine(line);

    expect(result.type).toBe("Alínea");
    expect(result.index).toBe("a");
    expect(result.content).toBe("coordenadas...");
  });

  it("should fallback to Text when no rule matches", () => {
    const line = "Texto comum sem prefixo normativo.";
    const result = engine.parseLine(line);
    expect(result.type).toBe("Texto");
    expect(result.content).toBe("Texto comum sem prefixo normativo.");
  });
});
