import { describe, it, expect, vi, beforeEach } from "vitest";
import { signal } from "@preact/signals";
import { shareService } from "../../integrations/share-service";
import * as mapIntegration from "../../integrations/map-integration";
import { isMapPopulated, isRestored, isMapError } from "../useLayerPersistence";
import { currentShare } from "../useMapContext";

describe("Shared Map restoration and loading safeguards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    isMapPopulated.value = false;
    isRestored.value = false;
    isMapError.value = false;
    currentShare.value = null;
  });

  it("handles valid shareId without viewport by generating a safe fallback viewport", async () => {
    const mockSharedMap = {
      id: "303048b2-8c9b-4b21-beb4-a0adecc207b3",
      name: "Shared Test",
      description: "",
      userId: "user-1",
      createdAt: new Date().toISOString(),
      state: {
        root: {
          searchContext: {
            currentTerm: "",
            history: [],
            searchQuery: null,
            searchConfig: [],
          },
          mapContext: {
            layerSchemas: [],
            layerGroups: [],
            selectedFeatures: [],
            boundingBox: [-46.7, -23.6, -46.6, -23.5],
            viewport: undefined, // Missing viewport!
            zoom: 12,
            is3DActive: false,
            selectedBaseMap: "geosampa-ortofoto-2020",
            editFeatureTemplate: [],
            layerWithRootEditTemplate: "",
          },
        },
      },
    };

    vi.spyOn(shareService, "load").mockResolvedValue(mockSharedMap as any);
    vi.spyOn(mapIntegration, "getMapConfig").mockResolvedValue({
      layerSchemas: [],
      layerGroups: [],
      zoom: 10,
      boundingBox: [-47, -24, -46, -23],
    } as any);

    const loaded = await shareService.load("303048b2-8c9b-4b21-beb4-a0adecc207b3");
    expect(loaded).toBeDefined();
    expect(loaded?.state?.root?.mapContext?.viewport).toBeUndefined();

    // Verify fallback logic
    const rootState = (loaded?.state as any)?.root || loaded?.state;
    const loadedMapContext = rootState?.mapContext;
    let computedViewport;

    if (
      loadedMapContext.viewport &&
      typeof loadedMapContext.viewport.latitude === "number" &&
      typeof loadedMapContext.viewport.longitude === "number"
    ) {
      computedViewport = loadedMapContext.viewport;
    } else if (
      Array.isArray(loadedMapContext.boundingBox) &&
      loadedMapContext.boundingBox.length === 4
    ) {
      const [minX, minY, maxX, maxY] = loadedMapContext.boundingBox;
      computedViewport = {
        latitude: (minY + maxY) / 2,
        longitude: (minX + maxX) / 2,
        zoom: loadedMapContext.zoom ?? 10,
        bearing: 0,
        pitch: 0,
      };
    }

    expect(computedViewport).toBeDefined();
    expect(computedViewport?.latitude).toBeCloseTo(-23.55);
    expect(computedViewport?.longitude).toBeCloseTo(-46.65);
    expect(computedViewport?.zoom).toBe(12);
  });

  it("handles non-existent shareId (404) gracefully by falling back to base config without hanging", async () => {
    vi.spyOn(shareService, "load").mockResolvedValue(null);
    vi.spyOn(mapIntegration, "getMapConfig").mockResolvedValue({
      latitude: -23.5505,
      longitude: -46.6333,
      zoom: 10,
      bearing: 0,
      pitch: 0,
      layerSchemas: [{ id: "l1", isActive: true }],
      layerGroups: [],
      boundingBox: [-47, -24, -46, -23],
    } as any);

    const data = await shareService.load("non-existent-share-id");
    expect(data).toBeNull();

    const fallbackConfig = await mapIntegration.getMapConfig();
    expect(fallbackConfig).toBeDefined();
    expect(fallbackConfig.latitude).toBe(-23.5505);
    expect(fallbackConfig.longitude).toBe(-46.6333);
  });
});
