import type { MapProps } from "react-map-gl/maplibre";
import type { StyleSpecification as MapLibreStyleSpecification } from "maplibre-gl";

type MapStyle = NonNullable<MapProps["mapStyle"]>;

export type BaseMapStyleId =
  | "openfreemap-liberty"
  | "openfreemap-positron"
  | "openfreemap-bright"
  | "standard"
  | "light"
  | "dark"
  | "outdoors"
  | "satellite"
  | "satellite-streets"
  | "maxar-satellite";

const createRasterStyle = (
  sources: MapLibreStyleSpecification["sources"],
  layers: MapLibreStyleSpecification["layers"],
): MapStyle =>
  ({
    version: 8,
    sources,
    layers,
  }) as MapStyle;

const createSingleSourceRasterStyle = (
  id: string,
  tiles: string[],
  attribution: string,
  tileSize = 256,
  maxzoom = 19,
): MapStyle =>
  createRasterStyle(
    {
      [id]: {
        type: "raster",
        tiles,
        tileSize,
        attribution,
        maxzoom,
      },
    },
    [
      {
        id,
        type: "raster",
        source: id,
      },
    ],
  );

const _osmStyle = createSingleSourceRasterStyle(
  "openstreetmap",
  [
    "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
  ],
  "&copy; OpenStreetMap contributors",
  256,
  19,
);

const lightStyle = createRasterStyle(
  {
    "light-base": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        "Sources: Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community",
    },
    "light-labels": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        "Sources: Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community",
    },
  },
  [
    {
      id: "light-base",
      type: "raster",
      source: "light-base",
    },
    {
      id: "light-labels",
      type: "raster",
      source: "light-labels",
    },
  ],
);

const darkStyle = createRasterStyle(
  {
    "dark-base": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        "Sources: Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community",
    },
    "dark-labels": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        "Sources: Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community",
    },
  },
  [
    {
      id: "dark-base",
      type: "raster",
      source: "dark-base",
    },
    {
      id: "dark-labels",
      type: "raster",
      source: "dark-labels",
    },
  ],
);

const outdoorsStyle = createSingleSourceRasterStyle(
  "esri-topo",
  [
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  ],
  "Tiles &copy; Esri, USGS, NOAA | OpenStreetMap contributors",
  256,
  19,
);

const satelliteStyle = createSingleSourceRasterStyle(
  "esri-satellite",
  [
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  ],
  "Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  256,
  19,
);

const satelliteStreetsStyle = createRasterStyle(
  {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        "Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
    roads: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Source: Esri, DeLorme, NAVTEQ",
    },
    labels: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Source: Esri, DeLorme, NAVTEQ, &copy; OpenStreetMap contributors",
    },
  },
  [
    {
      id: "satellite",
      type: "raster",
      source: "satellite",
    },
    {
      id: "roads",
      type: "raster",
      source: "roads",
    },
    {
      id: "labels",
      type: "raster",
      source: "labels",
    },
  ],
);

const createMaxarStyle = (apiBaseUrl: string): MapStyle =>
  createRasterStyle(
    {
      "maxar-wms": {
        type: "raster",
        tiles: [
          `${apiBaseUrl}/maps/geoserver-proxy/maxar?service=WMS&request=GetMap&layers=Maxar:Imagery&styles=&format=image/jpeg&transparent=false&version=1.3.0&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}`,
        ],
        tileSize: 256,
      },
    },
    [
      {
        id: "maxar-wms",
        type: "raster",
        source: "maxar-wms",
      },
    ],
  );

const resolveStandardStyle = (theme: string): MapStyle =>
  theme === "dark" ? darkStyle : lightStyle;

export const OPENFREEMAP_STYLES = {
  liberty: "/styles/liberty.json",
  positron: "/styles/positron.json",
  bright: "/styles/bright.json",
} as const;

export const OPENFREEMAP_VECTOR_SOURCE = {
  type: "vector" as const,
  tiles: ["https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf"],
  maxzoom: 14,
  attribution:
    '&copy; <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
};

export const OPEN_BUILDINGS_3D_LAYER = {
  id: "openfreemap-3d-buildings",
  type: "fill-extrusion" as const,
  source: "openmaptiles",
  "source-layer": "building",
  minzoom: 13,
  paint: {
    "fill-extrusion-color": [
      "interpolate",
      ["linear"],
      ["coalesce", ["get", "render_height"], ["get", "height"], 10],
      0,
      "#64748b",
      30,
      "#475569",
      80,
      "#334155",
      150,
      "#1e293b",
    ],
    "fill-extrusion-height": [
      "interpolate",
      ["linear"],
      ["zoom"],
      13,
      0,
      13.5,
      ["coalesce", ["get", "render_height"], ["get", "height"], 10],
    ],
    "fill-extrusion-base": [
      "interpolate",
      ["linear"],
      ["zoom"],
      13,
      0,
      13.5,
      ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
    ],
    "fill-extrusion-opacity": 0.45,
    "fill-extrusion-vertical-gradient": false,
  },
};

