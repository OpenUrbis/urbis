// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  parseLayerSchemaToForm,
  buildLayerSchema,
  LayerSchema,
} from "../utils";
import { DEFAULT_LAYER_BORDER_COLOR } from "../../../../../../../lib/layer-style-defaults";

describe("LayerHandle utils - color parsing and building", () => {
  it("should preserve dynamic element fill colors as border color when no line color is specified", () => {
    const mockDynamicSchema: LayerSchema = {
      id: "zoneamento_lei_16402_18177",
      name: "Zoneamento",
      origin: "https://geoserver.slui.dev/geoserver/slui/wms",
      isActive: true,
      getFillColorPropName: "cd_zoneamento_perimetro",
      colors: [
        {
          color: [223, 253, 178, 190],
          label: "AC-1",
          value: "AC-1",
          type: "fill" as any,
          pattern: "full",
        },
        {
          color: [173, 160, 152, 190],
          label: "ZC",
          value: "ZC",
          type: "fill" as any,
          pattern: "full",
        },
      ],
    };

    const formData = parseLayerSchemaToForm(mockDynamicSchema);

    expect(formData.isDynamic).toBe(true);
    expect(formData.colors).toHaveLength(2);

    // AC-1 border color must match its fill color, NOT default black border
    const ac1Color = formData.colors.find((c) => c.value === "AC-1");
    expect(ac1Color).toBeDefined();
    expect(ac1Color?.fillColor[0]).toBe(223);
    expect(ac1Color?.fillColor[1]).toBe(253);
    expect(ac1Color?.fillColor[2]).toBe(178);
    expect(ac1Color?.borderColor[0]).toBe(223);
    expect(ac1Color?.borderColor[1]).toBe(253);
    expect(ac1Color?.borderColor[2]).toBe(178);

    // ZC border color must match its fill color
    const zcColor = formData.colors.find((c) => c.value === "ZC");
    expect(zcColor).toBeDefined();
    expect(zcColor?.fillColor[0]).toBe(173);
    expect(zcColor?.fillColor[1]).toBe(160);
    expect(zcColor?.fillColor[2]).toBe(152);
    expect(zcColor?.borderColor[0]).toBe(173);
    expect(zcColor?.borderColor[1]).toBe(160);
    expect(zcColor?.borderColor[2]).toBe(152);
  });

  it("should keep border color matching element color when saving after adding a legisUrl", () => {
    const mockDynamicSchema: LayerSchema = {
      id: "zoneamento_lei_16402_18177",
      name: "Zoneamento",
      origin: "https://geoserver.slui.dev/geoserver/slui/wms",
      isActive: true,
      getFillColorPropName: "cd_zoneamento_perimetro",
      colors: [
        {
          color: [223, 253, 178, 190],
          label: "AC-1",
          value: "AC-1",
          type: "fill" as any,
          pattern: "full",
        },
      ],
    };

    // 1. Form loads data
    const formData = parseLayerSchemaToForm(mockDynamicSchema);

    // 2. User only adds legisUrl to AC-1
    formData.colors[0].legisUrl = "https://legis.urbis.prefeitura.sp.gov.br/pages/ac1";

    // 3. Form is saved (buildLayerSchema)
    const savedSchema = buildLayerSchema(formData);

    // Verify colors in saved schema
    const lineColors = savedSchema.colors.filter((c: any) => c.type === "line");
    expect(lineColors.length).toBeGreaterThan(0);
    // Line color should match AC-1 color ([223, 253, 178]), NOT black ([31, 41, 55])
    expect(lineColors[0].color[0]).toBe(223);
    expect(lineColors[0].color[1]).toBe(253);
    expect(lineColors[0].color[2]).toBe(178);
    expect(lineColors[0].legisUrl).toBe("https://legis.urbis.prefeitura.sp.gov.br/pages/ac1");
  });

  it("should preserve explicit custom border color if set", () => {
    const mockSchemaWithCustomBorder: LayerSchema = {
      id: "zoneamento_lei_16402_18177",
      name: "Zoneamento",
      origin: "https://geoserver.slui.dev/geoserver/slui/wms",
      isActive: true,
      getFillColorPropName: "cd_zoneamento_perimetro",
      colors: [
        {
          color: [223, 253, 178, 190],
          label: "AC-1",
          value: "AC-1",
          type: "fill" as any,
          pattern: "full",
        },
        {
          color: [255, 0, 0, 255],
          label: "AC-1",
          value: "AC-1",
          type: "line" as any,
        },
      ],
    };

    const formData = parseLayerSchemaToForm(mockSchemaWithCustomBorder);
    const ac1 = formData.colors.find((c) => c.value === "AC-1");
    expect(ac1?.borderColor[0]).toBe(255);
    expect(ac1?.borderColor[1]).toBe(0);
    expect(ac1?.borderColor[2]).toBe(0);
  });

  it("should use DEFAULT_LAYER_BORDER_COLOR for non-dynamic single-color layers when no border is set", () => {
    const mockStaticSchema: LayerSchema = {
      id: "limites",
      name: "Limites",
      origin: "https://geoserver.slui.dev/geoserver/slui/wms",
      isActive: true,
      colors: [
        {
          color: [55, 126, 184, 115],
          label: "default",
          type: "fill" as any,
        },
      ],
    };

    const formData = parseLayerSchemaToForm(mockStaticSchema);
    expect(formData.isDynamic).toBe(false);
    expect(formData.colors[0].borderColor[0]).toBe(DEFAULT_LAYER_BORDER_COLOR[0]);
    expect(formData.colors[0].borderColor[1]).toBe(DEFAULT_LAYER_BORDER_COLOR[1]);
    expect(formData.colors[0].borderColor[2]).toBe(DEFAULT_LAYER_BORDER_COLOR[2]);
  });
});
