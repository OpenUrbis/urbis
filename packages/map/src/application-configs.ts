import { FillStyleExtension } from "@deck.gl/extensions";
import { ClickActionEnum } from "@open-urbis/map-shared";
import polylabel from "polylabel";
import { useMapContext } from "./hooks/useMapContext";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useNavigationContext } from "./hooks/useNavigationContext";
import {
  IMapActionProps,
  MapContextLayerSchemaTypeMapProps,
} from "./types/map-context-type";

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
  filled: boolean;
  stroked?: boolean;
  lineWidthMinPixels?: number;
  getText: () => string;
  getTextSize: number;
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
    fillPatternAtlas: "/pattern.png",
    fillPatternMapping: "/pattern.json",
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
    filled: true,
    stroked: true,
    lineWidthMinPixels: 1,
    getText: () => "",
    getTextSize: 12,
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
        ? selectedFeature.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item) =>
              (item.feature as any).id || (item.feature as any).properties?.id,
          )
        : [],
    CHECK_ARRAY_OF_PROPERTIES: (
      selectedFeatureIds: string[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      polygon: any,
    ): [number, number, number, number] | null => {
      const id = polygon.id || polygon?.properties?.id;
      return selectedFeatureIds.includes(id) ? [255, 0, 0, 255] : null;
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
  const { navigateTo, toggleDrawer, drawerOpen } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");

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

      if (isDesktop && !drawerOpen.value) toggleDrawer();

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

      if (!isDesktop) toggleDrawer();
      selectFeature({ feature, template });

      const padding = { top: 0, bottom: 0, left: 0, right: 0 };

      if (isDesktop) {
        padding.left = 420;
      }
      padding.top = 64;

      flyTo({
        center,
        zoom,
        padding,
        ...MAP_CONFIGS.DEFAULT_PROPERTIES_DESTINATION_ON_OPEN_PROPS,
      });
      // FeaturesView navigation removed - consumer app should handle selection state
      // or implement custom action
    },
    [ClickActionEnum.SetZoom]: function (
      { zoom },
      { latitude, longitude },
    ): void {
      if (!zoom)
        return console.error(
          'clickAction(setZoom) Error: Property "zoom" is not defined',
        );

      setTimeout(() => {
        flyTo({
          center: [longitude, latitude],
          zoom,
          ...MAP_CONFIGS.DEFAULT_PROPERTIES_DESTINATION_ON_OPEN_PROPS,
        });
      });
    },
    [ClickActionEnum.openFeature]: function ({ template }, { feature }) {
      // FeaturesView navigation removed
    },
  };
};