export const OPEN_TERRARIUM_DEM_SOURCE: any = {
  type: "raster-dem",
  tiles: [
    "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
  ],
  encoding: "terrarium",
  tileSize: 256,
  maxzoom: 15,
};

export const getSingleMapStyle = (
  style: BaseMapStyleId | null | undefined,
  theme: string,
  apiBaseUrl = "/api",
): MapStyle => {
  if (style === "openfreemap-liberty") {
    return OPENFREEMAP_STYLES.liberty;
  }
  if (style === "openfreemap-positron") {
    return OPENFREEMAP_STYLES.positron;
  }
  if (style === "openfreemap-bright") {
    return OPENFREEMAP_STYLES.bright;
  }
  if (style === "standard") {
    return _osmStyle;
  }

  if (!style) {
    const currentTheme =
      theme === "system"
        ? typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    return resolveStandardStyle(currentTheme);
  }

  switch (style) {
    case "light":
      return lightStyle;
    case "dark":
      return darkStyle;
    case "outdoors":
      return outdoorsStyle;
    case "satellite":
      return satelliteStyle;
    case "satellite-streets":
      return satelliteStreetsStyle;
    case "maxar-satellite":
      return createMaxarStyle(apiBaseUrl);
    default:
      return lightStyle;
  }
};

export const getMapStyle = (
  style: BaseMapStyleId | BaseMapStyleId[] | null | undefined,
  theme: string,
  apiBaseUrl = "/api",
  opacity = 100,
  saturation = 100,
  selectedBaseMaps?: BaseMapStyleId[],
  opacities?: Record<string, number>,
  _include3DTerrain = false,
): MapStyle => {
  const stylesToCombine: BaseMapStyleId[] = [];

  if (selectedBaseMaps && selectedBaseMaps.length > 0) {
    stylesToCombine.push(...selectedBaseMaps);
  } else if (Array.isArray(style)) {
    stylesToCombine.push(...style);
  } else if (style) {
    stylesToCombine.push(style);
  } else {
    stylesToCombine.push("standard");
  }

  // When a single vector style (OpenFreeMap) is active with default 100% opacity, return URL directly
  if (
    stylesToCombine.length === 1 &&
    (stylesToCombine[0] === "openfreemap-liberty" ||
      stylesToCombine[0] === "openfreemap-positron" ||
      stylesToCombine[0] === "openfreemap-bright") &&
    opacity === 100 &&
    saturation === 100 &&
    (!opacities || opacities[stylesToCombine[0]] === undefined || opacities[stylesToCombine[0]] === 100)
  ) {
    return getSingleMapStyle(stylesToCombine[0], theme, apiBaseUrl);
  }

  const combinedSources: MapLibreStyleSpecification["sources"] = {};
  const combinedLayers: MapLibreStyleSpecification["layers"] = [];
  const normSaturation = Math.max(-1, Math.min(1, saturation / 100 - 1));

  stylesToCombine.forEach((styleId, index) => {
    const singleStyle = getSingleMapStyle(
      styleId,
      theme,
      apiBaseUrl,
    ) as MapLibreStyleSpecification;

    if (typeof singleStyle === "string") {
      const prefix = `bm_${index}_`;
      combinedSources[`${prefix}openmaptiles`] = {
        type: "vector",
        tiles: ["https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf"],
        maxzoom: 14,
      };
      return;
    }

    const prefix = `bm_${index}_`;
    const styleOpacity = opacities?.[styleId] ?? opacity;
    const normOpacity = Math.max(0, Math.min(1, styleOpacity / 100));

    if (singleStyle.sources) {
      Object.entries(singleStyle.sources).forEach(([srcKey, srcVal]) => {
        const newSrcKey = `${prefix}${srcKey}`;
        combinedSources[newSrcKey] = srcVal;
      });
    }

    if (singleStyle.layers) {
      singleStyle.layers.forEach((layer) => {
        const newLayer = { ...layer, id: `${prefix}${layer.id}` };
        if ("source" in newLayer && typeof newLayer.source === "string") {
          newLayer.source = `${prefix}${newLayer.source}`;
        }
        if (newLayer.type === "raster") {
          newLayer.paint = {
            ...newLayer.paint,
            "raster-opacity": normOpacity,
            "raster-saturation": normSaturation,
          };
        } else if (newLayer.type === "background") {
          newLayer.paint = {
            ...newLayer.paint,
            "background-opacity": normOpacity,
          };
        }
        combinedLayers.push(newLayer);
      });
    }
  });

  return {
    version: 8,
    sources: combinedSources,
    layers: combinedLayers,
  } as MapStyle;
};
