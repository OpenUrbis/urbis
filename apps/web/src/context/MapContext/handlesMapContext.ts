/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MapContextSelectedFeature,
  MapContextType,
} from "../../dto/mapContextDto";
import { getMapConfig, IGetConfigLayerSchema } from "../../services/mapService";

export const getMapHandlers = (context: MapContextType) => {
  const {
    layersSchema,
    layerGroups,
    selectedFeatures,
    boundingBox,
    viewport,
    zoom,
  } = context;

  const handleVisibleLayer = (layerId: string) => {
    layersSchema.value = layersSchema.value.map(
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
    const configs = await getMapConfig();

    layersSchema.value = configs.layerSchemas;
    layerGroups.value = configs.layerGroups;
    zoom.value = configs.zoom;
    boundingBox.value = configs.boundingBox;
    viewport.value = {
      latitude: -23.5505,
      longitude: -46.6333,
      zoom: configs.zoom ?? 10,
      bearing: configs.bearing ?? 0,
      pitch: configs.pitch ?? 0,
      padding: configs.padding ?? {
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
  };
};
