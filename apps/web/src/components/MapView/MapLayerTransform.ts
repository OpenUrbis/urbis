/* eslint-disable @typescript-eslint/no-explicit-any */
import { FillStyleExtension } from "@deck.gl/extensions";
import { GeoJsonLayer } from "@deck.gl/layers";
import {
  MapBoundingBox,
  MapContextLayerSchemaTypeMap,
  MapContextLayerSchemaTypeMapProps,
  MapContextRenderedLayer,
} from "../../dto/mapContextDto";
import {
  IGetConfigFillPattern,
  IGetConfigLayerSchema,
} from "../../services/mapService";
import { CustomWMSLayer } from "./CustomWMSLayer";
import { formatBoundsForURL, transformBoundsToUTM } from "./transformBounds";

type Color = [number, number, number, number];
type ColorConfig = { [key: string]: Color };

const PATTERN_PROPERTIES_OBJ = {
  // props added by FillStyleExtension
  fillPatternMask: true,
  fillPatternAtlas: "/pattern.png",
  fillPatternMapping: "/pattern.json",
  getFillPatternScale: 0.5,
  getFillPatternOffset: [0, 0],

  // Define extensions
  extensions: [new FillStyleExtension({ pattern: true })],
};

const DEFAULT_COLOR: Color = [0, 0, 0, 240];
const GRID_CELL_SIZE = 0.01;

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
  else fillColors.default = colors?.[0]?.color ?? DEFAULT_COLOR;

  return { fillColors, lineColors, textColors, patterns };
};

const calculateGridCells = (bbox: MapBoundingBox): MapBoundingBox[] => {
  const [minX, minY, maxX, maxY] = bbox;
  const cells: MapBoundingBox[] = [];

  // Arredonda os limites para o grid fixo
  const startX = Math.floor(minX / GRID_CELL_SIZE) * GRID_CELL_SIZE;
  const startY = Math.floor(minY / GRID_CELL_SIZE) * GRID_CELL_SIZE;
  const endX = Math.ceil(maxX / GRID_CELL_SIZE) * GRID_CELL_SIZE;
  const endY = Math.ceil(maxY / GRID_CELL_SIZE) * GRID_CELL_SIZE;

  // Gera as células do grid com precisão fixa
  for (let x = startX; x < endX; x += GRID_CELL_SIZE) {
    for (let y = startY; y < endY; y += GRID_CELL_SIZE) {
      cells.push([
        Number(x.toFixed(6)),
        Number(y.toFixed(6)),
        Number((x + GRID_CELL_SIZE).toFixed(6)),
        Number((y + GRID_CELL_SIZE).toFixed(6)),
      ]);
    }
  }

  return cells;
};

const generateGetColorFns = (layer: IGetConfigLayerSchema) => {
  const { getTextColorPropName, getFillColorPropName, getLineColorPropName } =
    layer;
  const { fillColors, lineColors, textColors, patterns } =
    buildColorsObj(layer);

  const getTextColor = (d: any): Color => {
    const key = getTextColorPropName ?? getFillColorPropName ?? "default";
    const keyToFind = d?.properties?.[key] ?? "default";
    const color = textColors?.[keyToFind];
    if (!color) return fillColors?.[keyToFind] ?? DEFAULT_COLOR;

    return color;
  };

  const getLineColor = (d: any): Color => {
    const key = getLineColorPropName ?? getFillColorPropName ?? "default";
    const keyToFind = d?.properties?.[key] ?? "default";
    const color = lineColors?.[keyToFind];
    if (!color) return fillColors?.[keyToFind] ?? DEFAULT_COLOR;

    return color;
  };

  const getFillColor = (d: any): Color => {
    const key = getFillColorPropName ?? "default";
    const keyToFind = d?.properties?.[key] ?? "default";
    const color = fillColors?.[keyToFind];

    return color ?? DEFAULT_COLOR;
  };

  const getFillPattern = (d: any): IGetConfigFillPattern =>
    patterns?.[d?.properties?.[getFillColorPropName!] ?? "default"] ?? "full";

  return { getTextColor, getFillColor, getLineColor, getFillPattern };
};

const createGetElevationFn = (properties: any) => {
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
};

const createGeoJsonLayer = (
  layer: IGetConfigLayerSchema
): MapContextRenderedLayer => {
  const { id, origin: data, minZoom, clickAction, viewTemplate } = layer;
  const { getFillColor, getFillPattern, getLineColor, getTextColor } =
    generateGetColorFns(layer);
  const patternObj = { ...PATTERN_PROPERTIES_OBJ, getFillPattern };
  const properties = createGetElevationFn(layer.properties);

  return new GeoJsonLayer({
    id,
    data,
    minZoom,
    filled: true,
    getText: () => "",
    getTextColor: getTextColor,
    getLineColor: getLineColor,
    getFillColor: getFillColor,
    getTextSize: 12,
    clickAction,
    viewTemplate,
    ...properties,
    ...patternObj,
  });
};

const BUILD_OBJECT_BASED_ON_TYPE: MapContextLayerSchemaTypeMap = {
  /* TileLayer: (layer) =>
    new TileLayer({
      id: layer.id,
      data: layer.urlTemplate,
      minZoom: 0,
      maxZoom: 20,
    }), */
  Stream: (layer, props) => {
    const { boundingBox: bbox } = props;
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
      });
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
  const { zoom } = props;

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
        return BUILD_OBJECT_BASED_ON_TYPE[layer.type]!(layer, props);

      return null;
    });
};
