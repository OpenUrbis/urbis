import { GeoJsonLayer } from "@deck.gl/layers";
import { MAP_CONFIGS } from "../../application-configs";
import {
  IGetConfigFillPattern,
  IGetConfigLayerSchema,
} from "../../types/fetch-map-config-type";
import {
  MapBoundingBox,
  MapContextLayerSchemaTypeMap,
  MapContextLayerSchemaTypeMapProps,
  MapContextRenderedLayer,
} from "../../types/map-context-type";
import { CustomWMSLayer } from "./CustomWMSLayer";
import { formatBoundsForURL, transformBoundsToUTM } from "./transform-bounds";

type Color = [number, number, number, number];
type ColorConfig = { [key: string]: Color };

const buildColorsObj = (layer: IGetConfigLayerSchema) => {
  const { colors } = layer;

  const fillColors: ColorConfig = {};
  const lineColors: ColorConfig = {};
  const textColors: ColorConfig = {};
  const patterns: { [key: string]: IGetConfigFillPattern } = {};

  if (colors.length > 0)
    colors.forEach((color) => {
      const key: string = color.value ?? color.label;

      if (color?.pattern) patterns[key] = color.pattern;

      if (color?.type === "line") lineColors[key] = color.color;
      else if (color?.type === "text") textColors[key] = color.color;
      else fillColors[key] = color.color;
    });
  else
    fillColors.default = colors?.[0]?.color ?? MAP_CONFIGS.DEFAULT_LAYER_COLOR;

  return { fillColors, lineColors, textColors, patterns };
};

const calculateGridCells = (bbox: MapBoundingBox): MapBoundingBox[] => {
  const [minX, minY, maxX, maxY] = bbox;
  const cells: MapBoundingBox[] = [];

  // Arredonda os limites para o grid fixo
  const startX =
    Math.floor(minX / MAP_CONFIGS.GRID_CELL_SIZE) * MAP_CONFIGS.GRID_CELL_SIZE;
  const startY =
    Math.floor(minY / MAP_CONFIGS.GRID_CELL_SIZE) * MAP_CONFIGS.GRID_CELL_SIZE;
  const endX =
    Math.ceil(maxX / MAP_CONFIGS.GRID_CELL_SIZE) * MAP_CONFIGS.GRID_CELL_SIZE;
  const endY =
    Math.ceil(maxY / MAP_CONFIGS.GRID_CELL_SIZE) * MAP_CONFIGS.GRID_CELL_SIZE;

  // Gera as células do grid com precisão fixa
  for (let x = startX; x < endX; x += MAP_CONFIGS.GRID_CELL_SIZE) {
    for (let y = startY; y < endY; y += MAP_CONFIGS.GRID_CELL_SIZE) {
      cells.push([
        Number(x.toFixed(6)),
        Number(y.toFixed(6)),
        Number((x + MAP_CONFIGS.GRID_CELL_SIZE).toFixed(6)),
        Number((y + MAP_CONFIGS.GRID_CELL_SIZE).toFixed(6)),
      ]);
    }
  }

  return cells;
};

const generateGetColorFns = (layer: IGetConfigLayerSchema, selectedFeatureIds: string[] = []) => {
  const { getTextColorPropName, getFillColorPropName, getLineColorPropName } =
    layer;
  const { fillColors, lineColors, textColors, patterns } =
    buildColorsObj(layer);

  const getTextColor = (d: any): Color => {
    const key = getTextColorPropName ?? getFillColorPropName ?? "default";
    const keyToFind = d?.properties?.[key] ?? "default";
    const color = textColors?.[keyToFind];
    if (!color)
      return fillColors?.[keyToFind] ?? MAP_CONFIGS.DEFAULT_LAYER_COLOR;

    return color;
  };

  const getLineColor = (d: any): Color => {
    const key = getLineColorPropName ?? getFillColorPropName ?? "default";
    const keyToFind = d?.properties?.[key] ?? "default";
    const color = lineColors?.[keyToFind];
    if (!color)
      return fillColors?.[keyToFind] ?? MAP_CONFIGS.DEFAULT_LAYER_COLOR;

    return color;
  };

  const getFillColor = (d: any): Color => {
    if (selectedFeatureIds.includes(d?.id)) return [255, 0, 0, 255];

    const key = getFillColorPropName ?? "default";
    const keyToFind = d?.properties?.[key] ?? "default";
    const color = fillColors?.[keyToFind];

    return color ?? MAP_CONFIGS.DEFAULT_LAYER_COLOR;
  };

  const getFillPattern = (d: any): IGetConfigFillPattern =>
    patterns?.[d?.properties?.[getFillColorPropName!] ?? "default"] ?? "full";

  return { getTextColor, getFillColor, getLineColor, getFillPattern };
};

