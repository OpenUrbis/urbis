import { GeoJsonLayer, TextLayer } from "@deck.gl/layers";
import polylabel from "polylabel";
import { MAP_CONFIGS } from "../../application-configs";
import { createGetTextLayerUri } from "../../integrations/map-integration";
import {
  IGetConfigFillPattern,
  IGetConfigFillPatternConfig,
  IGetConfigLayerSchema,
} from "../../types/fetch-map-config-type";
import {
  MapBoundingBox,
  MapContextLayerSchemaTypeMap,
  MapContextLayerSchemaTypeMapProps,
} from "../../types/map-context-type";
import { createFn } from "../../utils/createFn";
import { CustomWMSLayer } from "./CustomWMSLayer";
import { formatBoundsForURL, transformBoundsToUTM } from "./transform-bounds";

const environmentUrl = import.meta.env.VITE_API_URL || "/api";

type Color = [number, number, number, number];
type ColorConfig = { [key: string]: Color };

const buildColorsObj = (layer: IGetConfigLayerSchema) => {
  const { colors } = layer;

  const fillColors: ColorConfig = {};
  const lineColors: ColorConfig = {};
  const textColors: ColorConfig = {};
  const patterns: { [key: string]: IGetConfigFillPattern } = {};
  const patternConfigs: { [key: string]: IGetConfigFillPatternConfig } = {};

  if (colors.length > 0)
    colors.forEach((color) => {
      const key: string = color.value ?? color.label;

      if (color?.pattern) {
        patterns[key] = color.pattern;
        if (color.patternConfig) patternConfigs[key] = color.patternConfig;
      }

      if (color?.type === "line") lineColors[key] = color.color;
      else if (color?.type === "text") textColors[key] = color.color;
      else fillColors[key] = color.color;
    });
  else
    fillColors.default = colors?.[0]?.color ?? MAP_CONFIGS.DEFAULT_LAYER_COLOR;

  return { fillColors, lineColors, textColors, patterns, patternConfigs };
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

const generateGetColorFns = (
  layer: IGetConfigLayerSchema,
  selectedFeatureIds: string[] = []
) => {
  const { getTextColorPropName, getFillColorPropName, getLineColorPropName } =
    layer;
  const { fillColors, lineColors, textColors, patterns, patternConfigs } =
    buildColorsObj(layer);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTextColor = (d: any): Color => {
    const key = getTextColorPropName ?? getFillColorPropName ?? "default";
    const keyToFind = d?.properties?.[key] ?? "default";
    const color = textColors?.[keyToFind];
    if (!color)
      return fillColors?.[keyToFind] ?? MAP_CONFIGS.DEFAULT_LAYER_COLOR;

    return color;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLineColor = (d: any): Color => {
    const key = getLineColorPropName ?? getFillColorPropName ?? "default";
    const keyToFind = d?.properties?.[key] ?? "default";
    const color = lineColors?.[keyToFind];
    if (!color)
      return fillColors?.[keyToFind] ?? MAP_CONFIGS.DEFAULT_LAYER_COLOR;

    return color;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFillColor = (d: any): Color => {
    const key = getFillColorPropName ?? "default";
    const keyToFind = d?.properties?.[key] ?? "default";
    const color = fillColors?.[keyToFind] ?? MAP_CONFIGS.DEFAULT_LAYER_COLOR;

    const isSelected =
      MAP_CONFIGS.CHECKER_POLYGON_IS_SELECTED.CHECK_ARRAY_OF_PROPERTIES(
        selectedFeatureIds,
        d
      );

    if (isSelected) {
      return [color[0], color[1], color[2], 255];
    }

    return color;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFillPattern = (d: any): IGetConfigFillPattern =>
    patterns?.[d?.properties?.[getFillColorPropName!] ?? "default"] ?? "full";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFillPatternScale = (d: any): number =>
    patternConfigs?.[d?.properties?.[getFillColorPropName!] ?? "default"]
      ?.getFillPatternScale ?? 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFillPatternOffset = (d: any): [number, number] =>
    patternConfigs?.[d?.properties?.[getFillColorPropName!] ?? "default"]
      ?.getFillPatternOffset ?? [0, 0];

  return {
    getTextColor,
    getFillColor,
    getLineColor,
    getFillPattern,
    getFillPatternScale,
    getFillPatternOffset,
  };
};

const prepareLayerProperties = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any,
  props: MapContextLayerSchemaTypeMapProps
) => {
  const { is3DActive } = props;
  let { getElevation } = properties;

  if (
    getElevation &&
    typeof getElevation === "string" &&
    getElevation.includes("=>")
  ) {
    const getElevationFn = createFn(getElevation, false);
    if (getElevationFn)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getElevation = (feature: any) => {
        if (!is3DActive) return 0;

        return getElevationFn(feature);
      };
  }

  return { ...properties, getElevation };
};

const checkZoom = (zoom: number, min?: number, max?: number) => {
  return (min && zoom < min) || (max && zoom >= max);
};

const createTextLayer = (
  layer: IGetConfigLayerSchema,
  props: MapContextLayerSchemaTypeMapProps,
  getTextColor: (d: any) => Color,
  filteredOrigin?: string
) => {
  const { zoom } = props;
  const { properties, id, origin: rawOrigin } = layer;
  const data = filteredOrigin || rawOrigin;

  const { getText, minZoomText: minZoom, maxZoomText: maxZoom } = properties;
  const getTextFn = getText ? createFn(getText, false) : null;

  if (!getText || !getTextFn || checkZoom(zoom, minZoom, maxZoom)) return false;

  return new TextLayer({
    id: `text-layer-${id}`,
    data: createGetTextLayerUri(encodeURIComponent(data)),
    getPosition: (d: any) => {
      try {
        return polylabel(d.rawCoordinates, 0.000001);
      } catch (err) {
        console.warn(
          `Error on calculate center with polylabel with id ${d.properties.id}:`,
          err
        );
        return d.coordinates;
      }
    },
    getText: getTextFn,
    getColor: getTextColor,
    getSize: 10,
    minZoom,
  });
};

const createGeoJsonLayer = (
  layer: IGetConfigLayerSchema,
  props: MapContextLayerSchemaTypeMapProps
): any => {
  const { selectedFeatureIds = [], is3DActive } = props;

  const {
    id,
    origin: rawData,
    minZoom,
    clickAction,
    viewTemplate,
    properties,
    cqlFilter
  } = layer;

  let data = rawData;
  if (cqlFilter && typeof data === 'string' && (data.includes('http') || data.startsWith('/'))) {
      const separator = data.includes('?') ? '&' : '?';
      data = `${data}${separator}CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
  }

  // Use proxy for external GeoJson/WFS sources to avoid CORS
  if (typeof data === 'string' && data.startsWith('http') && !data.includes(window.location.host) && !data.includes('/maps/proxy')) {
    data = `${environmentUrl}/maps/proxy?url=${data}`;
  }

  const {
    getFillColor,
    getFillPattern,
    getLineColor,
    getTextColor,
    getFillPatternScale,
    getFillPatternOffset,
  } = generateGetColorFns(layer, selectedFeatureIds);
  const patternObj = {
    ...MAP_CONFIGS.PATTERN_PROPERTIES,
    getFillPattern,
    getFillPatternScale,
    getFillPatternOffset,
  };
  const textLayer = createTextLayer(layer, props, getTextColor, data);

  const result: any[] = [
    new GeoJsonLayer({
      ...MAP_CONFIGS.DEFAULT_LAYER_PROPERTIES,
      id,
      data,
      minZoom,
      getLineColor: getLineColor,
      getFillColor: getFillColor,
      clickAction,
      viewTemplate,
      updateTriggers: {
        getFillColor: { selectedFeatureIds },
        getElevation: { is3DActive },
      },
      ...prepareLayerProperties(properties, props),
      ...patternObj,
      extruded: !is3DActive ? false : properties?.extruded,
    }),
  ];

  if (textLayer) result.push(textLayer);

  return result;
};

const BUILD_OBJECT_BASED_ON_TYPE: MapContextLayerSchemaTypeMap = {
  Stream: (layer, props) => {
    const { boundingBox: bbox, selectedFeatureIds } = props;
    const { origin } = layer;

    // Improved detection for geographic SRS
    const srsName = (origin.match(/srsName=([^&]+)/i)?.[1] || "").toUpperCase();
    
    // Check if the service version is 1.3.0 or higher
    const isWfs130 = origin.includes("version=1.3.0") || origin.includes("VERSION=1.3.0") || 
                     origin.includes("version=2.0.0") || origin.includes("VERSION=2.0.0");

    // Standard geographic SRS
    const isGeographic = srsName === "EPSG:4326" || srsName === "CRS:84" || srsName === "CRS84" || srsName === "EPSG:4674";

    const gridCells = calculateGridCells(bbox);
    const layers = gridCells.map((cellBbox) => {
      const cellId = `cell-${self.crypto.randomUUID()}`.replace(/\./g, "_");
      
      let formattedBounds: string;
      
      if (isGeographic) {
        // AXIS ORDER LOGIC FOR GEOGRAPHIC COORDINATES (LAT/LON)
        // Standard (longitude first): [minLon, minLat, maxLon, maxLat]
        // Swapped (latitude first): [minLat, minLon, maxLat, maxLon]
        
        let shouldSwap = false;
        
        if (isWfs130) {
          // In WFS 1.3.0+ (and 1.1.0 often follows this too for EPSG codes), 
          // EPSG:4326 and EPSG:4674 are officially [latitude, longitude].
          // CRS:84 is explicitly defined as [longitude, latitude].
          if (srsName === "EPSG:4326" || srsName === "EPSG:4674") {
            shouldSwap = true;
          }
        }

        if (shouldSwap) {
          // Swapped axis order: [minLat, minLon, maxLat, maxLon]
          formattedBounds = formatBoundsForURL([
            cellBbox[1], // minLat
            cellBbox[0], // minLon
            cellBbox[3], // maxLat
            cellBbox[2], // maxLon
          ]);
        } else {
          // Standard axis order: [minLon, minLat, maxLon, maxLat]
          formattedBounds = formatBoundsForURL([
            cellBbox[0], // minLon
            cellBbox[1], // minLat
            cellBbox[2], // maxLon
            cellBbox[3], // maxLat
          ]);
        }
      } else {
        // Default to UTM transformation (meters) - original behavior for slui.dev
        const utmBounds = [
          transformBoundsToUTM([cellBbox[0], cellBbox[1]]),
          transformBoundsToUTM([cellBbox[2], cellBbox[3]]),
        ];

        formattedBounds = formatBoundsForURL([
          utmBounds[0][0],
          utmBounds[0][1],
          utmBounds[1][0],
          utmBounds[1][1],
        ]);
      }

      // Append SRS to BBOX if geographic to help GeoServer identify the projection
      // And force CRS:84 specifically for Funai if geographic
      const effectiveSrs = srsName === "EPSG:4674" ? "EPSG:4326" : srsName;
      const bboxParam = isGeographic ? `${formattedBounds},${effectiveSrs}` : formattedBounds;
      
      // Ensure we don't have conflicting SRS params
      let cleanOrigin = origin;
      if (isGeographic && origin.includes("srsName=")) {
        cleanOrigin = origin.replace(/srsName=[^&]+/i, `srsName=${effectiveSrs}`);
      }

      const originWithBBox = `${cleanOrigin}&bbox=${bboxParam}`;

      return createGeoJsonLayer(
        {
          ...layer,
          id: cellId,
          origin: originWithBBox,
        },
        { selectedFeatureIds, ...props }
      );
    });

    return layers;
  },
  GeoJsonLayer: (layer, props) => [createGeoJsonLayer(layer, props)],
  CustomWMSLayer: (layer) => {
    const { origin, properties, cqlFilter } = layer;
    const { sldBody } = properties || {};
    
    // Support both nested properties.wms.layers and top-level typeName or layer.id
    const layerNames = properties?.wms?.layers 
      ? [properties.wms.layers] 
      : properties?.typeName 
        ? [properties.typeName] 
        : [layer.id];

    // For external WMS (like Funai), we should use our proxy for GetMap requests
    // to avoid CORS issues. 
    let finalOrigin = origin;
    
    // Check if nested wms url exists and is external
    if (properties?.wms?.url && properties.wms.url.startsWith('http') && !properties.wms.url.includes(window.location.host)) {
      finalOrigin = properties.wms.url;
    }

    if (finalOrigin.startsWith('http') && !finalOrigin.includes(window.location.host) && !finalOrigin.includes('/maps/proxy')) {
      // If it's an absolute URL and not pointing to our own domain
      // and not already proxied, we wrap it in our proxy.
      finalOrigin = `${environmentUrl}/maps/proxy?url=${finalOrigin}`;
    }

    return [
      new CustomWMSLayer({
        id: layer.id,
        data: finalOrigin,
        serviceType: "wms",
        layers: layerNames,
        cqlFilter: cqlFilter,
        sldBody: sldBody,
      }),
    ];
  },
};

export const transformSchemaLayers = (
  layersConfig: IGetConfigLayerSchema[],
  props: MapContextLayerSchemaTypeMapProps
) => {
  const { zoom } = props;

  const selectedFeatureIds =
    MAP_CONFIGS.CHECKER_POLYGON_IS_SELECTED.BUILD_ARRAY_OF_PROPERTIES(props);

  return layersConfig
    .filter((layer) => {
      const { isVisible, minZoom, properties = {}, type } = layer;
      const { maxZoom } = properties;

      // Enforce minimum zoom of 12 for Stream layers
      const effectiveMinZoom = type === "Stream" 
        ? Math.max(minZoom || 0, 12) 
        : minZoom;

      if (checkZoom(zoom, effectiveMinZoom, maxZoom)) return false;

      return isVisible;
    })
    .map((layer) => {
      if (BUILD_OBJECT_BASED_ON_TYPE?.[layer.type])
        return BUILD_OBJECT_BASED_ON_TYPE[layer.type]!(layer, {
          ...props,
          selectedFeatureIds,
        });

      return null;
    });
};
