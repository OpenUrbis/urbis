/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { getProspectiveSearchLayers } from "../prospective-layers";

describe("getProspectiveSearchLayers", () => {
  it("deve retornar a camada de lotes fiscais com o nome da camada atualizado para slui:lotes_fiscais e SLD com area_terreno e tipo_lote_fiscal", () => {
    const areaImovel: [number, number] = [200, 500];
    const layers = getProspectiveSearchLayers(
      [],
      null,
      false,
      areaImovel,
      false,
      [],
      false,
    );

    expect(layers).toBeDefined();
    expect(layers.length).toBe(1);

    const lotsLayer = layers.find((l: any) => l.id === "prospective-lots-layer");
    expect(lotsLayer).toBeDefined();
    expect(lotsLayer?.proxyLayerId).toBe("lotes_fiscais");
    expect(lotsLayer?.properties?.wms?.layers).toBe("slui:lotes_fiscais");

    const sld = lotsLayer?.properties?.sldBody;
    expect(sld).toBeDefined();
    expect(sld).toContain("<Name>lotes_fiscais</Name>");
    expect(sld).not.toContain("lote_cidadao");
    expect(sld).toContain("<ogc:PropertyName>tipo_lote_fiscal</ogc:PropertyName><ogc:Literal>Fiscal</ogc:Literal>");
    expect(sld).toContain("<ogc:PropertyName>area_terreno</ogc:PropertyName>");
    expect(sld).not.toContain("qt_area_terreno");
    expect(sld).not.toContain("cd_tipo_lote");
    expect(sld).toContain("<ogc:LowerBoundary><ogc:Literal>200</ogc:Literal></ogc:LowerBoundary>");
    expect(sld).toContain("<ogc:UpperBoundary><ogc:Literal>500</ogc:Literal></ogc:UpperBoundary>");
  });

  it("deve incluir a camada de lotes em conjunto com parâmetros urbanísticos e regras de zoneamento", () => {
    const mockRegrasZonamento = {
      simSemNota: ["ZMIS", "ZM"],
      simComNota: {},
      naoComNota: {},
      naoSemNota: [],
      zoeZep: [],
    };
    const areaImovel: [number, number] = [100, 1000];

    const layers = getProspectiveSearchLayers(
      ["ZMIS", "ZM"],
      mockRegrasZonamento,
      true,
      areaImovel,
      false,
      [],
      false,
    );

    expect(layers.length).toBe(3); // use layer + params layer + lots layer

    const lotsLayer = layers.find((l: any) => l.id === "prospective-lots-layer");
    expect(lotsLayer).toBeDefined();
    expect(lotsLayer?.properties?.wms?.layers).toBe("slui:lotes_fiscais");
  });
});
