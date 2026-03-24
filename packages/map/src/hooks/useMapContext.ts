import { signal } from "@preact/signals";
import { useContext } from "react";
import { MapContext } from "../context/MapContext";
import { getMapConfig } from "../integrations/map-integration";
import { SharedMap, shareService } from "../integrations/share-service";
import { IGetConfigLayerSchema } from "../types/fetch-map-config-type";
import {
  IMapContextActions,
  MapContextSelectedFeature,
  MapContextType,
} from "../types/map-context-type";

export const currentShare = signal<SharedMap | null>(null);

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
  } = context;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flyTo = (destination: any) => {
    if (!overlayRef?.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (overlayRef!.current as any)._map.flyTo(destination);
  };

  const handleVisibleLayer = (layerId: string) => {
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

  const populateMapContext = async (options?: { disablePadding?: boolean }) => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get("shareId");

    if (shareId) {
      try {
        const sharedMap = await shareService.load(shareId);
        if (sharedMap?.state?.root?.mapContext) {
          currentShare.value = sharedMap;
          const { mapContext: loadedMapContext } = sharedMap.state.root;

          layerSchemas.value = loadedMapContext.layerSchemas || [];
          layerGroups.value = loadedMapContext.layerGroups || [];
          zoom.value = loadedMapContext.zoom ?? 10;
          boundingBox.value = loadedMapContext.boundingBox || boundingBox.value;
          viewport.value = loadedMapContext.viewport;

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

          return;
        }
      } catch (e) {
        console.error("Failed to load shared state", e);
      }
    }

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
    layerSchemas.value = cLayerSchemas.filter((layer) => layer.isActive);
    layerGroups.value = cLayerGroups;
    zoom.value = cZoom;
    boundingBox.value = cBoundingBox;
    if (cEditFeatureTemplate && cLayerWithRootEditTemplate) {
      editFeatureTemplate.value = cEditFeatureTemplate;
      layerWithRootEditTemplate.value = cLayerWithRootEditTemplate;
    }

    if (options?.disablePadding) {
      context.disablePadding.value = true;
    }

    const uiPadding = options?.disablePadding
      ? { top: 0, bottom: 0, left: 0, right: 0 }
      : {
          top: 64,
          bottom: 0,
          left: 400,
          right: 0,
        };

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
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewportChange = (v: any) => {
    if (!v) return; // Guard clause for undefined input

    zoom.value = v?.zoom ?? 10;

    // Safety check for getBounds which might not exist on some view states
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
