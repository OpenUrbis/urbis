import { FillStyleExtension } from "@deck.gl/extensions";
import { ClickActionEnum } from "@open-urbis/map-shared";
import polylabel from "polylabel";
import { BackButton } from "./components/BackButton";
import { FeaturesView } from "./components/FeaturesView";
import { getGeoJsonBounds } from "./components/MapView/utils";
import { calculateCenterId } from "./utils/calculateCenterId";
import { useMapContext } from "./hooks/useMapContext";
import { useNavigationContext } from "./hooks/useNavigationContext";
import { PATTERN_ATLAS_URL, PATTERN_MAPPING_URL } from "./lib/layer-patterns";
import {
  IMapActionProps,
  MapContextLayerSchemaTypeMapProps,
} from "./types/map-context-type";

const buildComparableFeatureIds = (feature: any): string[] => {
  const properties = feature?.properties ?? {};
  const ids = [
    feature?.id,
    properties?.id,
    properties?.cd_identificador,
    properties?.cd_identificador_original_lote,
  ];

  const inscriçãoParts = [
    properties?.cd_setor_fiscal,
    properties?.cd_quadra_fiscal,
    properties?.cd_lote,
    properties?.cd_condominio,
  ].filter(Boolean);

  if (inscriçãoParts.length >= 3) {
    ids.push(inscriçãoParts.join("|"));
  }

  return ids
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(String);
};

interface FillPatternProperties {
  fillPatternMask: boolean;
  fillPatternAtlas: string;
  fillPatternMapping: string;
  getFillPatternScale: number;
  getFillPatternOffset: [number, number];
  extensions: [FillStyleExtension];
}

interface DefaultPropertiesDestination {
  pitch?: number;
  bearing?: number;
}

interface DefaultLayerProperties {
  pointType?: string;
  filled: boolean;
  stroked?: boolean;
  lineWidthUnits?: string;
  lineWidthMinPixels?: number;
  pointRadiusUnits?: string;
  pointRadiusMinPixels?: number;
  getText: () => string;
  getTextSize: number;
  transitions?: Record<string, any>;
  onError?: (error: any) => void;
}

type PreProcessingLayerProperties = (properties: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getElevation?: string | ((...args: any[]) => number);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) => any;

interface CheckerPolygonIsSelected {
  BUILD_ARRAY_OF_PROPERTIES: (
    props: MapContextLayerSchemaTypeMapProps,
  ) => string[];
  CHECK_ARRAY_OF_PROPERTIES: (
    selectedFeatureIds: string[],
    polygon: { properties?: { id?: string } },
  ) => [number, number, number, number] | null;
}

interface MapConfigs {
  PATTERN_PROPERTIES: FillPatternProperties;
  DEFAULT_LAYER_COLOR: [number, number, number, number];
  GRID_CELL_SIZE: number;
  DEFAULT_PROPERTIES_DESTINATION_ON_OPEN_PROPS: DefaultPropertiesDestination;
  DEFAULT_LAYER_PROPERTIES: DefaultLayerProperties;
  PRE_PROCESSING_LAYER_PROPERTIES: PreProcessingLayerProperties;
  CHECKER_POLYGON_IS_SELECTED: CheckerPolygonIsSelected;
}

