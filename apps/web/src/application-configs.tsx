import { FillStyleExtension } from "@deck.gl/extensions";
import { ClickActionEnum } from "@open-urbis/map-shared";
import { FeaturesView } from "./components/FeaturesView";
import { useMapContext } from "./hooks/useMapContext";
import { useNavigationContext } from "./hooks/useNavigationContext";
import { IMapActionProps } from "./types/map-context-type";
import { BackButton } from "./components/BackButton";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MAP_CONFIGS: any = {
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
      toggleDrawer();
      selectFeature({ feature, template });
      flyTo({
        center: [longitude, latitude],
        zoom,
        ...MAP_CONFIGS.DEFAULT_PROPERTIES_DESTINATION_ON_OPEN_PROPS,
      });
      navigateTo(<div className="initial-page">
        <FeaturesView />
      </div>);
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
