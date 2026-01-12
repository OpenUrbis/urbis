import { FillStyleExtension } from "@deck.gl/extensions";
import { ClickActionEnum } from "@open-urbis/map-shared";
import { BackButton } from "./components/BackButton";
import { FeaturesView } from "./components/FeaturesView";
import { useMapContext } from "./hooks/useMapContext";
import { useNavigationContext } from "./hooks/useNavigationContext";
import { useMediaQuery } from "./hooks/useMediaQuery";
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
    props: MapContextLayerSchemaTypeMapProps
  ) => string[];
  CHECK_ARRAY_OF_PROPERTIES: (
    selectedFeatureIds: string[],
    polygon: { properties?: { id?: string } }
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
    getFillPatternScale: 0.5,
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
            (item) => (item.feature as any).properties.id
          )
        : [],
    CHECK_ARRAY_OF_PROPERTIES: (
      selectedFeatureIds: string[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      polygon: any
    ): [number, number, number, number] | null =>
      selectedFeatureIds.includes(polygon?.properties?.id)
        ? [255, 0, 0, 255]
        : null,
  },
};

export const CLICK_ACTIONS_CONFIG = (): {
  [key in ClickActionEnum]: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clickActionParams: any,
    informations: IMapActionProps
  ) => void;
} => {
  const { selectFeature, flyTo } = useMapContext();
  const { navigateTo, toggleDrawer } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return {
    [ClickActionEnum.SelectFeature]: function (
      { zoom = 17.1 },
      { latitude, longitude, template, feature }
    ): void {
      if (!feature || !(feature as { id: string })?.id)
        return console.error(
          'clickAction(selectFeature) Error: Property "feature" is not defined'
        );
      if (!template)
        return console.error(
          'clickAction(selectFeature) Error: Property "template" is not defined'
        );
      if (!isDesktop) toggleDrawer();
      selectFeature({ feature, template });
      flyTo({
        center: [longitude, latitude],
        zoom,
        ...MAP_CONFIGS.DEFAULT_PROPERTIES_DESTINATION_ON_OPEN_PROPS,
      });
      navigateTo(
        <div className="initial-page">
          <FeaturesView />
        </div>
      );
    },
    [ClickActionEnum.SetZoom]: function (
      { zoom },
      { latitude, longitude }
    ): void {
      if (!zoom)
        return console.error(
          'clickAction(setZoom) Error: Property "zoom" is not defined'
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
      navigateTo(
        <div className="page active">
          <div className="page-header">
            <BackButton />
          </div>
          <FeaturesView feature={{ template: template ?? [], feature }} />
        </div>
      );
    },
  };
};
