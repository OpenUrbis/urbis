import { useContext } from "preact/hooks";
import { MapContext } from "../context/MapContext";
import { getMapConfig } from "../services/map-service";
import { IGetConfigLayerSchema } from "../types/fetch-map-config-type";
import {
  MapContextSelectedFeature,
  MapContextType,
} from "../types/map-context-type";

export const calculateCenterId = (polygon: number[][]) => {
  let xSum = 0,
    ySum = 0,
    area = 0;

  for (let i = 0; i < polygon.length - 1; i++) {
    const x0 = polygon[i][0],
      y0 = polygon[i][1];
    const x1 = polygon[i + 1][0],
      y1 = polygon[i + 1][1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    xSum += (x0 + x1) * cross;
    ySum += (y0 + y1) * cross;
  }

  area *= 0.5;
  if (area === 0) return polygon[0]; // Caso de polígono degenerado (linha ou ponto)

  return [xSum / (6 * area), ySum / (6 * area)];
};

const getMapHandlers = (context: MapContextType) => {
  const {
    layerSchemas,
    layerGroups,
    selectedFeatures,
    boundingBox,
    viewport,
    zoom,
    overlayRef,
  } = context;

  console.log("overlayRef", overlayRef);

  const flyTo = (destination: any) => {
    if (!overlayRef?.current) return;

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
      }
    );
  };

  const selectFeature = (feature: MapContextSelectedFeature) => {
    selectedFeatures.value = [/* ...selectedFeatures.value,  */ feature];
  };

  const populateMapContext = async () => {
    const {
      latitude,
      longitude,
      bearing,
      pitch,
      padding,
      layerSchemas: cLayerSchemas,
      layerGroups: cLayerGroups,
      zoom: cZoom,
      boundingBox: cBoundingBox,
    } = await getMapConfig();

    layerSchemas.value = cLayerSchemas;
    layerGroups.value = cLayerGroups;
    zoom.value = cZoom;
    boundingBox.value = cBoundingBox;

    viewport.value = {
      latitude,
      longitude,
      zoom: zoom ?? 10,
      bearing: bearing ?? 0,
      pitch: pitch ?? 0,
      padding: padding ?? {
        top: 0,
        bottom: 0,
        left: 182,
        right: 0,
      },
    };
  };

  const handleViewportChange = (viewport: any) => {
    zoom.value = viewport.zoom;
    boundingBox.value = viewport.getBounds();
  };

  return {
    handleVisibleLayer,
    populateMapContext,
    selectFeature,
    handleViewportChange,
    flyTo,
  };
};

export const useMapContext = () => {
  const context = useContext(MapContext);

  if (!context)
    throw new Error("useMapContext must be used within a MapProvider");

  return { ...context, ...getMapHandlers(context) };
};
