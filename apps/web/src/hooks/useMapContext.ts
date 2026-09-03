import { signal } from "@preact/signals";
import { useContext } from "react";
import { MapContext } from "../context/MapContext";
import { getMapConfig } from "../integrations/map-integration";
import { SharedMap, shareService } from "../integrations/share-service";
import { IGetConfigLayerSchema } from "../types/fetch-map-config-type";
import { normalizeEnvironmentUrl } from "../components/MapView/map-layer-transform";
import { isMapError, isMapPopulated } from "./useLayerPersistence";
import { toast } from "./use-toast";
import {
  IMapContextActions,
  MapContextSelectedFeature,
  MapContextType,
} from "../types/map-context-type";

export const currentShare = signal<SharedMap | null>(null);
export const activeHighlightFeature = signal<any>(null);

const getMapHandlers = (context: MapContextType) => {
  const {
    layerSchemas,
    layerGroups,
    selectedFeatures,
    boundingBox,
    viewport,
    zoom,
    editFeatureTemplate,
    layerWithRootEditTemplate,
    overlayRef,
    is3DActive,
    selectedBaseMap,
    selectedBaseMaps,
    baseMapOpacity,
    baseMapOpacities: _baseMapOpacities,
    baseMapSaturation,
  } = context;

  const getUiPadding = (options?: { disablePadding?: boolean }) => {
    const isDesktop =
      typeof window === "undefined"
        ? true
        : window.matchMedia("(min-width: 768px)").matches;

    return {
      top: options?.disablePadding ? 0 : 64,
      bottom: 0,
      left: isDesktop ? 400 : 0,
      right: 0,
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flyTo = (destination: any) => {
    if (!overlayRef?.current) return;

    const hasBounds = Object.prototype.hasOwnProperty.call(
      destination,
      "bounds",
    );
    const hasExplicitPadding = Object.prototype.hasOwnProperty.call(
      destination,
      "padding",
    );
    const responsiveDestination = {
      padding: hasBounds && !hasExplicitPadding ? 72 : getUiPadding(),
      ...destination,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (overlayRef.current as any)._map;
    if (!map) return;

    if (hasBounds) {
      const { bounds, center, zoom, maxZoom, ...fitOptions } =
        responsiveDestination;
      if (!bounds) return;
      map.fitBounds(bounds, {
        maxZoom: maxZoom ?? 18,
        duration: 700,
        ...fitOptions,
      });
      return;
    }

    map.flyTo(responsiveDestination);
  };

  const checkAndNotifyLayerWarning = (
    layer: IGetConfigLayerSchema,
    willBeVisible: boolean,
  ) => {
    if (!willBeVisible) return;

    const rawWarning =
      layer.properties?.metadata?.sourceParameters ||
      layer.properties?.sourceParameters ||
      "";

    if (rawWarning && typeof rawWarning === "string") {
      const cleanWarning = rawWarning
        .replace(/<[^>]*>?/gm, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (cleanWarning && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("layer-warning-alert", {
            detail: {
              layerName: layer.name,
              warning: cleanWarning,
            },
          }),
        );
      }
    }
  };

  const handleVisibleLayer = (layerId: string) => {
    const target = layerSchemas.value.find((l) => l.id === layerId);
    if (target) {
      checkAndNotifyLayerWarning(target, !target.isVisible);
    }
    layerSchemas.value = layerSchemas.value.map(
      (layer): IGetConfigLayerSchema => {
        if (layer.id === layerId) {
          return {
            ...layer,
            isVisible: !layer.isVisible,
          };
        }
        return layer;
      },
    );
  };

  const handleActiveLayer = (layerId: string) => {
    const target = layerSchemas.value.find((l) => l.id === layerId);
    if (target) {
      checkAndNotifyLayerWarning(target, !target.isSelected);
    }
    layerSchemas.value = layerSchemas.value.map(
      (layer): IGetConfigLayerSchema => {
        if (layer.id === layerId) {
          return {
            ...layer,
            isSelected: !layer.isSelected,
            isVisible: !layer.isSelected,
          };
        }
        return layer;
      },
    );
  };

  const selectFeature = (feature: MapContextSelectedFeature) => {
    selectedFeatures.value = [/* ...selectedFeatures.value,  */ feature];
  };

  const filterUnavailableSharedLayers = async (
    layers: IGetConfigLayerSchema[],
  ): Promise<IGetConfigLayerSchema[]> => {
    try {
      const { layerSchemas: availableLayers } = await getMapConfig();
      const availableIds = new Set(
        availableLayers.map((layer) => String(layer.id)),
      );

      return layers.filter((layer) => {
        if (availableIds.has(String(layer.id))) return true;

        const origin = typeof layer.origin === "string" ? layer.origin : "";
        try {
          const normalizedOrigin = normalizeEnvironmentUrl(origin);
          const url = new URL(normalizedOrigin, window.location.href);
          const isManagedLayer =
            url.hostname === "geoserver.slui.dev" ||
            url.pathname.includes("/maps/proxy/layers/") ||
            url.pathname.includes("/maps/proxy/wfs") ||
            url.pathname.endsWith("/maps/proxy/wfs");

          // Keep external/user-added layers. Drop only stale managed layers
          // that would otherwise generate repeated proxy errors in deck.gl.
          return !isManagedLayer;
        } catch {
          return true;
        }
      });
    } catch {
      // A shared map should remain usable even if availability cannot be checked.
      return layers;
    }
  };

  const populateMapContext = async (options?: { disablePadding?: boolean }) => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get("shareId");
    const uiPadding = getUiPadding(options);

    if (shareId) {
      try {
        const sharedMap = await shareService.load(shareId);
        const rootState = (sharedMap?.state as any)?.root || sharedMap?.state;
        const loadedMapContext = rootState?.mapContext;

        if (loadedMapContext) {
          currentShare.value = sharedMap;

          layerSchemas.value = await filterUnavailableSharedLayers(
            loadedMapContext.layerSchemas || [],
          );
          layerGroups.value = loadedMapContext.layerGroups || [];
          zoom.value = loadedMapContext.zoom ?? 10;
          boundingBox.value = loadedMapContext.boundingBox || boundingBox.value;

          if (
            loadedMapContext.viewport &&
            typeof loadedMapContext.viewport.latitude === "number" &&
            typeof loadedMapContext.viewport.longitude === "number"
          ) {
            viewport.value = {
              ...loadedMapContext.viewport,
              padding: uiPadding,
            };
          } else if (
            Array.isArray(loadedMapContext.boundingBox) &&
            loadedMapContext.boundingBox.length === 4
          ) {
            const [minX, minY, maxX, maxY] = loadedMapContext.boundingBox;
            viewport.value = {
              latitude: (minY + maxY) / 2,
              longitude: (minX + maxX) / 2,
              zoom: loadedMapContext.zoom ?? 10,
              bearing: 0,
              pitch: 0,
              padding: uiPadding,
            };
          } else {
            viewport.value = {
              latitude: -23.5505,
              longitude: -46.6333,
              zoom: loadedMapContext.zoom ?? 10,
              bearing: 0,
              pitch: 0,
              padding: uiPadding,
            };
          }

          if (loadedMapContext.editFeatureTemplate) {
            editFeatureTemplate.value = loadedMapContext.editFeatureTemplate;
          }

          if (loadedMapContext.layerWithRootEditTemplate) {
            layerWithRootEditTemplate.value =
              loadedMapContext.layerWithRootEditTemplate;
          }

          if (loadedMapContext.selectedFeatures) {
            selectedFeatures.value = loadedMapContext.selectedFeatures;
          }

          if (loadedMapContext.is3DActive !== undefined) {
            is3DActive.value = loadedMapContext.is3DActive;
          }

          if (loadedMapContext.selectedBaseMap) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            selectedBaseMap.value = loadedMapContext.selectedBaseMap as any;
          }

          if (loadedMapContext.selectedBaseMaps) {
            selectedBaseMaps.value = loadedMapContext.selectedBaseMaps;
          } else if (loadedMapContext.selectedBaseMap) {
            selectedBaseMaps.value = [loadedMapContext.selectedBaseMap as any];
          }

          if (loadedMapContext.baseMapOpacity !== undefined) {
            baseMapOpacity.value = loadedMapContext.baseMapOpacity;
          }

          if (loadedMapContext.baseMapSaturation !== undefined) {
            baseMapSaturation.value = loadedMapContext.baseMapSaturation;
          }

          isMapPopulated.value = true;
          return;
        } else {
          console.warn(`[Share] Shared map "${shareId}" not found or invalid.`);
          currentShare.value = null;
          toast({
            variant: "warning",
            title: "Atenção",
            description: "O mapa compartilhado não foi encontrado ou o link expirou.",
          });
        }
      } catch (e) {
        console.error("Failed to load shared state", e);
        currentShare.value = null;
        toast({
          variant: "warning",
          title: "Atenção",
          description: "Não foi possível carregar o mapa compartilhado.",
        });
      }
    }

    try {
      const {
        latitude,
        longitude,
        bearing,
        pitch,
        layerSchemas: cLayerSchemas,
        layerGroups: cLayerGroups,
        zoom: cZoom,
        boundingBox: cBoundingBox,
        editFeatureTemplate: cEditFeatureTemplate,
        layerWithRootEditTemplate: cLayerWithRootEditTemplate,
      } = await getMapConfig();
      layerSchemas.value = (cLayerSchemas || []).filter((layer) => layer.isActive);
      layerGroups.value = cLayerGroups || [];
      zoom.value = cZoom;
      boundingBox.value = cBoundingBox;
      if (cEditFeatureTemplate && cLayerWithRootEditTemplate) {
        editFeatureTemplate.value = cEditFeatureTemplate;
        layerWithRootEditTemplate.value = cLayerWithRootEditTemplate;
      }

      if (viewport.value) {
        viewport.value = {
          ...viewport.value,
          padding: uiPadding,
        };
      } else {
        viewport.value = {
          latitude,
          longitude,
          zoom: cZoom ?? 10,
          bearing: bearing ?? 0,
          pitch: pitch ?? 0,
          padding: uiPadding,
        };
      }

      isMapPopulated.value = true;
    } catch (e) {
      console.error("Failed to populate map context", e);
      isMapError.value = true;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewportChange = (v: any) => {
    if (!v) return;

    zoom.value = v?.zoom ?? 10;

    if (v.getBounds && typeof v.getBounds === "function") {
      boundingBox.value = v.getBounds();
    }

    viewport.value = {
      ...viewport.value,
      zoom: v?.zoom ?? 10,
      bearing: v.bearing,
      pitch: v.pitch,
      latitude: v.latitude,
      longitude: v.longitude,
    };
  };

  return {
    handleVisibleLayer,
    handleActiveLayer,
    populateMapContext,
    selectFeature,
    activeHighlightFeature,
    handleViewportChange,
    flyTo,
    flyToWithPadding: flyTo,
  };
};

export const useMapContext = (): IMapContextActions => {
  const context = useContext(MapContext);

  if (!context)
    throw new Error("useMapContext must be used within a MapProvider");

  return { ...context, ...getMapHandlers(context) };
};
