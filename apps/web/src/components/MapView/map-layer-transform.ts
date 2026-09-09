import { BitmapLayer, GeoJsonLayer, TextLayer } from "@deck.gl/layers";
import { COORDINATE_SYSTEM } from "@deck.gl/core";
import { MVTLayer } from "@deck.gl/geo-layers";
import { MVTLoader } from "@loaders.gl/mvt";
import polylabel from "polylabel";
import { MAP_CONFIGS } from "../../application-configs";
import { createGetTextLayerUri } from "../../integrations/map-integration";
import {
  IGetConfigFillPattern,
  IGetConfigFillPatternConfig,
  IGetConfigColor,
  IGetConfigLayerSchema,
} from "../../types/fetch-map-config-type";
import {
  MapBoundingBox,
  MapContextLayerSchemaTypeMap,
  MapContextLayerSchemaTypeMapProps,
} from "../../types/map-context-type";
import { createFn } from "../../utils/createFn";
import { normalizeLayerPattern } from "../../lib/layer-patterns";
import { CustomWMSLayer } from "./CustomWMSLayer";
import { formatBoundsForURL, transformBoundsToUTM } from "./transform-bounds";

const environmentUrl = import.meta.env.VITE_API_URL || "/api";

const isCurrentHost = (url: string): boolean => {
  if (typeof window === "undefined" || !window.location?.host) return false;
  return url.includes(window.location.host);
};