const createGeoJsonLayer = (
  layer: IGetConfigLayerSchema,selectedFeatureIds:string[] = []
): MapContextRenderedLayer => {
  const {
    id,
    origin: data,
    minZoom,
    clickAction,
    viewTemplate,
    properties,
  } = layer;
  const { getFillColor, getFillPattern, getLineColor, getTextColor } =
    generateGetColorFns(layer, selectedFeatureIds);
  const patternObj = { ...MAP_CONFIGS.PATTERN_PROPERTIES, getFillPattern };

  return new GeoJsonLayer({
    ...MAP_CONFIGS.DEFAULT_LAYER_PROPERTIES,
    id,
    data,
    minZoom,
    getTextColor: getTextColor,
    getLineColor: getLineColor,
    getFillColor: getFillColor,
    clickAction,
    viewTemplate,
    ...properties,
    ...patternObj,
  });
};

const BUILD_OBJECT_BASED_ON_TYPE: MapContextLayerSchemaTypeMap = {
  Stream: (layer, props) => {
    const { boundingBox: bbox, selectedFeatureIds } = props;
    const { origin } = layer;

    const gridCells = calculateGridCells(bbox);
    const layers = gridCells.map((cellBbox) => {
      const formattedBbox = cellBbox.map((coord) => Number(coord).toFixed(6));
      const cellId =
        `cell-${formattedBbox[0]}-${formattedBbox[1]}-${formattedBbox[2]}-${formattedBbox[3]}`.replace(
          /\./g,
          "_"
        );
      const utmBounds = [
        transformBoundsToUTM([cellBbox[0], cellBbox[1]]),
        transformBoundsToUTM([cellBbox[2], cellBbox[3]]),
      ];

      const formattedBounds = formatBoundsForURL([
        utmBounds[0][0],
        utmBounds[0][1],
        utmBounds[1][0],
        utmBounds[1][1],
      ]);

      const originWithBBox = `${origin}&bbox=${formattedBounds}`;

      return createGeoJsonLayer({
        ...layer,
        id: cellId,
        origin: originWithBBox,
      }, selectedFeatureIds);
    });

    return layers;
  },
  GeoJsonLayer: (layer) => [createGeoJsonLayer(layer)],
  CustomWMSLayer: (layer) => [
    new CustomWMSLayer({
      data: "https://geoserver.slui.dev/geoserver/slui/wms",
      serviceType: "wms",
      layers: [layer.id],
    }),
  ],
};

export const transformSchemaLayers = (
  layersConfig: IGetConfigLayerSchema[],
  props: MapContextLayerSchemaTypeMapProps
) => {
  const { zoom, selectedFeature } = props;

  const selectedFeatureIds = selectedFeature.map((item) => (item.feature as { id: string }).id);

  return layersConfig
    .filter((layer) => {
      const { isVisible, minZoom, properties = {} } = layer;
      const { maxZoom } = properties;

      if (minZoom && zoom <= minZoom) return false;

      if (maxZoom && zoom >= maxZoom) return false;

      return isVisible;
    })
    .map((layer) => {
      if (BUILD_OBJECT_BASED_ON_TYPE?.[layer.type])
        return BUILD_OBJECT_BASED_ON_TYPE[layer.type]!(layer, { ...props, selectedFeatureIds });

      return null;
    });
};
