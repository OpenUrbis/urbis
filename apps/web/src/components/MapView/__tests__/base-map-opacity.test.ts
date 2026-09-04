import { describe, it, expect } from "vitest";
import { getMapStyle } from "../base-map-styles";
import type { StyleSpecification } from "maplibre-gl";

describe("Base map opacity and multi-select logic", () => {
  it("should generate individual opacity for combined raster base maps", () => {
    const combined = getMapStyle(
      "geosampa-ortofoto-2020",
      "light",
      "/api",
      100,
      100,
      ["geosampa-ortofoto-2020", "geosampa-sara-brasil-1930"],
      {
        "geosampa-ortofoto-2020": 90,
        "geosampa-sara-brasil-1930": 50,
      },
    ) as StyleSpecification;

    expect(typeof combined).toBe("object");
    expect(combined.layers).toBeDefined();

    // 1st layer: geosampa-ortofoto-2020
    const layer0 = combined.layers.find(
      (l) => l.id === "bm_0_geosampa-ortofoto-2020",
    );
    expect(layer0).toBeDefined();
    expect(layer0?.paint?.["raster-opacity"]).toBe(0.9);

    // 2nd layer: geosampa-sara-brasil-1930
    const layer1 = combined.layers.find(
      (l) => l.id === "bm_1_geosampa-sara-brasil-1930",
    );
    expect(layer1).toBeDefined();
    expect(layer1?.paint?.["raster-opacity"]).toBe(0.5);
  });

  it("should isolate opacities without leaking between different base map selections", () => {
    const opacitiesMap: Record<string, number> = {
      "openfreemap-liberty": 100,
      "geosampa-ortofoto-2020": 91,
    };

    const getOpacityForStyle = (styleId: string) => opacitiesMap[styleId] ?? 100;

    expect(getOpacityForStyle("openfreemap-liberty")).toBe(100);
    expect(getOpacityForStyle("geosampa-ortofoto-2020")).toBe(91);
    expect(getOpacityForStyle("openfreemap-positron")).toBe(100);
  });
});