const extractLegacyTextProperty = (getText?: unknown) => {
  if (typeof getText !== "string") return "";

  const match =
    getText.match(/properties\?\.([A-Za-z0-9_]+)/)?.[1] ??
    getText.match(/properties\.([A-Za-z0-9_]+)/)?.[1] ??
    getText.match(/properties\?\.\[(['"])([^'"]+)\1\]/)?.[2] ??
    getText.match(/properties\[(['"])([^'"]+)\1\]/)?.[2];

  if (match) return match;

  if (getText.startsWith("(") || getText.includes("=>")) {
    return getText;
  }

  if (/^[A-Za-z0-9_]+$/.test(getText.trim())) {
    return getText.trim();
  }

  return "";
};

export const normalizeEnvironmentUrl = (url: string): string => {
  if (typeof url !== "string") return url;

  const prodDomain = "api.mapa.urbis.prefeitura.sp.gov.br";
  const isProdHost =
    typeof window !== "undefined" &&
    Boolean(window.location?.host?.includes(prodDomain));

  if (url.includes(prodDomain) && !isProdHost) {
    try {
      const urlObj = new URL(url);
      const relativePath = urlObj.pathname + urlObj.search;
      return `${environmentUrl}${relativePath}`;
    } catch {
      return url.replace(/https?:\/\/api\.mapa\.urbis\.prefeitura\.sp\.gov\.br/g, environmentUrl);
    }
  }

  return url;
};

const hexToRgba = (hex: string, defaultColor: Color = [17, 24, 39, 255]): Color => {
  if (!hex || typeof hex !== "string") return defaultColor;

  let cleaned = hex.trim().replace(/^#/, "");
  if (cleaned.length === 3) {
    cleaned = cleaned.split("").map((char) => char + char).join("");
  }

  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    return [r, g, b, 255];
  }

  if (cleaned.length === 8) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    const a = parseInt(cleaned.substring(6, 8), 16);
    return [r, g, b, a];
  }

  return defaultColor;
};

type Color = [number, number, number, number];
type ColorConfig = { [key: string]: Color };
const DEFAULT_GEOJSON_FILL_COLOR: Color = [55, 126, 184, 140];
const DEFAULT_GEOJSON_LINE_COLOR: Color = [31, 41, 55, 255];
const DEFAULT_GEOJSON_TEXT_COLOR: Color = [255, 255, 255, 255];

const buildColorsObj = (layer: IGetConfigLayerSchema) => {
  const colors = Array.isArray(layer.colors) ? layer.colors : [];

  const fillColors: ColorConfig = {};
  const lineColors: ColorConfig = {};
  const textColors: ColorConfig = {};
  const patterns: { [key: string]: IGetConfigFillPattern } = {};
  const patternConfigs: { [key: string]: IGetConfigFillPatternConfig } = {};

  colors.forEach((color) => {
    const key: string = color.value ?? color.label ?? "default";

    if (color?.pattern) {
      patterns[key] = normalizeLayerPattern(color.pattern);
      if (color.patternConfig) patternConfigs[key] = color.patternConfig;
    }

    if (color?.type === "line") lineColors[key] = color.color;
    else if (color?.type === "text") textColors[key] = color.color;
    else fillColors[key] = color.color;
  });

  const allKeys = new Set([
    ...Object.keys(fillColors),
    ...Object.keys(lineColors),
    ...Object.keys(textColors),
  ]);

  if (allKeys.size === 0) {
    allKeys.add("default");
  }

  allKeys.forEach((key) => {
    const fill = fillColors[key];
    const line = lineColors[key];
    const text = textColors[key];

    if (!fill && line) {
      fillColors[key] = line;
    } else if (!fill) {
      fillColors[key] = DEFAULT_GEOJSON_FILL_COLOR;
    }

    if (!line && fill) {
      lineColors[key] = fill;
    } else if (!line) {
      lineColors[key] = DEFAULT_GEOJSON_LINE_COLOR;
    }

    if (!text && fill) {
      textColors[key] = fill;
    } else if (!text && line) {
      textColors[key] = line;
    } else if (!text) {
      textColors[key] = DEFAULT_GEOJSON_TEXT_COLOR;
    }
  });

  patterns.default ??= "full";

  return { fillColors, lineColors, textColors, patterns, patternConfigs };
};

export const getGridCellSize = (zoom?: number): number => {
  if (typeof zoom !== "number" || !Number.isFinite(zoom)) {
    return MAP_CONFIGS.GRID_CELL_SIZE;
  }
  if (zoom >= 18) return 0.0025;
  if (zoom >= 16) return 0.005;
  if (zoom >= 14) return 0.01;
  return 0.02;
};

export const calculateGridCells = (
  bbox: MapBoundingBox,
  zoom?: number,
): MapBoundingBox[] => {
  const [minX, minY, maxX, maxY] = bbox;
  const cellSize = getGridCellSize(zoom);
  const cells: MapBoundingBox[] = [];

  const roundCoord = (val: number, precision = 6) =>
    Number(val.toFixed(precision));

  // Arredonda os limites para o grid fixo evitando artefatos de ponto flutuante
  const startX = roundCoord(
    Math.floor(roundCoord(minX / cellSize)) * cellSize,
  );
  const startY = roundCoord(
    Math.floor(roundCoord(minY / cellSize)) * cellSize,
  );
  const endX = roundCoord(
    Math.ceil(roundCoord(maxX / cellSize)) * cellSize,
  );
  const endY = roundCoord(
    Math.ceil(roundCoord(maxY / cellSize)) * cellSize,
  );

  // Gera as células do grid com precisão fixa
  for (let x = startX; roundCoord(x) < endX; x = roundCoord(x + cellSize)) {
    for (let y = startY; roundCoord(y) < endY; y = roundCoord(y + cellSize)) {
      cells.push([
        roundCoord(x),
        roundCoord(y),
        roundCoord(x + cellSize),
        roundCoord(y + cellSize),
      ]);
      // Limit to max 36 cells to avoid overloading GeoServer / browser
      if (cells.length >= 36) {
        return cells;
      }
    }
  }

  return cells;
};

const resolveColorKey = (
  value: unknown,
  colors: IGetConfigColor[],
): string => {
  if (typeof value !== "number") return String(value ?? "default");

  const numericColors = colors
    .filter((color) => color.value !== "default" && Number.isFinite(Number(color.value)))
    .sort((a, b) => Number(a.value) - Number(b.value));

  if (numericColors.length === 0) return String(value);

  const matchingColor = [...numericColors]
    .reverse()
    .find((color) => value >= Number(color.value));

  return matchingColor?.value ?? "default";
};

const generateGetColorFns = (
  layer: IGetConfigLayerSchema,
  selectedFeatureIds: string[] = [],
) => {
  const { getTextColorPropName, getFillColorPropName, getLineColorPropName, properties } =
    layer;
  const { fillColors, lineColors, textColors, patterns, patternConfigs } =
    buildColorsObj(layer);
  const colors = layer.colors ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTextColor = (d: any): Color => {
    const key = getTextColorPropName ?? getFillColorPropName ?? "default";
    const keyToFind = resolveColorKey(d?.properties?.[key], colors);
    const color = textColors?.[keyToFind] ?? textColors?.["default"];
    if (!color)
      return (
        fillColors?.[keyToFind] ??
        fillColors?.["default"] ??
        MAP_CONFIGS.DEFAULT_LAYER_COLOR
      );

    return color;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLineColor = (d: any): Color => {
    const key = getLineColorPropName ?? getFillColorPropName ?? "default";
    const keyToFind = resolveColorKey(d?.properties?.[key], colors);
    const color = lineColors?.[keyToFind] ?? lineColors?.["default"];
    if (!color)
      return (
        fillColors?.[keyToFind] ??
        fillColors?.["default"] ??
        MAP_CONFIGS.DEFAULT_LAYER_COLOR
      );

    return color;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFillColor = (d: any): Color => {
    const key = getFillColorPropName ?? "default";
    const keyToFind = resolveColorKey(d?.properties?.[key], colors);
    const color =
      fillColors?.[keyToFind] ??
      fillColors?.["default"] ??
      MAP_CONFIGS.DEFAULT_LAYER_COLOR;

    const isSelected =
      MAP_CONFIGS.CHECKER_POLYGON_IS_SELECTED.CHECK_ARRAY_OF_PROPERTIES(
        selectedFeatureIds,
        d,
      );

    if (isSelected) {
      if (properties?.visualState?.selectedColor) {
        return properties.visualState.selectedColor as Color;
      }
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
  props: MapContextLayerSchemaTypeMapProps,
) => {
  const safeProperties = properties || {};
  const { is3DActive = true, layerIndex = 0 } = props;
  const rawElevation = safeProperties.getElevation;
  const BASE_ALTITUDE_OFFSET = 0.02;
  const layerAltitudeOffset = BASE_ALTITUDE_OFFSET + layerIndex * 0.01;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let getElevation: any;

  if (rawElevation !== undefined && rawElevation !== null) {
    if (typeof rawElevation === "string") {
      if (rawElevation.includes("=>") || rawElevation.startsWith("(")) {
        const getElevationFn = createFn(rawElevation, false);
        if (getElevationFn) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getElevation = (feature: any) => {
            if (!is3DActive) return 0;
            try {
              const val = Number(getElevationFn(feature));
              return Number.isFinite(val) && val > 0
                ? val + layerAltitudeOffset
                : layerAltitudeOffset;
            } catch {
              return layerAltitudeOffset;
            }
          };
        } else {
          getElevation = () => (is3DActive ? layerAltitudeOffset : 0);
        }
      } else {
        const numericVal = Number(rawElevation);
        if (Number.isFinite(numericVal) && numericVal > 0) {
          getElevation = () => (is3DActive ? numericVal + layerAltitudeOffset : 0);
        } else if (/^[A-Za-z0-9_]+$/.test(rawElevation.trim())) {
          const propName = rawElevation.trim();
          getElevation = (feature: any) => {
            if (!is3DActive) return 0;
            const val = Number(feature?.properties?.[propName]);
            return Number.isFinite(val) && val > 0
              ? val + layerAltitudeOffset
              : layerAltitudeOffset;
          };
        } else {
          getElevation = () => (is3DActive ? layerAltitudeOffset : 0);
        }
      }
    } else if (typeof rawElevation === "number") {
      const numericVal = rawElevation > 0 ? rawElevation : 0;
      getElevation = () => (is3DActive ? numericVal + layerAltitudeOffset : 0);
    } else if (typeof rawElevation === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getElevation = (feature: any) => {
        if (!is3DActive) return 0;
        try {
          const val = Number(rawElevation(feature));
          return Number.isFinite(val) && val > 0
            ? val + layerAltitudeOffset
            : layerAltitudeOffset;
        } catch {
          return layerAltitudeOffset;
        }
      };
    } else {
      getElevation = () => (is3DActive ? layerAltitudeOffset : 0);
    }
  } else if (safeProperties.extruded) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getElevation = (feature: any) => {
      if (!is3DActive) return 0;
      const h = Number(
        feature?.properties?.height ||
          feature?.properties?.altura ||
          feature?.properties?.alt ||
          15,
      );
      return Number.isFinite(h) && h > 0 ? h + layerAltitudeOffset : 15 + layerAltitudeOffset;
    };
  } else {
    getElevation = () => (is3DActive ? layerAltitudeOffset : 0);
  }

  const isExtruded = is3DActive && Boolean(safeProperties.extruded);

  const defaultParameters = isExtruded
    ? {
        depthTest: true,
        depthMask: true,
      }
    : {
        depthTest: false,
        depthMask: false,
      };

  const parameters = {
    ...defaultParameters,
    ...(safeProperties.parameters || {}),
    ...(safeProperties.depthTest !== undefined
      ? { depthTest: Boolean(safeProperties.depthTest) }
      : {}),
    ...(safeProperties.depthMask !== undefined
      ? { depthMask: Boolean(safeProperties.depthMask) }
      : {}),
  };

  const cleanedProperties = { ...safeProperties };

  // Deck.gl's GeoJsonLayer expects pointType to be a non-empty string and calls pointType.split('+').
  // Fall back to "circle" if pointType is null, undefined, empty, or not a string.
  if (
    !cleanedProperties.pointType ||
    typeof cleanedProperties.pointType !== "string" ||
    !cleanedProperties.pointType.trim()
  ) {
    cleanedProperties.pointType = "circle";
  }

  let opacity = safeProperties.opacity;
  if (typeof opacity === "number") {
    opacity = opacity > 1 ? opacity / (opacity <= 100 ? 100 : 255) : opacity;
    opacity = Math.max(0, Math.min(1, opacity));
    cleanedProperties.opacity = opacity;
  }

  if (safeProperties.lineWidthUnits) {
    cleanedProperties.lineWidthUnits = safeProperties.lineWidthUnits;
  } else {
    cleanedProperties.lineWidthUnits = "pixels";
  }

  if (safeProperties.pointRadiusUnits) {
    cleanedProperties.pointRadiusUnits = safeProperties.pointRadiusUnits;
  } else {
    cleanedProperties.pointRadiusUnits = "pixels";
  }

  if (safeProperties.lineWidthMinPixels !== undefined) {
    cleanedProperties.lineWidthMinPixels = Number(safeProperties.lineWidthMinPixels);
  }

  if (safeProperties.getLineWidth !== undefined && safeProperties.getLineWidth !== null) {
    const lw = Number(safeProperties.getLineWidth);
    if (Number.isFinite(lw)) {
      cleanedProperties.getLineWidth = lw;
    }
  }

  if (safeProperties.filled !== undefined && safeProperties.filled !== null) {
    cleanedProperties.filled = Boolean(safeProperties.filled);
  }

  if (safeProperties.stroked !== undefined && safeProperties.stroked !== null) {
    cleanedProperties.stroked = Boolean(safeProperties.stroked);
  }

  return {
    ...cleanedProperties,
    getElevation,
    extruded: isExtruded,
    wireframe: Boolean(safeProperties.wireframe),
    parameters,
  };
};

const checkZoom = (zoom: number, min?: number, max?: number) => {
  return (min && zoom < min) || (max && zoom >= max);
};

const isValidLngLatPosition = (coordinate: unknown): coordinate is number[] => {
  if (!Array.isArray(coordinate) || coordinate.length < 2) return false;

  const longitude = Number(coordinate[0]);
  const latitude = Number(coordinate[1]);

  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};

const isValidCoordinateTree = (coordinates: unknown): boolean => {
  if (!Array.isArray(coordinates)) return false;
  if (typeof coordinates[0] === "number")
    return isValidLngLatPosition(coordinates);

  return coordinates.every(isValidCoordinateTree);
};

const isValidGeoJsonGeometry = (geometry: any): boolean => {
  if (!geometry) return false;

  if (geometry.type === "GeometryCollection") {
    return (
      Array.isArray(geometry.geometries) &&
      geometry.geometries.length > 0 &&
      geometry.geometries.every(isValidGeoJsonGeometry)
    );
  }

  return isValidCoordinateTree(geometry.coordinates);
};

const sanitizeGeoJsonData = (data: any) => {
  if (!data || typeof data !== "object") return data;

  if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
    const features = data.features.filter((feature: any) =>
      isValidGeoJsonGeometry(feature?.geometry),
    );

    if (features.length !== data.features.length) {
      console.warn(
        `Urbis Map: ${data.features.length - features.length} GeoJSON feature(s) ignored because they have invalid coordinates.`,
      );
    }

    return { ...data, features };
  }

  if (data.type === "Feature") {
    return isValidGeoJsonGeometry(data.geometry) ? data : null;
  }

  return isValidGeoJsonGeometry(data) ? data : null;
};

const createTextLayer = (
  layer: IGetConfigLayerSchema,
  props: MapContextLayerSchemaTypeMapProps,
  getTextColor: (d: any) => Color,
  filteredOrigin?: string,
) => {
  const { zoom, is3DActive, layerIndex = 0 } = props;
  const { properties, id, origin: rawOrigin } = layer;
  const data = filteredOrigin || rawOrigin;

  // Compile elevation function for 3D placement
  const getElevationValue = properties?.getElevation ?? (layer as any).getElevation;
  let getElevationFn: ((d: any) => number) | null = null;
  if (typeof getElevationValue === "function") {
    getElevationFn = (d: any) => Number(getElevationValue(d)) || 0;
  } else if (typeof getElevationValue === "number") {
    getElevationFn = () => Number(getElevationValue) || 0;
  } else if (typeof getElevationValue === "string") {
    if (getElevationValue.includes("=>") || getElevationValue.startsWith("(")) {
      const fn = createFn(getElevationValue, false);
      getElevationFn = fn ? (d: any) => Number(fn(d)) || 0 : null;
    } else if (!Number.isNaN(Number(getElevationValue))) {
      const num = Number(getElevationValue);
      getElevationFn = () => num || 0;
    } else if (/^[A-Za-z0-9_]+$/.test(getElevationValue.trim())) {
      const prop = getElevationValue.trim();
      getElevationFn = (d: any) => Number(d?.properties?.[prop]) || 0;
    }
  }

  // Support both modern structured properties.label/layer.label and legacy properties.getText
  const label = properties?.label || (layer as any).label;
  let propertyName = "";
  let minZoom: any = undefined;
  let maxZoom: any = undefined;
  let textSize = 11;
  let textColor: Color | ((d: any) => Color) = getTextColor;
  let outlineWidth = 0;
  let outlineColor: Color = [255, 255, 255, 255];
  let isExpressionString = false;

  if (label && label.enabled && label.property) {
    const prop = label.property;
    const isLiteralString =
      (prop.startsWith("'") && prop.endsWith("'")) ||
      (prop.startsWith('"') && prop.endsWith('"'));

    if (isLiteralString) {
      propertyName = prop.slice(1, -1);
      isExpressionString = true;
    } else {
      propertyName = prop;
      isExpressionString = prop.startsWith("(") || prop.includes("=>");
    }

    minZoom = label.minZoom ? Number(label.minZoom) : undefined;
    maxZoom = label.maxZoom ? Number(label.maxZoom) : undefined;
    textSize = label.size || 11;
    if (label.color) {
      textColor = hexToRgba(label.color, [17, 24, 39, 255]);
    }
    if (label.haloWidth && Number(label.haloWidth) > 0) {
      outlineWidth = Number(label.haloWidth);
      if (label.haloColor) {
        outlineColor = hexToRgba(label.haloColor, [255, 255, 255, 255]);
      }
    }
  } else {
    const { getText, minZoomText, maxZoomText, getTextSize, haloWidth, haloColor } = properties || {};
    if (getText) {
      propertyName = extractLegacyTextProperty(getText);
      // Check if legacy getText is a full custom function
      isExpressionString = getText.startsWith("(") || getText.includes("=>");
      if (isExpressionString) {
        propertyName = getText;
      }
      minZoom = minZoomText ? Number(minZoomText) : undefined;
      maxZoom = maxZoomText ? Number(maxZoomText) : undefined;
      textSize = getTextSize || 11;
      if (haloWidth !== undefined && Number(haloWidth) > 0) {
        outlineWidth = Number(haloWidth);
      } else {
        outlineWidth = 2;
      }
      if (haloColor) {
        outlineColor = hexToRgba(haloColor, [255, 255, 255, 255]);
      }
    }
  }

  // Ensure zoom parameters are numbers or undefined (never empty strings)
  const numericMinZoom = minZoom && Number.isFinite(Number(minZoom)) ? Number(minZoom) : undefined;
  const numericMaxZoom = maxZoom && Number.isFinite(Number(maxZoom)) ? Number(maxZoom) : undefined;

  if (
    !propertyName ||
    typeof data !== "string" ||
    checkZoom(zoom, numericMinZoom, numericMaxZoom)
  ) {
    return false;
  }

  let getTextFn: (d: any) => string;

  if (isExpressionString) {
    // If it's a literal static string (was compiled without property lookup)
    const isStaticLiteral =
      label &&
      label.enabled &&
      ((label.property.startsWith("'") && label.property.endsWith("'")) ||
        (label.property.startsWith('"') && label.property.endsWith('"')));

    if (isStaticLiteral) {
      getTextFn = () => propertyName;
    } else {
      const compiledFn = createFn(propertyName, false);
      getTextFn = (d: any) => {
        try {
          return compiledFn ? String(compiledFn(d)) : "";
        } catch {
          return "";
        }
      };
    }
  } else {
    getTextFn = (d: any) => {
      try {
        return String(d?.properties?.[propertyName] || "");
      } catch {
        return "";
      }
    };
  }

  return new TextLayer({
    id: `text-layer-${id}`,
    ...(layer as any).textBeforeId ? { beforeId: (layer as any).textBeforeId } : {},
    parameters: {
      depthTest: false,
    },
    data: createGetTextLayerUri(encodeURIComponent(data)),
    getPosition: (d: any) => {
      let baseElevation = 0;
      if (is3DActive && getElevationFn) {
        try {
          const height = getElevationFn(d);
          if (Number.isFinite(Number(height)) && Number(height) > 0) {
            baseElevation = Number(height);
          }
        } catch {
          baseElevation = 0;
        }
      }
      const elevation = baseElevation + (layerIndex * 0.1) + 2;
      try {
        const center = polylabel(d.rawCoordinates, 0.000001);
        return [center[0], center[1], elevation];
      } catch (_err) {
        return [d.coordinates[0], d.coordinates[1], elevation];
      }
    },
    getText: getTextFn,
    getColor: textColor,
    getSize: textSize,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    fontWeight: "normal",
    characterSet: "auto",
    billboard: true,
    outlineWidth,
    outlineColor,
    getPolygonOffset: () => [0, -((layerIndex + 1) * 1000 + 2000)],
    fontSettings: {
      sdf: true,
      fontSize: 64,
      buffer: Math.max(8, Math.ceil((outlineWidth || 2) * 2)),
    },
    transitions: {
      getColor: {
        duration: 300,
        easing: (t: number) => t * (2 - t),
        enter: (value: [number, number, number, number]) =>
          Array.isArray(value) && value.length >= 4
            ? [value[0], value[1], value[2], 0]
            : [0, 0, 0, 0],
      },
    },
    minZoom: numericMinZoom,
    updateTriggers: {
      getText: [propertyName],
      getColor: [textColor],
      getPosition: [is3DActive],
    },
  });
};

const createMVTLayer = (
  layer: IGetConfigLayerSchema,
  props: MapContextLayerSchemaTypeMapProps,
): any => {
  const { selectedFeatureIds = [], is3DActive = true, layerIndex = 0 } = props;
  const { id, origin, clickAction, viewTemplate, properties } = layer;

  const dataUrl =
    typeof origin === "string" && origin.includes("{z}/{x}/{y}")
      ? (origin.includes("20260830_080001_pt")
          ? origin
          : origin.replace(
              /planet\/\{z\}/,
              "planet/20260830_080001_pt/{z}",
            ))
      : "https://tiles.openfreemap.org/planet/20260830_080001_pt/{z}/{x}/{y}.pbf";

  const rawLayer = layer as any;
  const mergedProperties = {
    ...properties,
    ...(rawLayer.filled !== undefined ? { filled: rawLayer.filled } : {}),
    ...(rawLayer.stroked !== undefined ? { stroked: rawLayer.stroked } : {}),
    ...(rawLayer.getLineWidth !== undefined ? { getLineWidth: rawLayer.getLineWidth } : {}),
    ...(rawLayer.autoHighlight !== undefined ? { autoHighlight: rawLayer.autoHighlight } : {}),
    ...(rawLayer.highlightColor !== undefined ? { highlightColor: rawLayer.highlightColor } : {}),
    ...(rawLayer.opacity !== undefined ? { opacity: rawLayer.opacity } : {}),
    ...(rawLayer.pickable !== undefined ? { pickable: rawLayer.pickable } : {}),
    ...(rawLayer.wireframe !== undefined ? { wireframe: rawLayer.wireframe } : {}),
    ...(rawLayer.extruded !== undefined ? { extruded: rawLayer.extruded } : {}),
    ...(rawLayer.getElevation !== undefined ? { getElevation: rawLayer.getElevation } : {}),
    ...(rawLayer.maxZoom !== undefined ? { maxZoom: rawLayer.maxZoom } : {}),
  };

  const preparedProps = prepareLayerProperties(
    {
      ...mergedProperties,
      extruded: mergedProperties.extruded !== false,
      filled: mergedProperties.filled !== false,
    },
    props,
  );

  const { getFillColor, getLineColor } = generateGetColorFns(
    layer,
    selectedFeatureIds,
  );

  const hasHoverColor = Boolean(properties?.visualState?.hoverColor);
  const autoHighlight =
    properties?.autoHighlight !== false && rawLayer?.autoHighlight !== false;
  const highlightColor = hasHoverColor
    ? properties.visualState.hoverColor
    : (properties?.highlightColor ?? rawLayer?.highlightColor ?? [255, 255, 255, 120]);

  const isPickable =
    properties?.pickable !== false &&
    rawLayer?.pickable !== false &&
    (!clickAction || ((clickAction as any) !== "none" && (clickAction.action as string) !== "none"));

  const BASE_ALTITUDE_OFFSET = 0.02;
  const layerAltitudeOffset = BASE_ALTITUDE_OFFSET + layerIndex * 0.01;

  const getElevation = (f: any) => {
    const p = f?.properties || {};
    let h = 14;
    if (p.render_height !== undefined && p.render_height !== null && Number(p.render_height) > 0) {
      const raw = Number(p.render_height);
      h = raw <= 8 ? raw * 3.5 : raw;
    } else if (p.height !== undefined && p.height !== null && Number(p.height) > 0) {
      h = Number(p.height);
    } else if (p.altura !== undefined && p.altura !== null && Number(p.altura) > 0) {
      h = Number(p.altura);
    } else if (p.levels || p["building:levels"]) {
      h = Number(p.levels || p["building:levels"]) * 3.5;
    }
    return (h > 0 ? h : 14) + layerAltitudeOffset;
  };

  const opacity = preparedProps.opacity;
  const effectiveGetFillColor = (d: any) => {
    const c = getFillColor(d);
    if (typeof opacity === "number" && opacity >= 0 && opacity <= 1) {
      return [c[0], c[1], c[2], Math.round(c[3] * opacity)] as Color;
    }
    return c;
  };

  return [
    new MVTLayer({
      ...MAP_CONFIGS.DEFAULT_LAYER_PROPERTIES,
      ...preparedProps,
      id,
      data: dataUrl,
      loaders: [MVTLoader],
      minZoom: layer.minZoom ?? 13,
      maxZoom: 14,
      filled: true,
      stroked: false,
      extruded: true,
      wireframe: Boolean(preparedProps.wireframe),
      pickable: isPickable,
      autoHighlight,
      highlightColor,
      clickAction,
      viewTemplate,
      binary: false,
      loadOptions: {
        mvt: {
          layers: ["building"],
          shape: "geojson",
        },
      },
      getElevation,
      getFillColor: effectiveGetFillColor,
      getLineColor,
      getPolygonOffset: ({ layerIndex: deckLayerIndex }: any = {}) => [
        0,
        -((layerIndex + 1) * 1000 + (deckLayerIndex ?? 0)),
      ],
      parameters: {
        depthTest: true,
        depthMask: true,
      },
      _subLayerProps: {
        'polygons-fill': {
          extruded: true,
          getElevation,
          parameters: {
            depthTest: true,
            depthMask: true,
          },
        },
      },
      updateTriggers: {
        getFillColor: [
          selectedFeatureIds,
          layer.colors,
          layer.getFillColorPropName,
          layer.properties?.visualState?.selectedColor,
          opacity,
        ],
        getLineColor: [
          selectedFeatureIds,
          layer.colors,
          layer.getLineColorPropName,
          layer.properties?.visualState?.selectedColor,
        ],
        getElevation: [is3DActive, properties?.getElevation, layerIndex],
        getPolygonOffset: [layerIndex],
      },
    }),
  ];
};

const createGeoJsonLayer = (
  layer: IGetConfigLayerSchema,
  props: MapContextLayerSchemaTypeMapProps,
): any => {
  if (
    layer.id === "edificacoes_3d" ||
    layer.properties?.source === "openmaptiles" ||
    layer.properties?.sourceType === "vector" ||
    (layer.type as string) === "MVTLayer"
  ) {
    return createMVTLayer(layer, props);
  }

  const { selectedFeatureIds = [], is3DActive, token, organizationId, layerIndex = 0 } = props;

  const {
    id,
    origin: rawData,
    minZoom,
    clickAction,
    viewTemplate,
    properties,
    cqlFilter,
  } = layer;

  let data = properties?.data || rawData;
  if (data === "local" && properties?.data) {
    data = properties.data;
  }

  if (typeof data === "string" && (data.startsWith("http") || data.startsWith("/"))) {
    data = normalizeEnvironmentUrl(data);
  }

  if (
    cqlFilter &&
    typeof data === "string" &&
    (data.includes("http") || data.startsWith("/"))
  ) {
    const separator = data.includes("?") ? "&" : "?";
    data = `${data}${separator}CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
  }

  // Use proxy for external GeoJson/WFS sources to avoid CORS
  if (
    typeof data === "string" &&
    data.includes("geoserver.slui.dev") &&
    layer.id
  ) {
    let queryParams = "";
    try {
      const urlObj = new URL(data);
      queryParams = urlObj.search;
    } catch {
      // fallback
    }
    data = `${environmentUrl}/maps/proxy/layers/${layer.proxyLayerId ?? layer.id}/wfs${queryParams}`;
  } else if (
    typeof data === "string" &&
    data.startsWith("http") &&
    !isCurrentHost(data) &&
    !data.includes("/maps/proxy")
  ) {
    data = `${environmentUrl}/maps/proxy?url=${encodeURIComponent(data)}`;
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
  const sanitizedData =
    typeof data === "string" ? data : sanitizeGeoJsonData(data);
  const textLayer = createTextLayer(layer, props, getTextColor, data);
  const geoJsonDataTransform = (loadedData: any) => {
    if (!loadedData || typeof loadedData !== "object") {
      return { type: "FeatureCollection", features: [] };
    }
    const sanitized = sanitizeGeoJsonData(loadedData);
    if (sanitized?.features && Array.isArray(sanitized.features)) {
      const targetLayerId = layer.proxyLayerId ?? layer.id;
      for (const f of sanitized.features) {
        if (f && f.properties && !f.properties.layer) {
          f.properties.layer = targetLayerId;
        }
      }
    }
    return sanitized;
  };

  const rawLayer = layer as any;
  const hasHoverColor = Boolean(properties?.visualState?.hoverColor);
  const autoHighlight =
    properties?.autoHighlight !== false &&
    rawLayer?.autoHighlight !== false;

  const highlightColor =
    hasHoverColor
      ? properties.visualState.hoverColor
      : (properties?.highlightColor ?? rawLayer?.highlightColor ?? [255, 255, 255, 120]);
  const mergedProperties = {
    ...properties,
    ...(rawLayer.filled !== undefined ? { filled: rawLayer.filled } : {}),
    ...(rawLayer.stroked !== undefined ? { stroked: rawLayer.stroked } : {}),
    ...(rawLayer.getLineWidth !== undefined ? { getLineWidth: rawLayer.getLineWidth } : {}),
    ...(rawLayer.getPointRadius !== undefined ? { getPointRadius: rawLayer.getPointRadius } : {}),
    ...(rawLayer.pointType !== undefined ? { pointType: rawLayer.pointType } : {}),
    ...(rawLayer.autoHighlight !== undefined ? { autoHighlight: rawLayer.autoHighlight } : {}),
    ...(rawLayer.highlightColor !== undefined ? { highlightColor: rawLayer.highlightColor } : {}),
    ...(rawLayer.opacity !== undefined ? { opacity: rawLayer.opacity } : {}),
    ...(rawLayer.pickable !== undefined ? { pickable: rawLayer.pickable } : {}),
    ...(rawLayer.wireframe !== undefined ? { wireframe: rawLayer.wireframe } : {}),
    ...(rawLayer.extruded !== undefined ? { extruded: rawLayer.extruded } : {}),
    ...(rawLayer.getElevation !== undefined ? { getElevation: rawLayer.getElevation } : {}),
    ...(rawLayer.maxZoom !== undefined ? { maxZoom: rawLayer.maxZoom } : {}),
  };

  const preparedProps = prepareLayerProperties(mergedProperties, props);

  const isPickable =
    properties?.pickable !== false &&
    rawLayer?.pickable !== false &&
    (!clickAction || ((clickAction as any) !== "none" && (clickAction.action as string) !== "none"));

  const result: any[] = [
    new GeoJsonLayer({
      ...MAP_CONFIGS.DEFAULT_LAYER_PROPERTIES,
      ...preparedProps,
      ...(rawLayer.beforeId ? { beforeId: rawLayer.beforeId } : {}),
      pointType:
        typeof preparedProps.pointType === "string" && preparedProps.pointType.trim()
          ? preparedProps.pointType
          : "circle",
      id,
      data: sanitizedData,
      dataTransform: geoJsonDataTransform,
      getPolygonOffset: ({ layerIndex: deckLayerIndex }: any = {}) => [
        0,
        -((layerIndex + 1) * 1000 + (deckLayerIndex ?? 0)),
      ],
      onError: (error: any) => {
        console.warn(`[deck.gl Layer ${id} Error]`, error?.message || error);
      },
      loadOptions:
        token || organizationId
          ? {
              fetch: {
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  ...(organizationId
                    ? { "x-organization-id": organizationId }
                    : {}),
                },
              },
            }
          : undefined,
      minZoom,
      getLineColor: getLineColor,
      getFillColor: getFillColor,
      clickAction,
      viewTemplate,
      pickable: isPickable,
      autoHighlight: autoHighlight,
      highlightColor: highlightColor,
      _subLayerProps: {
        'polygons-fill': {
          parameters: preparedProps.parameters,
        },
        'polygons-stroke': {
          parameters: {
            depthTest: false,
            depthMask: false,
          },
        },
        linestrings: {
          parameters: {
            depthTest: false,
            depthMask: false,
          },
        },
      },
      updateTriggers: {
        getFillColor: [
          selectedFeatureIds,
          layer.colors,
          layer.getFillColorPropName,
          layer.properties?.visualState?.selectedColor,
        ],
        getLineColor: [
          selectedFeatureIds,
          layer.colors,
          layer.getLineColorPropName,
          layer.properties?.visualState?.selectedColor,
        ],
        getFillPattern: [layer.colors],
        getElevation: [is3DActive, properties?.getElevation, layerIndex],
        getPolygonOffset: [layerIndex],
      },
      ...patternObj,
      extruded: preparedProps.extruded,
      getElevation: preparedProps.getElevation,
    }),
  ];

  if (textLayer) result.push(textLayer);

  return result;
};

const createBitmapLayer = (
  layer: IGetConfigLayerSchema,
  props: MapContextLayerSchemaTypeMapProps,
) => {
  const { id, properties = {}, colors = [], isVisible } = layer;
  const { layerIndex = 0 } = props;

  if (isVisible === false) return [];

  const image =
    properties.image ||
    layer.origin ||
    properties.data ||
    properties.url ||
    properties.src;

  if (!image) {
    return [];
  }

  // Handle bounds: can be 4 points [bl, tl, tr, br] or [tl, tr, br, bl] or [minX, minY, maxX, maxY]
  const bounds = properties.bounds ?? properties.coordinates;

  if (!bounds) {
    return [];
  }

  // Deck.gl BitmapLayer bounds format:
  // Can be either [minX, minY, maxX, maxY] or [[bottom-left], [top-left], [top-right], [bottom-right]]
  let normalizedBounds = bounds;
  if (Array.isArray(bounds) && bounds.length === 4) {
    if (Array.isArray(bounds[0])) {
      // If format is 'mapbox' / 'image-control' [top-left, top-right, bottom-right, bottom-left]:
      // convert to Deck.gl [bottom-left, top-left, top-right, bottom-right]
      if (
        properties.boundsFormat === "mapbox" ||
        properties.boundsFormat === "image-control"
      ) {
        normalizedBounds = [bounds[3], bounds[0], bounds[1], bounds[2]];
      } else {
        normalizedBounds = bounds;
      }
    }
  }

  // Opacity
  let opacity = 1;
  if (properties.opacity !== undefined && properties.opacity !== null) {
    const numOpacity = Number(properties.opacity);
    if (Number.isFinite(numOpacity)) {
      opacity =
        numOpacity > 1
          ? numOpacity / (numOpacity <= 100 ? 100 : 255)
          : numOpacity;
      opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  // Tint Color & Opacity from colors array if defined
  let tintColor: [number, number, number] = [255, 255, 255];
  if (Array.isArray(colors) && colors.length > 0) {
    const fillColor =
      colors.find((c) => c.type === "fill" || !c.type) || colors[0];
    if (fillColor && Array.isArray(fillColor.color)) {
      const [r, g, b, a] = fillColor.color;
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        tintColor = [r, g, b];
      }
      if (a !== undefined && a !== null && properties.opacity === undefined) {
        const numA = Number(a);
        if (Number.isFinite(numA)) {
          opacity = numA > 1 ? numA / (numA <= 100 ? 100 : 255) : numA;
          opacity = Math.max(0, Math.min(1, opacity));
        }
      }
    }
  } else if (properties.tintColor && Array.isArray(properties.tintColor)) {
    tintColor = [
      properties.tintColor[0],
      properties.tintColor[1],
      properties.tintColor[2],
    ];
  }

  const bitmapLayer = new BitmapLayer({
    id: id || layer.id,
    image,
    bounds: normalizedBounds,
    opacity,
    tintColor,
    desaturate: Number(properties.desaturate ?? 0),
    transparentColor: properties.transparentColor ?? [0, 0, 0, 0],
    parameters: {
      depthTest: false,
      depthMask: false,
    },
    getPolygonOffset: ({ layerIndex: idx }) => {
      const effectiveIndex = typeof idx === "number" ? idx : layerIndex;
      return [0, -effectiveIndex * 100];
    },
    pickable: Boolean(properties.pickable),
    updateTriggers: {
      opacity,
      tintColor,
      bounds: normalizedBounds,
    },
  });

  return [bitmapLayer];
};

export const BUILD_OBJECT_BASED_ON_TYPE: MapContextLayerSchemaTypeMap = {
  Stream: (layer, props) => {
    const { boundingBox: bbox, selectedFeatureIds, token, zoom } = props;
    const { origin } = layer;

    // Improved detection for geographic SRS using decodeURIComponent
    const rawSrsName = origin.match(/srsName=([^&]+)/i)?.[1] || "";
    const srsName = decodeURIComponent(rawSrsName).toUpperCase();

    // Check if the service version is 1.1.0, 1.3.0 or 2.0.0
    const versionMatch = origin.match(/version=([^&]+)/i)?.[1] || "";
    const isWfs11OrHigher =
      versionMatch.startsWith("1.1") ||
      versionMatch.startsWith("1.3") ||
      versionMatch.startsWith("2.");

    // Standard geographic SRS
    const isGeographic =
      srsName === "EPSG:4326" ||
      srsName === "CRS:84" ||
      srsName === "CRS84" ||
      srsName === "EPSG:4674";

    const gridCells = calculateGridCells(bbox, zoom);
    const layers = gridCells.map((cellBbox) => {
      const cellId =
        `cell-${layer.id}-${cellBbox[0]}-${cellBbox[1]}-${cellBbox[2]}-${cellBbox[3]}`.replace(
          /\./g,
          "_",
        );

      let formattedBounds: string;

      if (isGeographic) {
        // AXIS ORDER LOGIC FOR GEOGRAPHIC COORDINATES (LAT/LON)
        // Standard (longitude first): [minLon, minLat, maxLon, maxLat]
        // Swapped (latitude first): [minLat, minLon, maxLat, maxLon]

        let shouldSwap = false;

        if (isWfs11OrHigher) {
          // In WFS 1.1.0+ and 2.0.0, EPSG:4326 and EPSG:4674 are officially [latitude, longitude].
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
      const bboxParam = isGeographic
        ? `${formattedBounds},${effectiveSrs}`
        : formattedBounds;

      // Ensure we don't have conflicting SRS params
      let cleanOrigin = origin;
      if (isGeographic && origin.includes("srsName=")) {
        cleanOrigin = origin.replace(
          /srsName=[^&]+/i,
          `srsName=${effectiveSrs}`,
        );
      }

      const originWithBBox = `${cleanOrigin}&bbox=${bboxParam}`;

      return createGeoJsonLayer(
        {
          ...layer,
          id: cellId,
          proxyLayerId: layer.id,
          origin: originWithBBox,
        },
        { selectedFeatureIds, token, ...props },
      );
    });

    return layers.flat();
  },
  GeoJsonLayer: (layer, props) => createGeoJsonLayer(layer, props),
  BitmapLayer: (layer, props) => createBitmapLayer(layer, props),
  CustomWMSLayer: (layer, props) => {
    const { origin, properties, cqlFilter } = layer;
    const { token, organizationId } = props;

    // Support both nested properties.wms.layers and top-level typeName or layer.id
    const layerNames = properties?.wms?.layers
      ? [properties.wms.layers]
      : properties?.typeName
        ? [properties.typeName]
        : [layer.id];

    // For external WMS (like Funai), we should use our proxy for GetMap requests
    // to avoid CORS issues.
    let finalOrigin = normalizeEnvironmentUrl(origin);

    // Check if nested wms url exists and is external
    if (
      properties?.wms?.url &&
      properties.wms.url.startsWith("http") &&
      !isCurrentHost(properties.wms.url)
    ) {
      finalOrigin = normalizeEnvironmentUrl(properties.wms.url);
    }

    if (
      typeof finalOrigin === "string" &&
      finalOrigin.includes("geoserver.slui.dev") &&
      layer.id
    ) {
      let queryParams = "";
      try {
        const urlObj = new URL(finalOrigin);
        queryParams = urlObj.search;
      } catch {
        // fallback
      }
      finalOrigin = `${environmentUrl}/maps/proxy/layers/${layer.proxyLayerId ?? layer.id}/wms${queryParams}`;
    } else if (
      typeof finalOrigin === "string" &&
      finalOrigin.startsWith("http") &&
      !isCurrentHost(finalOrigin) &&
      !finalOrigin.includes("/maps/proxy")
    ) {
      // If it's an absolute URL and not pointing to our own domain
      // and not already proxied, we wrap it in our proxy.
      finalOrigin = `${environmentUrl}/maps/proxy?url=${encodeURIComponent(finalOrigin)}`;
    }

    return [
      new CustomWMSLayer({
        id: layer.id,
        data: finalOrigin,
        serviceType: "wms",
        layers: layerNames,
        loadOptions:
          token || organizationId
            ? {
                fetch: {
                  headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...(organizationId
                      ? { "x-organization-id": organizationId }
                      : {}),
                  },
                },
              }
            : undefined,
        version:
          properties?.wms?.version === "2.0.0"
            ? "1.3.0"
            : properties?.wms?.version || "1.3.0",
        srs: properties?.wms?.srs ?? properties?.srs ?? "EPSG:3857",
        cqlFilter: cqlFilter,
        sldBody: properties?.sldBody,
        styles: properties?.wms?.styles ?? properties?.styles,
      }),
    ];
  },
};

export const transformSchemaLayers = (
  layersConfig: IGetConfigLayerSchema[],
  props: MapContextLayerSchemaTypeMapProps,
) => {
  const { zoom } = props;

  const selectedFeatureIds =
    MAP_CONFIGS.CHECKER_POLYGON_IS_SELECTED.BUILD_ARRAY_OF_PROPERTIES(props);

  const visibleLayers = layersConfig.filter((layer) => {
    const { isVisible, minZoom, properties = {}, type } = layer;
    const { maxZoom } = properties;

    // Enforce minimum zoom of 12 for Stream layers
    const effectiveMinZoom =
      type === "Stream" ? Math.max(minZoom || 0, 12) : minZoom;

    if (checkZoom(zoom, effectiveMinZoom, maxZoom)) return false;

    return isVisible;
  });

  const flatLayers = visibleLayers
    .map((layer, index) => {
      if (BUILD_OBJECT_BASED_ON_TYPE?.[layer.type])
        return BUILD_OBJECT_BASED_ON_TYPE[layer.type]!(layer, {
          ...props,
          selectedFeatureIds,
          layerIndex: index,
          totalLayers: visibleLayers.length,
        });

      return null;
    })
    .flat()
    .filter(Boolean);

  const geometryLayers: any[] = [];
  const textLayers: any[] = [];

  for (const l of flatLayers) {
    if (l instanceof TextLayer || (l as any)?.id?.startsWith("text-layer-")) {
      textLayers.push(l);
    } else {
      geometryLayers.push(l);
    }
  }

  return [...geometryLayers, ...textLayers];
};
