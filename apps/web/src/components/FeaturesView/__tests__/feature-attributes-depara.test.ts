import { describe, it, expect } from "vitest";
import {
  getFeatureDisplayLabel,
  getAttributeDisplayLabel,
  formatAttributeValue,
} from "../FeatureAttributesTable";

describe("FeatureAttributesTable - DE-PARA e Formatação", () => {
  describe("getFeatureDisplayLabel", () => {
    it("deve priorizar layerSchemaName ou layer_name explícito", () => {
      expect(getFeatureDisplayLabel({ layerSchemaName: "Lotes Customizados" })).toBe(
        "Lotes Customizados"
      );
      expect(getFeatureDisplayLabel({ layer_name: "Zoneamento Especial" })).toBe(
        "Zoneamento Especial"
      );
    });

    it("deve buscar o nome configurado no layerSchema correspondente", () => {
      const schemas = [
        { id: "view_lote_cidadao", name: "Lotes Fiscais do Cidadão" },
        { id: "geosampa:sirgas_zoneamento_sub_lpuos2016", name: "Zoneamento LPUOS 2016" },
      ];

      expect(
        getFeatureDisplayLabel({}, "slui:view_lote_cidadao", schemas)
      ).toBe("Lotes Fiscais do Cidadão");

      expect(
        getFeatureDisplayLabel({}, "sirgas_zoneamento_sub_lpuos2016", schemas)
      ).toBe("Zoneamento LPUOS 2016");
    });

    it("deve aplicar o DE-PARA global para camadas canônicas quando não houver schema no backend", () => {
      expect(getFeatureDisplayLabel({}, "sirgas_lote_fiscal")).toBe("Lotes Fiscais");
      expect(getFeatureDisplayLabel({}, "sirgas_macroareas")).toBe("Macroáreas (PDE)");
      expect(getFeatureDisplayLabel({}, "cit_imoveis")).toBe("Patrimônio Cultural — Imóveis (CIT)");
    });
  });

  describe("getAttributeDisplayLabel", () => {
    it("deve priorizar attributeMapping configurado no layerSchema", () => {
      const layerSchema = {
        properties: {
          attributeMapping: {
            cd_setor_fiscal: {
              label: "Setor do Imóvel",
              description: "Código de 3 dígitos do setor fiscal",
            },
          },
        },
      };

      const result = getAttributeDisplayLabel("cd_setor_fiscal", layerSchema);
      expect(result.label).toBe("Setor do Imóvel");
      expect(result.description).toBe("Código de 3 dígitos do setor fiscal");
    });

    it("deve aplicar o DE-PARA global para campos comuns do cadastro e tributário", () => {
      expect(getAttributeDisplayLabel("cd_setor_fiscal").label).toBe("Setor Fiscal");
      expect(getAttributeDisplayLabel("cd_quadra_fiscal").label).toBe("Quadra Fiscal");
      expect(getAttributeDisplayLabel("cd_lote").label).toBe("Lote Fiscal");
      expect(getAttributeDisplayLabel("cd_digito_sql").label).toBe("Dígito Verificador (DV)");
      expect(getAttributeDisplayLabel("cd_sql").label).toBe("SQL (Setor-Quadra-Lote)");
      expect(getAttributeDisplayLabel("tx_nome_logradouro").label).toBe("Logradouro");
      expect(getAttributeDisplayLabel("vl_area_terreno").label).toBe("Área do Terreno");
      expect(getAttributeDisplayLabel("tx_zoneamento_perimetro").label).toBe("Zoneamento");
      expect(getAttributeDisplayLabel("vl_venal_imovel").label).toBe("Valor Venal do Imóvel");
      expect(getAttributeDisplayLabel("numero_imovel_cif").label).toBe("Número do Imóvel no CIF (SQL)");
      expect(getAttributeDisplayLabel("an_legislacao_zoneamento").label).toBe("Ano da Legislação");
      expect(getAttributeDisplayLabel("dt_atualizacao").label).toBe("Data de Atualização");
      expect(getAttributeDisplayLabel("cd_usuario_atualizacao").label).toBe("Usuário de Atualização");
    });

    it("deve fazer fallback para formatação de texto em campos não mapeados", () => {
      expect(getAttributeDisplayLabel("meu_campo_customizado").label).toBe("Meu Campo Customizado");
    });
  });

  describe("formatAttributeValue", () => {
    it("deve formatar valores monetários em R$", () => {
      expect(formatAttributeValue(1500000.5, "vl_venal_imovel").display).toBe("R$ 1.500.000,50");
      expect(formatAttributeValue(3500.25, "valor_m2_terreno").display).toBe("R$ 3.500,25");
    });

    it("deve formatar áreas em m²", () => {
      expect(formatAttributeValue(250.75, "vl_area_terreno").display).toBe("250,75 m²");
      expect(formatAttributeValue(1200, "area_construida").display).toBe("1.200 m²");
    });

    it("deve formatar porcentagens em %", () => {
      expect(formatAttributeValue(98.5, "totalareapercentage").display).toBe("98,5%");
    });

    it("deve formatar booleanos como Sim / Não", () => {
      expect(formatAttributeValue(true, "ativo").display).toBe("Sim");
      expect(formatAttributeValue(false, "ativo").display).toBe("Não");
    });

    it("deve formatar datas no formato pt-BR", () => {
      expect(formatAttributeValue("2024-05-18", "dt_cadastro").display).toBe("18/05/2024");
      expect(formatAttributeValue("2016-06-22 06:00:00+00:00", "dt_atualizacao").display).toBe("22/06/2016");
    });
  });
});