export const MAP_CONFIGS: MapConfigs = {
  PATTERN_PROPERTIES: {
    // props added by FillStyleExtension
    fillPatternMask: true,
    fillPatternAtlas: PATTERN_ATLAS_URL,
    fillPatternMapping: PATTERN_MAPPING_URL,
    getFillPatternScale: 0.25,
    getFillPatternOffset: [0, 0],

    // Define extensions
    extensions: [new FillStyleExtension({ pattern: true })],
  },
  DEFAULT_LAYER_COLOR: [0, 0, 0, 240],
  GRID_CELL_SIZE: 0.01,
  DEFAULT_PROPERTIES_DESTINATION_ON_OPEN_PROPS: {
    // pitch: 45,
    // bearing: 0,
  },
  DEFAULT_LAYER_PROPERTIES: {
    pointType: "circle",
    filled: true,
    stroked: true,
    lineWidthUnits: "pixels",
    lineWidthMinPixels: 1,
    pointRadiusUnits: "pixels",
    pointRadiusMinPixels: 4,
    getText: () => "",
    getTextSize: 12,
    transitions: {
      getFillColor: 150,
      getLineColor: 150,
      getElevation: 200,
      getRadius: 150,
      getTextColor: 150,
    },
    onError: (error: any) => {
      console.warn("[deck.gl Layer Error]", error?.message || error);
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PRE_PROCESSING_LAYER_PROPERTIES: (properties: any) => {
    const { getElevation } = properties;

    if (getElevation) {
      try {
        const fn = new Function(`return ${getElevation}`)();
        if (typeof fn !== "function") return properties;

        properties.getElevation = fn;

        return properties;
      } catch (e) {
        console.error(e);
        return properties;
      }
    }
  },
  CHECKER_POLYGON_IS_SELECTED: {
    BUILD_ARRAY_OF_PROPERTIES: ({ selectedFeature }) =>
      selectedFeature
        ? selectedFeature.flatMap((item) =>
            buildComparableFeatureIds(item.feature),
          )
        : [],
    CHECK_ARRAY_OF_PROPERTIES: (
      selectedFeatureIds: string[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      polygon: any,
    ): [number, number, number, number] | null => {
      const ids = buildComparableFeatureIds(polygon);
      return ids.some((id) => selectedFeatureIds.includes(id))
        ? [255, 0, 0, 255]
        : null;
    },
  },
};

export const CLICK_ACTIONS_CONFIG = (): {
  [key in ClickActionEnum]: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clickActionParams: any,
    informations: IMapActionProps,
  ) => void;
} => {
  const { selectFeature, flyTo } = useMapContext();
  const { navigateTo } = useNavigationContext();

  return {
    [ClickActionEnum.SelectFeature]: function (
      { zoom = 17.1 },
      { latitude, longitude, template, feature },
    ): void {
      if (!feature || !(feature as { id: string })?.id)
        return console.error(
          'clickAction(selectFeature) Error: Property "feature" is not defined',
        );
      if (!template)
        return console.error(
          'clickAction(selectFeature) Error: Property "template" is not defined',
        );

      let center = [longitude, latitude];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const geom = (feature as any)?.geometry;
      if (geom && (geom.type === "Polygon" || geom.type === "MultiPolygon")) {
        try {
          const coords =
            geom.type === "Polygon" ? geom.coordinates : geom.coordinates[0];
          const centroid = polylabel(coords, 0.000001);
          if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
            center = centroid;
          }
        } catch (e) {
          console.warn("Failed to calculate centroid", e);
        }
      }

      selectFeature({ feature, template });

      const padding = { top: 72, bottom: 40, left: 40, right: 40 };

      const bounds = getGeoJsonBounds(feature);

      flyTo({
        ...(bounds ? { bounds } : { center, zoom }),
        padding,
        ...MAP_CONFIGS.DEFAULT_PROPERTIES_DESTINATION_ON_OPEN_PROPS,
      });
    },
    [ClickActionEnum.OpenAttributesTable]: function (
      { zoom = 17.1 },
      { latitude, longitude, template, feature },
    ): void {
      if (!feature)
        return console.error(
          'clickAction(OpenAttributesTable) Error: Property "feature" is not defined',
        );

      let center = [longitude, latitude];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const geom = (feature as any)?.geometry;
      if (geom && (geom.type === "Polygon" || geom.type === "MultiPolygon")) {
        try {
          const coords =
            geom.type === "Polygon" ? geom.coordinates : geom.coordinates[0];
          const centroid = polylabel(coords, 0.000001);
          if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
            center = centroid;
          }
        } catch (e) {
          console.warn("Failed to calculate centroid", e);
        }
      }

      selectFeature({
        feature: {
          ...feature,
          _initialTab: "table",
        },
        template: template || [],
      });

      const padding = { top: 72, bottom: 40, left: 40, right: 40 };

      const bounds = getGeoJsonBounds(feature);

      flyTo({
        ...(bounds ? { bounds } : { center, zoom }),
        padding,
        ...MAP_CONFIGS.DEFAULT_PROPERTIES_DESTINATION_ON_OPEN_PROPS,
      });
    },
    [ClickActionEnum.SetZoom]: function (
      { zoom },
      { latitude, longitude, feature },
    ): void {
      let center = [longitude, latitude];
      if (
        (isNaN(longitude) ||
          isNaN(latitude) ||
          longitude === undefined ||
          latitude === undefined) &&
        feature
      ) {
        center = calculateCenterId(feature);
      }

      if (!zoom)
        return console.error(
          'clickAction(setZoom) Error: Property "zoom" is not defined',
        );

      if (isNaN(center[0]) || isNaN(center[1])) {
        return console.error(
          'clickAction(setZoom) Error: Invalid center coordinates',
          center,
        );
      }

      setTimeout(() => {
        flyTo({
          center,
          zoom,
          ...MAP_CONFIGS.DEFAULT_PROPERTIES_DESTINATION_ON_OPEN_PROPS,
        });
      });
    },
    [ClickActionEnum.openFeature]: function ({ template }, { feature }) {
      if (!feature) return;
      selectFeature({
        feature,
        template: template ?? [],
      });
    },
  };
};
