// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  buildUsoHierarchy,
  getRegrasZonamento,
  getCondicoesInstalacao,
  pesquisarUsos,
} from "../../../components/ProspectiveSearch/utils/use-logic";
import {
  NOTAS_DICTIONARY,
  formatParameter,
} from "../../../components/ProspectiveSearch/utils/labels";

describe("FIU & Prospective Intended Use Cross-Referencing", () => {
  const mockUsosData = [
    {
      Código: "nR1",
      Divisão: "Subcategoria de uso",
      Descrição: "Uso não residencial compatível com a vizinhança residencial",
      "Categoria de uso": "nR",
    },
    {
      Código: "nR1-1",
      Divisão: "Grupo de atividades",
      Descrição: "Comércio de abastecimento de âmbito local",
      "Subcategoria de uso": "nR1",
    },
    {
      Código: "nR1-1-3",
      Divisão: "Atividade",
      Descrição:
        "Padaria e confeitaria com venda preponderante a varejo",
      "Grupo de atividades ou Tipologia": "nR1-1",
    },
  ];

  const mockCnaeData = [
    {
      "Subclasses (CNAE 2.2)": "10.91-1/02",
      "Denominação (CNAE 2.2)":
        "Fabricação de produtos de padaria e confeitaria com predominância de produção própria",
      Atividade: "nR1-1-3",
      "Descrição Complementar (Município de São Paulo, onde constam restrições municipais)":
        "Permitida a fabricação própria associada à comercialização no varejo com área computável até 500m².",
    },
  ];

  const mockUsosPorZonaData = [
    {
      categoriaUsoTipologia: "nR1-1",
      ZM: "S",
      ZER1: "N",
      ZCOR1: "S (4 - a)",
      ZEU: "S",
      ZOE: "Regime Especial",
    },
  ];

  const mockParametrosUsoData = [
    {
      subcategoriaUsoGruposAtividadeUsosEspecificos: "nR1-1",
      numeroMinimoVagasAutomoveisPorAreaConstruidaOuUnidadesHabitacionaisUh:
        "1 vaga a cada 70 m² de área computável (4A - a)",
      larguraMinimaVia: "10 m (4A - j)",
      areaEmbarqueDesembarquePassageiros: "Dispensada",
    },
  ];

  it("should build correct use hierarchy for municipal activity", () => {
    const hierarchy = buildUsoHierarchy("nR1-1-3", mockUsosData);
    expect(hierarchy.subtipologiaOuAtividade?.["Código"]).toBe("nR1-1-3");
    expect(hierarchy.tipologiaOuGrupo?.["Código"]).toBe("nR1-1");
    expect(hierarchy.subcategoria?.["Código"]).toBe("nR1");
  });

  it("should find use through CNAE search mode", () => {
    const result = pesquisarUsos("10.91-1/02", mockUsosData, mockCnaeData, "cnae");
    expect(result.resultados.length).toBeGreaterThan(0);
    expect(result.resultados[0].item["Código"]).toBe("nR1-1-3");
    expect(result.resultados[0].cnaeOriginario).toBeDefined();
  });

  it("should correctly cross-reference Quadro 4 zoning permissibility", () => {
    const regras = getRegrasZonamento("nR1-1", mockUsosPorZonaData);
    expect(regras).not.toBeNull();
    if (!regras) return;

    expect(regras.simSemNota).toContain("ZM");
    expect(regras.simSemNota).toContain("ZEU");
    expect(regras.naoSemNota).toContain("ZER1");
    expect(regras.simComNota["(4 - a)"]).toContain("ZCOR1");
    expect(regras.zoeZep).toContain("ZOE");
  });

  it("should extract Quadro 4A installation conditions with valid statutory notes", () => {
    const condicoes = getCondicoesInstalacao("nR1-1", mockParametrosUsoData);
    expect(condicoes.length).toBeGreaterThan(0);

    const vagas = condicoes.find((c) =>
      c.parametro.includes("numeroMinimoVagasAutomoveis"),
    );
    expect(vagas).toBeDefined();
    expect(vagas?.valor).toContain("1 vaga a cada 70 m²");
    expect(vagas?.notas).toContain("(4A - a)");

    const formattedParam = formatParameter(vagas?.parametro || "");
    expect(formattedParam).toContain("vagas de automóveis");
  });

  it("should match legal note content from NOTAS_DICTIONARY without double parentheses", () => {
    const noteContent = NOTAS_DICTIONARY["4A - a"];
    expect(noteContent).toBeDefined();
    expect(noteContent).toContain("Não se aplica nas zonas de uso ZEU");
  });
});
