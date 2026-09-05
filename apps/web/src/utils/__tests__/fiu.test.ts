// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  FIU_DISCLAIMER_MESSAGE,
  FIU_STORAGE_PREFIX,
  buildTaxLotFiuUrl,
  hasTaxLotFiuParams,
  convertGeoJsonToDxf,
  getFeatureDxfLayerName,
  buildGeometryFiuUrl,
  saveFiuPayload,
  getFiuPayload,
  cleanupOldFiuPayloads,
} from "../fiu";

describe("fiu utility", () => {
  it("should contain the required disclaimer text for property delimitation responsibility", () => {
    expect(FIU_DISCLAIMER_MESSAGE).toContain(
      "Esta Ficha de Informações Urbanísticas (FIU) é uma ferramenta em fase de testes",
    );
    expect(FIU_DISCLAIMER_MESSAGE).toContain(
      "A responsabilidade pela delimitação do imóvel, em qualquer caso, mesmo quando utilizada geometria disponibilizada pela Prefeitura, é do usuário",
    );
  });

  it("should validate tax lot fiu params correctly", () => {
    const validFeatureLegacy = {
      properties: {
        cd_setor_fiscal: "01",
        cd_quadra_fiscal: "02",
        cd_lote: "0003",
      },
    };
    const validFeatureModern = {
      properties: {
        setor_fiscal: 14,
        quadra_fiscal: 45,
        lote_fiscal: 7,
      },
    };
    const validFeatureSqlCondo = {
      properties: {
        sql_condominio: "014045000700",
      },
    };
    const invalidFeature = {
      properties: {
        cd_setor_fiscal: "01",
      },
    };

    expect(hasTaxLotFiuParams(validFeatureLegacy)).toBe(true);
    expect(hasTaxLotFiuParams(validFeatureModern)).toBe(true);
    expect(hasTaxLotFiuParams(validFeatureSqlCondo)).toBe(true);
    expect(hasTaxLotFiuParams(invalidFeature)).toBe(false);
  });

  it("should build tax lot FIU url correctly", () => {
    const feature = {
      properties: {
        cd_setor_fiscal: "01",
        cd_quadra_fiscal: "02",
        cd_lote: "0003",
      },
    };

    const url = buildTaxLotFiuUrl(feature);
    expect(url).toBe(
      "/print?interactive=true&layerSchema=lotes_fiscais&CQL_FILTER=sql_condominio+%3D+%27001002000300%27",
    );
  });

  it("should build tax lot FIU url from modern properties correctly", () => {
    const feature = {
      properties: {
        setor_fiscal: 14,
        quadra_fiscal: 45,
        lote_fiscal: 7,
        condominio: 0,
      },
    };

    const url = buildTaxLotFiuUrl(feature);
    expect(url).toBe(
      "/print?interactive=true&layerSchema=lotes_fiscais&CQL_FILTER=sql_condominio+%3D+%27014045000700%27",
    );
  });

  describe("getFeatureDxfLayerName", () => {
    it("should default primary feature to IMOVEL_CONSULTADO", () => {
      const feature = { properties: {} };
      expect(getFeatureDxfLayerName(feature, 0)).toBe("IMOVEL_CONSULTADO");
    });

    it("should sanitize slui prefix from layer names", () => {
      const feature = { properties: { layer: "slui:zoneamento_2016" } };
      expect(getFeatureDxfLayerName(feature, 1)).toBe("ZONEAMENTO_2016");
    });

    it("should use _layerId when present", () => {
      const feature = { properties: { _layerId: "perimetro_restricao" } };
      expect(getFeatureDxfLayerName(feature, 1)).toBe("PERIMETRO_RESTRICAO");
    });

    it("should fallback to CAMADA_N for subsequent features without identifiable name", () => {
      const feature = { properties: {} };
      expect(getFeatureDxfLayerName(feature, 2)).toBe("CAMADA_3");
    });
  });

  describe("convertGeoJsonToDxf", () => {
    it("should generate valid DXF structure with HEADER and ENTITIES", () => {
      const featureCollection = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [-46.6333, -23.5505], // São Paulo center
            },
            properties: {
              layer: "ponto_teste",
            },
          },
        ],
      };

      const dxf = convertGeoJsonToDxf(featureCollection);

      expect(dxf).toContain("SECTION\n2\nHEADER\n0\nENDSEC");
      expect(dxf).toContain("SECTION\n2\nENTITIES");
      expect(dxf).toContain("POINT");
      expect(dxf).toContain("PONTO_TESTE");
      expect(dxf).toContain("ENDSEC\n0\nEOF");
    });

    it("should convert polygons to closed LWPOLYLINE entities", () => {
      const featureCollection = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-46.6333, -23.5505],
                  [-46.6330, -23.5505],
                  [-46.6330, -23.5500],
                  [-46.6333, -23.5500],
                  [-46.6333, -23.5505],
                ],
              ],
            },
            properties: {
              origem_fiu: "Lote consultado",
            },
          },
        ],
      };

      const dxf = convertGeoJsonToDxf(featureCollection);

      expect(dxf).toContain("LWPOLYLINE");
      expect(dxf).toContain("IMOVEL_CONSULTADO");
      // Flag 70 with value 1 indicates closed polyline
      expect(dxf).toContain("70\n1");
      // Vertices count: 90 with value 5
      expect(dxf).toContain("90\n5");
    });

    it("should convert line strings to open LWPOLYLINE entities", () => {
      const featureCollection = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [-46.6333, -23.5505],
                [-46.6330, -23.5500],
              ],
            },
            properties: {
              layer: "eixo_viario",
            },
          },
        ],
      };

      const dxf = convertGeoJsonToDxf(featureCollection);

      expect(dxf).toContain("LWPOLYLINE");
      expect(dxf).toContain("EIXO_VIARIO");
      // Flag 70 with value 0 indicates open polyline
      expect(dxf).toContain("70\n0");
      expect(dxf).toContain("90\n2");
    });

    it("should convert multipolygons and multi-features with distinct layers and colors", () => {
      const fiuData = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-46.6333, -23.5505],
              [-46.6330, -23.5505],
              [-46.6330, -23.5500],
              [-46.6333, -23.5505],
            ],
          ],
        },
        properties: {
          cd_lote: "0001",
        },
        response: {
          features: [
            {
              type: "Feature",
              id: "slui:zoneamento_2016.1",
              geometry: {
                type: "MultiPolygon",
                coordinates: [
                  [
                    [
                      [-46.635, -23.552],
                      [-46.630, -23.552],
                      [-46.630, -23.548],
                      [-46.635, -23.552],
                    ],
                  ],
                ],
              },
              properties: {
                layer: "slui:zoneamento_2016",
              },
            },
          ],
        },
      };

      const dxf = convertGeoJsonToDxf(fiuData);

      expect(dxf).toContain("IMOVEL_CONSULTADO");
      expect(dxf).toContain("ZONEAMENTO_2016");
      expect(dxf.endsWith("0\nENDSEC\n0\nEOF\n")).toBe(true);
    });
  });

  describe("FIU payload storage & quota handling", () => {
    it("should build geometry FIU url and retrieve payload safely", async () => {
      const feature = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-46.633, -23.55],
              [-46.63, -23.55],
              [-46.63, -23.548],
              [-46.633, -23.55],
            ],
          ],
        },
        properties: {},
      };

      const response = {
        type: "FeatureCollection",
        features: [feature],
      };

      const url = buildGeometryFiuUrl({
        feature,
        response,
        template: [],
      });

      expect(url).toContain("/print?interactive=true&payloadKey=");
      const params = new URLSearchParams(url.replace("/print?", ""));
      const key = params.get("payloadKey");
      expect(key).toBeTruthy();
      expect(key!.startsWith(FIU_STORAGE_PREFIX)).toBe(true);

      const retrieved = await getFiuPayload(key!);
      expect(retrieved).not.toBeNull();
      expect(retrieved.feature).toBeDefined();
    });

    it("should handle QuotaExceededError gracefully without throwing", () => {
      const originalSetItem = localStorage.setItem;
      try {
        localStorage.setItem = () => {
          const err = new Error("QuotaExceededError");
          err.name = "QuotaExceededError";
          throw err;
        };

        const feature = { type: "Feature", properties: {} };
        const response = { type: "FeatureCollection", features: [] };

        // Should not throw even when localStorage throws QuotaExceededError
        expect(() => {
          const url = buildGeometryFiuUrl({
            feature,
            response,
            template: [],
          });
          expect(url).toContain("/print?interactive=true&payloadKey=");
        }).not.toThrow();
      } finally {
        localStorage.setItem = originalSetItem;
      }
    });

    it("should clean up old FIU payloads to avoid accumulating excess items in storage", () => {
      const now = Date.now();
      const oldKey = `${FIU_STORAGE_PREFIX}old-test`;
      const freshKey = `${FIU_STORAGE_PREFIX}fresh-test`;

      localStorage.setItem(
        oldKey,
        JSON.stringify({
          createdAt: now - 3 * 60 * 60 * 1000, // 3 hours ago (> 2 hours TTL)
          feature: {},
        }),
      );

      localStorage.setItem(
        freshKey,
        JSON.stringify({
          createdAt: now,
          feature: {},
        }),
      );

      cleanupOldFiuPayloads();

      expect(localStorage.getItem(oldKey)).toBeNull();
      expect(localStorage.getItem(freshKey)).not.toBeNull();

      localStorage.removeItem(freshKey);
    });
  });
});
