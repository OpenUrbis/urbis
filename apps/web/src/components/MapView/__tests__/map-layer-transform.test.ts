import { describe, expect, it } from "vitest";
import {
  calculateGridCells,
  getGridCellSize,
  transformSchemaLayers,
} from "../map-layer-transform";
import {
  IGetConfigLayerSchema,
  IGetConfigLayerSchemaTypeEnum,
} from "../../../types/fetch-map-config-type";

describe("map-layer-transform", () => {
  it("should assign pointType 'circle' when layer.properties has pointType null", () => {
    const mockLayer: IGetConfigLayerSchema = {
      id: "distrito_municipal",
      name: "Distritos",
      origin:
        "https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=slui:distrito_municipal&count=10000&outputFormat=application/json&srsName=CRS:84",
      isActive: true,
      isVisible: true,
      type: IGetConfigLayerSchemaTypeEnum.GeoJsonLayer,
      properties: {
        pointType: null as any,
        filled: true,
        stroked: true,
      },
    } as any;

    const layers = transformSchemaLayers([mockLayer], {
      zoom: 14,
      is3DActive: false,
      selectedFeatureIds: [],
    } as any).flat();

    expect(layers).toBeDefined();
    expect(layers.length).toBeGreaterThan(0);
    const geoJsonLayer = layers.find((l: any) => l?.id === "distrito_municipal");
    expect(geoJsonLayer).toBeDefined();
    expect(geoJsonLayer?.props.pointType).toBe("circle");
  });

  it("should assign pointType 'circle' when layer.properties is empty or undefined", () => {
    const mockLayer: IGetConfigLayerSchema = {
      id: "test_layer",
      name: "Test Layer",
      origin: "https://example.com/test.json",
      isActive: true,
      isVisible: true,
      type: IGetConfigLayerSchemaTypeEnum.GeoJsonLayer,
    } as any;

    const layers = transformSchemaLayers([mockLayer], {
      zoom: 14,
      is3DActive: false,
      selectedFeatureIds: [],
    } as any).flat();

    expect(layers).toBeDefined();
    const geoJsonLayer = layers.find((l: any) => l?.id === "test_layer");
    expect(geoJsonLayer).toBeDefined();
    expect(geoJsonLayer?.props.pointType).toBe("circle");
  });

  it("should calculate appropriate grid cell sizes based on zoom", () => {
    expect(getGridCellSize(19)).toBe(0.0025);
    expect(getGridCellSize(18)).toBe(0.0025);
    expect(getGridCellSize(17)).toBe(0.005);
    expect(getGridCellSize(16)).toBe(0.005);
    expect(getGridCellSize(15)).toBe(0.01);
    expect(getGridCellSize(14)).toBe(0.01);
    expect(getGridCellSize(13)).toBe(0.02);
    expect(getGridCellSize(undefined)).toBe(0.01);
  });

  it("should subdivide bounding box into dynamic cells with zoom", () => {
    const bbox: [number, number, number, number] = [-46.66, -23.59, -46.65, -23.58];
    const cellsZoom18 = calculateGridCells(bbox, 18);
    expect(cellsZoom18.length).toBeGreaterThan(1);

    const cellsZoom14 = calculateGridCells(bbox, 14);
    expect(cellsZoom14.length).toBe(1);
    expect(cellsZoom14[0]).toEqual([-46.66, -23.59, -46.65, -23.58]);
  });

  it("should create Stream layers with deterministic cell IDs and robust dataTransforms", () => {
    const streamLayer: IGetConfigLayerSchema = {
      id: "zoneamento",
      name: "Zoneamento",
      origin:
        "https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=2.0.0&request=GetFeature&typeNames=slui:zoneamento&count=10000&outputFormat=application/json&srsName=CRS:84",
      isActive: true,
      isVisible: true,
      type: IGetConfigLayerSchemaTypeEnum.Stream,
      minZoom: 13,
    } as any;

    const layers = transformSchemaLayers([streamLayer], {
      zoom: 15,
      boundingBox: [-46.66, -23.59, -46.65, -23.58],
      is3DActive: false,
      selectedFeatureIds: [],
    } as any).flat();

    expect(layers.length).toBeGreaterThan(0);
    const cellLayer = layers[0];
    expect(cellLayer?.id).toContain("cell-zoneamento");
    expect(typeof cellLayer?.props.dataTransform).toBe("function");

    // dataTransform handles empty or non-object payloads safely
    expect(cellLayer.props.dataTransform(null)).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });

  it("should preserve styling and colors for Stream layer with single line color config", () => {
    const streamLayer: IGetConfigLayerSchema = {
      id: "lotes_fiscais",
      name: "Lotes fiscais",
      origin:
        "https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=slui%3Alotes_fiscais&count=10000&outputFormat=application%2Fjson&srsName=CRS%3A84",
      isActive: true,
      isVisible: true,
      type: IGetConfigLayerSchemaTypeEnum.Stream,
      minZoom: 16,
      filled: false,
      stroked: true,
      getLineWidth: 1,
      colors: [
        {
          id: 4759,
          color: [128, 128, 128, 200],
          type: "line",
          pattern: "full",
        },
      ],
      properties: {
        srs: "CRS:84",
        filled: false,
        stroked: true,
        getText: "lote_fiscal",
        minZoomText: 18,
        getTextSize: 10,
        version: "2.0.0",
      },
    } as any;

    const layers = transformSchemaLayers([streamLayer], {
      zoom: 18,
      boundingBox: [-46.66, -23.59, -46.65, -23.58],
      is3DActive: false,
      selectedFeatureIds: [],
    } as any).flat();

    expect(layers.length).toBeGreaterThan(0);
    const geoJsonLayer = layers.find((l: any) => l?.id.startsWith("cell-lotes_fiscais"));
    expect(geoJsonLayer).toBeDefined();

    expect(geoJsonLayer?.props.filled).toBe(false);
    expect(geoJsonLayer?.props.stroked).toBe(true);
    expect(geoJsonLayer?.props.getLineWidth).toBe(1);
    expect(geoJsonLayer?.props.lineWidthUnits).toBe("pixels");

    const lineColor = geoJsonLayer?.props.getLineColor({ properties: {} });
    expect(lineColor).toEqual([128, 128, 128, 200]);

    const fillColor = geoJsonLayer?.props.getFillColor({ properties: {} });
    expect(fillColor).toEqual([128, 128, 128, 200]);

    // Text layer should also be generated for getText: "lote_fiscal" at zoom 18
    const textLayer = layers.find((l: any) => l?.id.startsWith("text-layer-cell-lotes_fiscais"));
    expect(textLayer).toBeDefined();
    expect(textLayer?.props.getText({ properties: { lote_fiscal: "0012" } })).toBe("0012");
  });

  it("should handle property identifier string for getElevation without ReferenceError", () => {
    const layer3D: IGetConfigLayerSchema = {
      id: "area_construida_3d",
      name: "3D",
      origin: "https://example.com/3d.json",
      isActive: true,
      isVisible: true,
      type: IGetConfigLayerSchemaTypeEnum.GeoJsonLayer,
      properties: {
        getElevation: "vl_altura_estimada_metros",
        extruded: true,
      },
    } as any;

    const layers = transformSchemaLayers([layer3D], {
      zoom: 16,
      boundingBox: [-46.66, -23.59, -46.65, -23.58],
      is3DActive: true,
      selectedFeatureIds: [],
    } as any).flat();

    const layer = layers.find((l: any) => l?.id === "area_construida_3d");
    expect(layer).toBeDefined();
    expect(typeof layer?.props.getElevation).toBe("function");

    const elevation = layer?.props.getElevation({
      properties: { vl_altura_estimada_metros: 24.5 },
    });
    expect(elevation).toBe(24.5);
  });

  it("should calculate progressive polygon offset and elevation offsets according to layer order", () => {
    const bottomLayer: IGetConfigLayerSchema = {
      id: "layer_bottom",
      name: "Bottom Layer",
      origin: "https://example.com/bottom.json",
      isActive: true,
      isVisible: true,
      type: IGetConfigLayerSchemaTypeEnum.GeoJsonLayer,
    } as any;

    const topLayer: IGetConfigLayerSchema = {
      id: "layer_top",
      name: "Top Layer",
      origin: "https://example.com/top.json",
      isActive: true,
      isVisible: true,
      type: IGetConfigLayerSchemaTypeEnum.GeoJsonLayer,
    } as any;

    const layers = transformSchemaLayers([bottomLayer, topLayer], {
      zoom: 15,
      boundingBox: [-46.66, -23.59, -46.65, -23.58],
      is3DActive: true,
      selectedFeatureIds: [],
    } as any).flat();

    const bottomGeoJson = layers.find((l: any) => l?.id === "layer_bottom");
    const topGeoJson = layers.find((l: any) => l?.id === "layer_top");

    expect(bottomGeoJson).toBeDefined();
    expect(topGeoJson).toBeDefined();

    // Polygon offset for bottom layer (index 0) vs top layer (index 1)
    const bottomOffset = bottomGeoJson?.props.getPolygonOffset();
    const topOffset = topGeoJson?.props.getPolygonOffset();

    expect(bottomOffset).toEqual([0, -200]);
    expect(topOffset).toEqual([0, -400]);

    // Top layer offset has larger negative units (closer to camera in depth buffer)
    expect(topOffset[1]).toBeLessThan(bottomOffset[1]);

    // 3D elevation offset
    const bottomElevation = bottomGeoJson?.props.getElevation({});
    const topElevation = topGeoJson?.props.getElevation({});

    expect(bottomElevation).toBe(0);
    expect(topElevation).toBeCloseTo(0.1, 5);
  });
});
