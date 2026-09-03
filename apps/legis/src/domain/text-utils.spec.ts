import { describe, expect, it } from "vitest";
import { getCleanDisplayText, stripRedundantLeadingKey } from "./text-utils";

describe("text-utils", () => {
  it("should remove duplicated ordinal artifacts from article prefixes", () => {
    const result = getCleanDisplayText(
      "Art. 7º o Pode ser declarada a morte presumida, sem decretação de ausência:",
      "Artigo",
      "7",
    );

    expect(result).toBe(
      "Pode ser declarada a morte presumida, sem decretação de ausência:",
    );
  });

  it("should remove article prefixes with thousand separators when index is normalized", () => {
    const result = getCleanDisplayText(
      "Art. 1.000. A sociedade simples que instituir sucursal...",
      "Artigo",
      "1000",
    );

    expect(result).toBe("A sociedade simples que instituir sucursal...");
  });

  it("should preserve the current behavior for articles without thousand separators", () => {
    const result = getCleanDisplayText(
      "Art. 999. As modificações do contrato social...",
      "Artigo",
      "999",
    );

    expect(result).toBe("As modificações do contrato social...");
  });

  it("should remove hierarchical numeric inciso prefixes using the full dotted index", () => {
    const result = getCleanDisplayText(
      "3.8.1.2. Admite-se a adoção de outro sistema ou tecnologia",
      "Inciso",
      "3.8.1.2.",
    );

    expect(result).toBe("Admite-se a adoção de outro sistema ou tecnologia");
  });

  it("should remove two-level hierarchical item prefixes wrapped in HTML tags", () => {
    const result = getCleanDisplayText(
      '<span class="font-medium" style="color: rgb(0, 0, 0);"><strong>2.1.</strong> A implantação de qualquer edificação no lote deve atender às disposições previstas no PDE e LPUOS.</span>',
      "Item",
      "2.1.",
    );

    expect(result).toBe(
      "A implantação de qualquer edificação no lote deve atender às disposições previstas no PDE e LPUOS.</span>",
    );
  });

  it("should remove alphanumeric hierarchical item prefixes with optional spaces between segments", () => {
    const result = getCleanDisplayText(
      "3. A. 1. A execução de qualquer tipo de obra junto a represa deverá atender às disposições legais",
      "Item",
      "3.A.1.",
    );

    expect(result).toBe(
      "A execução de qualquer tipo de obra junto a represa deverá atender às disposições legais",
    );
  });

  it("should remove inciso prefixes with dot separator", () => {
    const result = getCleanDisplayText("I. identificação...", "Inciso", "I");

    expect(result).toBe("identificação...");
  });

  it("should remove item prefixes with dot separator", () => {
    const result = getCleanDisplayText(
      "1. detalhamento complementar...",
      "Item",
      "1",
    );

    expect(result).toBe("detalhamento complementar...");
  });

  it("should remove item prefixes with dash separator", () => {
    const result = getCleanDisplayText(
      "1 - detalhamento complementar...",
      "Item",
      "1",
    );

    expect(result).toBe("detalhamento complementar...");
  });

  it("should remove alínea prefixes with dot separator", () => {
    const result = getCleanDisplayText("a. coordenadas...", "Alínea", "a");

    expect(result).toBe("coordenadas...");
  });

  it("should remove leftover formatted inciso keys from the rendered text", () => {
    const result = stripRedundantLeadingKey(
      getCleanDisplayText(
        "<p><strong>I</strong> - socialização dos ganhos da produção da cidade;</p>",
        "Inciso",
        "I",
      ),
      "I - ",
    );

    expect(result).toBe("socialização dos ganhos da produção da cidade;");
  });
});
