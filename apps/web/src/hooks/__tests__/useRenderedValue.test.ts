import { describe, it, expect } from "vitest";
import { normalizeEjsData } from "../useRenderedValue";
import { render as ejsRender } from "ejs";

describe("normalizeEjsData and EJS rendering compatibility", () => {
  const mockGeoJsonFeature = {
    type: "Feature",
    id: "lotes.123",
    geometry: {
      type: "Polygon",
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
    },
    properties: {
      cd_setor_fiscal: "008",
      cd_quadra_fiscal: "076",
      cd_lote: "0098",
      cd_condominio: "00",
      nm_logradouro_completo: "R DOS GUSMOES",
      cd_numero_porta: "107",
      qt_area_terreno: 214,
      dc_tipo_uso_imovel: "Não residencial",
    },
  };

  const directProperties = {
    cd_setor_fiscal: "008",
    cd_quadra_fiscal: "076",
    cd_lote: "0098",
    cd_condominio: "00",
    nm_logradouro_completo: "R DOS GUSMOES",
    cd_numero_porta: "107",
    qt_area_terreno: 214,
    dc_tipo_uso_imovel: "Não residencial",
  };

  it("should render `<%- properties.field %>` with GeoJSON Feature data (builder preview / map feature)", () => {
    const context = normalizeEjsData(mockGeoJsonFeature);
    const template = "<%- properties.nm_logradouro_completo %>, <%- properties.cd_numero_porta %>";
    const result = ejsRender(template, context);
    expect(result).toBe("R DOS GUSMOES, 107");
  });

  it("should render `<%- properties.field %>` when data is only the properties object (live map query / details window)", () => {
    const context = normalizeEjsData(directProperties);
    const template = "<%- properties.nm_logradouro_completo %>, <%- properties.cd_numero_porta %>";
    const result = ejsRender(template, context);
    expect(result).toBe("R DOS GUSMOES, 107");
  });

  it("should render `<%- properties?.field ?? '-' %>` safely for missing properties in both modes", () => {
    const context1 = normalizeEjsData(mockGeoJsonFeature);
    const context2 = normalizeEjsData(directProperties);
    const template = "<%- properties?.campo_inexistente ?? '-' %>";

    expect(ejsRender(template, context1)).toBe("-");
    expect(ejsRender(template, context2)).toBe("-");
  });

  it("should render direct property names `<%- field %>` without requiring `properties.` prefix", () => {
    const context1 = normalizeEjsData(mockGeoJsonFeature);
    const context2 = normalizeEjsData(directProperties);
    const template = "<%- nm_logradouro_completo %> <%- cd_numero_porta %>";

    expect(ejsRender(template, context1)).toBe("R DOS GUSMOES 107");
    expect(ejsRender(template, context2)).toBe("R DOS GUSMOES 107");
  });

  it("should render `<%- data.field %>` and `<%- data.properties.field %>` correctly", () => {
    const context1 = normalizeEjsData(mockGeoJsonFeature);
    const context2 = normalizeEjsData(directProperties);

    expect(ejsRender("<%- data.nm_logradouro_completo %>", context1)).toBe("R DOS GUSMOES");
    expect(ejsRender("<%- data.properties.nm_logradouro_completo %>", context1)).toBe("R DOS GUSMOES");
    expect(ejsRender("<%- data.nm_logradouro_completo %>", context2)).toBe("R DOS GUSMOES");
    expect(ejsRender("<%- data.properties.nm_logradouro_completo %>", context2)).toBe("R DOS GUSMOES");
  });

  it("should render `<%- feature.properties.field %>` correctly", () => {
    const context1 = normalizeEjsData(mockGeoJsonFeature);
    const context2 = normalizeEjsData(directProperties);

    expect(ejsRender("<%- feature.properties.nm_logradouro_completo %>", context1)).toBe("R DOS GUSMOES");
    expect(ejsRender("<%- feature.properties.nm_logradouro_completo %>", context2)).toBe("R DOS GUSMOES");
  });

  it("should execute JS scriptlets with calculations as used in seeds", () => {
    const context = normalizeEjsData(directProperties);
    const template = "<% const areaTerreno = Number(properties?.qt_area_terreno); %><%- Number.isFinite(areaTerreno) ? areaTerreno.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' m²' : '-' %>";
    const result = ejsRender(template, context);
    expect(result).toBe("214,00 m²");
  });

  it("should support response objects (e.g. from RequestWrapper or intersections)", () => {
    const dataWithResponse = {
      ...mockGeoJsonFeature,
      response: {
        features: [{ id: "zone1" }, { id: "zone2" }],
        totalCount: 2,
      },
    };
    const context = normalizeEjsData(dataWithResponse);
    const template = "<%- response.features.length %> zonas (<%- properties.nm_logradouro_completo %>)";
    const result = ejsRender(template, context);
    expect(result).toBe("2 zonas (R DOS GUSMOES)");
  });

  it("should handle null/undefined data safely without throwing", () => {
    const context1 = normalizeEjsData(null);
    const context2 = normalizeEjsData(undefined);

    expect(ejsRender("<%- properties?.foo ?? 'vazio' %>", context1)).toBe("vazio");
    expect(ejsRender("<%- properties?.foo ?? 'vazio' %>", context2)).toBe("vazio");
  });

  it("should support template scriptlets referencing `id` safely", () => {
    const contextWithId = normalizeEjsData({
      id: "macroareas.123",
      properties: { nm_perimetro_divisao_pde: "Arco Leste" },
    });
    const contextWithoutId = normalizeEjsData({
      properties: { nm_perimetro_divisao_pde: "Arco Leste" },
    });

    const template = `
      <%
        let nome = 'nada consta';
        if (id.includes("macroareas")) {
          nome = properties.nm_perimetro_divisao_pde;
        }
      %>
      <%- nome %>
    `;

    expect(ejsRender(template, contextWithId).trim()).toBe("Arco Leste");
    expect(ejsRender(template, contextWithoutId).trim()).toBe("nada consta");
  });

  it("should accurately render real intersection features (distrito, tombamento, zoneamento, PQA)", () => {
    const primaryTemplate = `
      <%
        const layer = String(properties.layer || '').toLowerCase();
        const schemaId = String(properties.layerSchemaId || '').toLowerCase();
        const rawId = String(id || '').toLowerCase();

        let nome = '';

        if (rawId.includes("subprefeitura") || layer.includes("subprefeitura") || schemaId.includes("subprefeitura")) {
          nome = properties.nm_subprefeitura || properties.cd_subprefeitura || properties.subprefeitura;
        } else if (rawId.includes("distrito") || layer.includes("distrito") || schemaId.includes("distrito")) {
          nome = properties.nm_distrito_municipal || properties.nm_distrito || properties.distrito || properties.cd_distrito;
        } else if (rawId.includes("zoneamento") || layer.includes("zoneamento") || schemaId.includes("zoneamento")) {
          nome = properties.tx_zoneamento_perimetro || properties.cd_zoneamento_perimetro || properties.nm_perimetro_divisao_pde;
        } else if (rawId.includes("tombamento") || layer.includes("tombamento") || schemaId.includes("tombamento")) {
          nome = properties.nm_area_tombada || properties.nm_area || properties.nm_bem || properties.nm_imovel || properties.denominacao_do_bem || properties.nm_bairro || properties.layerSchemaName;
        }
      %>
      <%- nome || 'Identificador não disponível' %>
    `;

    const secondaryTemplate = `
      <%
        const layer = String(properties.layer || '').toLowerCase();
        const schemaId = String(properties.layerSchemaId || '').toLowerCase();
        const rawId = String(id || '').toLowerCase();

        const pctValue = Number(properties.totalAreaPercentage);
        const pct = Number.isFinite(pctValue)
          ? pctValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
          : '';

        let tipo = '';

        if (rawId.includes("subprefeitura") || layer.includes("subprefeitura") || schemaId.includes("subprefeitura")) {
          tipo = 'Subprefeitura';
        } else if (rawId.includes("distrito") || layer.includes("distrito") || schemaId.includes("distrito")) {
          tipo = 'Distrito municipal';
        } else if (rawId.includes("zoneamento") || layer.includes("zoneamento") || schemaId.includes("zoneamento")) {
          tipo = 'Zoneamento';
        } else if (rawId.includes("tombamento") || layer.includes("tombamento") || schemaId.includes("tombamento")) {
          tipo = 'Tombamento';
        }
      %>
      <%- tipo %><% if (pct) { %> - <%- pct %><% } %>
    `;

    // 1. Distrito feature
    const distritoFeature = normalizeEjsData({
      id: "distrito_municipal.8583403",
      properties: {
        nm_distrito_municipal: "GUAIANASES",
        totalAreaPercentage: 100,
        layer: "slui:distrito_municipal",
      },
    });
    expect(ejsRender(primaryTemplate, distritoFeature).trim()).toBe("GUAIANASES");
    expect(ejsRender(secondaryTemplate, distritoFeature).trim()).toBe("Distrito municipal - 100,00%");

    // 2. Subprefeitura feature
    const subprefeituraFeature = normalizeEjsData({
      id: "subprefeitura.8",
      properties: {
        nm_subprefeitura: "GUAIANASES",
        totalAreaPercentage: 100,
        layer: "slui:subprefeitura",
      },
    });
    expect(ejsRender(primaryTemplate, subprefeituraFeature).trim()).toBe("GUAIANASES");
    expect(ejsRender(secondaryTemplate, subprefeituraFeature).trim()).toBe("Subprefeitura - 100,00%");

    // 3. Zoneamento feature
    const zoneamentoFeature = normalizeEjsData({
      id: "zoneamento.526683",
      properties: {
        tx_zoneamento_perimetro: "Zona Corredor 1",
        cd_zoneamento_perimetro: "ZC-1",
        totalAreaPercentage: 28.96,
        layer: "slui:zoneamento",
      },
    });
    expect(ejsRender(primaryTemplate, zoneamentoFeature).trim()).toBe("Zona Corredor 1");
    expect(ejsRender(secondaryTemplate, zoneamentoFeature).trim()).toBe("Zoneamento - 28,96%");

    // 4. Tombamento feature
    const tombamentoFeature = normalizeEjsData({
      id: "tombamentos_imoveis.12",
      properties: {
        nm_area_tombada: "Casa Histórica",
        totalAreaPercentage: 100,
        layer: "slui:tombamentos_imoveis",
      },
    });
    expect(ejsRender(primaryTemplate, tombamentoFeature).trim()).toBe("Casa Histórica");
    expect(ejsRender(secondaryTemplate, tombamentoFeature).trim()).toBe("Tombamento - 100,00%");
  });

  it("should correctly render `<%- properties?.cd_setor_fiscal ?? '-' %>` when feature has intersection response merged", () => {
    const activeFeatureWithResponse = {
      type: "Feature",
      id: "lotes_fiscais.123",
      geometry: { type: "Polygon", coordinates: [] },
      properties: {
        cd_setor_fiscal: "008",
        cd_quadra_fiscal: "076",
        cd_lote: "0098",
      },
      response: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { layer: "zoneamento", tx_zoneamento_perimetro: "ZM" },
          },
        ],
      },
    };

    const context = normalizeEjsData(activeFeatureWithResponse);
    const template = "<%- properties?.cd_setor_fiscal ?? '-' %>";
    expect(ejsRender(template, context)).toBe("008");
  });

  it("should unwrap feature if wrapped in { feature: ... } or { rawData: ... }", () => {
    const wrappedFeature = {
      feature: {
        id: "lotes.456",
        properties: {
          cd_setor_fiscal: "015",
          cd_quadra_fiscal: "022",
        },
      },
    };

    const wrappedRawData = {
      rawData: {
        id: "lotes.789",
        properties: {
          cd_setor_fiscal: "030",
        },
      },
    };

    const context1 = normalizeEjsData(wrappedFeature);
    const context2 = normalizeEjsData(wrappedRawData);

    expect(ejsRender("<%- properties?.cd_setor_fiscal ?? '-' %>", context1)).toBe("015");
    expect(ejsRender("<%- properties?.cd_setor_fiscal ?? '-' %>", context2)).toBe("030");
  });
});
