import type { StyleSpecification } from "maplibre-gl";

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
  | "maxar-satellite"
  | "geosampa-ortofoto-2020"
  | "geosampa-sara-brasil-1930"
  | "geosampa-ortofoto-2017"
  | "geosampa-hillshade-mdc-2004"
  | "geosampa-vasp-cruzeiro-1954";

export interface BaseMapConfig {
  id: BaseMapStyleId;
  grupo: "Bases oficiais" | "Bases não oficiais";
  ordemExibicao: number;
  tipo: "ortofoto" | "satélite" | "mapa";
  nome: string;
  descricao: string;
  urlMiniatura: string;
  urlMetadados?: string;
  urlGeoserver?: string;
  camada?: string;
}

export const GEOSAMPA_WMS_URL =
  "https://rastergeosampa-acevaagfa5hkfaar.a02.azurefd.net/geoserver/geoportal/wms";

export const BASE_MAPS_CONFIG: BaseMapConfig[] = [
  // --- BASES OFICIAIS ---
  {
    id: "geosampa-ortofoto-2020",
    grupo: "Bases oficiais",
    ordemExibicao: 1,
    tipo: "ortofoto",
    nome: "Ortofoto 2020",
    descricao: "Fotos aéreas de alta resolução da cidade de São Paulo em 2020 (Fonte: GeoSampa).",
    urlMiniatura: "/ortofoto_2020.jpg",
    urlGeoserver: GEOSAMPA_WMS_URL,
    camada: "ORTO_RGB_2020",
    urlMetadados: "http://catalogo.geoportal.prodam/geonetwork/srv/por/catalog.search#/metadata/7bfa6328-3e47-49ec-adfa-43dbfa8540c1"
  },
  {
    id: "geosampa-ortofoto-2017",
    grupo: "Bases oficiais",
    ordemExibicao: 2,
    tipo: "ortofoto",
    nome: "Ortofoto 2017",
    descricao: "Fotos aéreas de alta resolução da cidade de São Paulo em 2017 (Fonte: GeoSampa).",
    urlMiniatura: "/ortofoto_2017.jpg",
    urlGeoserver: GEOSAMPA_WMS_URL,
    camada: "Orto_PMD_RGB_2017",
    urlMetadados: "http://catalogo.geoportal.prodam/geonetwork/srv/por/catalog.search#/metadata/c69e26ff-4ebf-4f8a-986c-486717f9b889"
  },
  {
    id: "geosampa-hillshade-mdc-2004",
    grupo: "Bases oficiais",
    ordemExibicao: 3,
    tipo: "ortofoto",
    nome: "Ortofoto 2004",
    descricao: "Fotos aéreas históricas da cidade de São Paulo em 2004 (Fonte: GeoSampa).",
    urlMiniatura: "/ortofoto_2004.jpg",
    urlGeoserver: GEOSAMPA_WMS_URL,
    camada: "Orto_MDC",
    urlMetadados: "http://catalogo.geoportal.prodam/geonetwork/srv/por/catalog.search#/metadata/b4f9104a-8f5f-4d33-bd8c-5fa5851d9e2b"
  },
  {
    id: "geosampa-vasp-cruzeiro-1954",
    grupo: "Bases oficiais",
    ordemExibicao: 4,
    tipo: "ortofoto",
    nome: "VASP Cruzeiro 1954",
    descricao: "Mapeamento aerofotogramétrico histórico de São Paulo de 1954 (Fonte: GeoSampa).",
    urlMiniatura: "/vasp_cruzeiro_1954.jpg",
    urlGeoserver: GEOSAMPA_WMS_URL,
    camada: "Vasp_Cruzeiro",
    urlMetadados: "http://catalogo.geoportal.prodam/geonetwork/srv/por/catalog.search#/metadata/208d325d-23f1-44bb-9eba-0af992408549"
  },
  {
    id: "geosampa-sara-brasil-1930",
    grupo: "Bases oficiais",
    ordemExibicao: 5,
    tipo: "mapa",
    nome: "Sara Brasil 1930",
    descricao: "Mapa cadastral histórico da cidade de São Paulo de 1930 (Fonte: GeoSampa).",
    urlMiniatura: "/sara_brasil_1930.jpg",
    urlGeoserver: GEOSAMPA_WMS_URL,
    camada: "SaraBrasil_1930",
    urlMetadados: "http://catalogo.geoportal.prodam/geonetwork/srv/por/catalog.search#/metadata/d559e211-f925-4b77-80fa-400c4068f8bf"
  },

  // --- BASES NÃO OFICIAIS ---
  {
    id: "openfreemap-liberty",
    grupo: "Bases não oficiais",
    ordemExibicao: 1,
    tipo: "mapa",
    nome: "Mapa Urbano 3D",
    descricao: "Visualização com edificações e arruamento detalhado (Fonte: OpenFreeMap / OSM).",
    urlMiniatura: "/openfreemap_3d.jpg"
  },
  {
    id: "openfreemap-positron",
    grupo: "Bases não oficiais",
    ordemExibicao: 2,
    tipo: "mapa",
    nome: "Claro Minimalista",
    descricao: "Mapa limpo em tons claros, ideal para destacar informações sobrepostas (Fonte: OpenFreeMap).",
    urlMiniatura: "/positron.jpg"
  },
  {
    id: "openfreemap-bright",
    grupo: "Bases não oficiais",
    ordemExibicao: 3,
    tipo: "mapa",
    nome: "Colorido Urbano",
    descricao: "Mapa colorido com destaque para ruas, parques e bairros (Fonte: OpenFreeMap).",
    urlMiniatura: "/bright.jpg"
  },
  {
    id: "standard",
    grupo: "Bases não oficiais",
    ordemExibicao: 4,
    tipo: "mapa",
    nome: "OpenStreetMap",
    descricao: "Cartografia colaborativa com arruamento e pontos de interesse (Fonte: OpenStreetMap).",
    urlMiniatura: "/padrao.jpg"
  },
  {
    id: "outdoors",
    grupo: "Bases não oficiais",
    ordemExibicao: 5,
    tipo: "mapa",
    nome: "Topográfico",
    descricao: "Mapa com curvas de nível, sombreamento de montanhas e relevo (Fonte: Esri).",
    urlMiniatura: "/topografico.jpg"
  },
  {
    id: "satellite",
    grupo: "Bases não oficiais",
    ordemExibicao: 6,
    tipo: "satélite",
    nome: "Satélite",
    descricao: "Fotos de satélite de alta resolução (Fonte: Esri / Maxar).",
    urlMiniatura: "/satelite.jpg"
  },
  {
    id: "satellite-streets",
    grupo: "Bases não oficiais",
    ordemExibicao: 7,
    tipo: "satélite",
    nome: "Satélite com Ruas",
    descricao: "Fotos de satélite combinadas com nomes de ruas e avenidas (Fonte: Esri).",
    urlMiniatura: "/hibrido.jpg"
  }
];

const createRasterStyle = (
  sources: StyleSpecification["sources"],
  layers: StyleSpecification["layers"],
): StyleSpecification => ({
  version: 8,
  sources,
  layers,
});

const createSingleSourceRasterStyle = (
  id: string,
  tiles: string[],
  attribution: string,
  tileSize = 256,
  maxzoom = 19,
): StyleSpecification =>
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

const osmStyle = createSingleSourceRasterStyle(
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

const createMaxarStyle = (apiBaseUrl: string): StyleSpecification =>
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

const createDynamicWmsStyle = (
  id: string,
  urlGeoserver: string,
  layerName: string,
  attribution: string,
  transparent = true,
): StyleSpecification => {
  let cleanUrl = urlGeoserver;
  if (cleanUrl.endsWith("/web")) {
    cleanUrl = cleanUrl.replace(/\/web$/, "/wms");
  } else if (!cleanUrl.toLowerCase().endsWith("/wms") && !cleanUrl.includes("service=WMS") && !cleanUrl.includes("wms?")) {
    if (cleanUrl.includes("/geoserver/web")) {
      cleanUrl = cleanUrl.replace("/geoserver/web", "/geoserver/wms");
    }
  }

  return createRasterStyle(
    {
      [id]: {
        type: "raster",
        tiles: [
          `${cleanUrl}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=${transparent}&LAYERS=${layerName}&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
        ],
        tileSize: 256,
        maxzoom: 21,
        attribution,
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
};

type GeosampaWmsStyleConfig = {
  id: Exclude<
    BaseMapStyleId,
    | "openfreemap-liberty"
    | "openfreemap-positron"
    | "openfreemap-bright"
    | "standard"
    | "light"
    | "dark"
    | "outdoors"
    | "satellite"
    | "satellite-streets"
    | "maxar-satellite"
    | "geosampa-vasp-cruzeiro-1954"
  >;
  layerName: string;
  attribution: string;
  backgroundColor?: string;
  transparent?: boolean;
};

const createGeosampaWmsStyle = ({
  id,
  layerName,
  attribution,
  transparent = true,
}: GeosampaWmsStyleConfig): StyleSpecification =>
  createRasterStyle(
    {
      [id]: {
        type: "raster",
        tiles: [
          `${GEOSAMPA_WMS_URL}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=${transparent}&LAYERS=${layerName}&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
        ],
        tileSize: 256,
        maxzoom: 21,
        attribution,
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

const GEOSAMPA_WMS_STYLES: Record<
  GeosampaWmsStyleConfig["id"],
  Omit<GeosampaWmsStyleConfig, "id">
> = {
  "geosampa-ortofoto-2020": {
    layerName: "ORTO_RGB_2020",
    attribution: "Ortofoto 2020: GeoSampa / © <a href=\"https://prefeitura.sp.gov.br/\" target=\"_blank\" rel=\"noopener\">Município de São Paulo</a> <span style=\"display:inline-block;transform:scaleX(-1);\">&copy;</span> <a href=\"https://urbis.prefeitura.sp.gov.br/license/cc-by-sa-4.0.html\" target=\"_blank\" rel=\"noopener\">CC BY-SA 4.0</a>",
  },
  "geosampa-sara-brasil-1930": {
    layerName: "SaraBrasil_1930",
    attribution: "Sara Brasil 1930: GeoSampa / Prefeitura de São Paulo",
  },
  "geosampa-ortofoto-2017": {
    layerName: "Orto_PMD_RGB_2017",
    attribution: "Ortofoto 2017: GeoSampa / © <a href=\"https://prefeitura.sp.gov.br/\" target=\"_blank\" rel=\"noopener\">Município de São Paulo</a> <span style=\"display:inline-block;transform:scaleX(-1);\">&copy;</span> <a href=\"https://urbis.prefeitura.sp.gov.br/license/cc-by-sa-4.0.html\" target=\"_blank\" rel=\"noopener\">CC BY-SA 4.0</a>",
  },
  "geosampa-hillshade-mdc-2004": {
    layerName: "Orto_MDC",
    attribution: "Ortofoto 2004: GeoSampa / © <a href=\"https://prefeitura.sp.gov.br/\" target=\"_blank\" rel=\"noopener\">Município de São Paulo</a> <span style=\"display:inline-block;transform:scaleX(-1);\">&copy;</span> <a href=\"https://urbis.prefeitura.sp.gov.br/license/cc-by-sa-4.0.html\" target=\"_blank\" rel=\"noopener\">CC BY-SA 4.0</a>",
  },
};

const resolveStandardStyle = (theme: string): StyleSpecification =>
  theme === "dark" ? darkStyle : lightStyle;

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, "")
    .replace(/&copy;/g, "©")
    .trim();

const getStyleAttributions = (style: StyleSpecification): string[] => {
  const sources = Object.values(style.sources ?? {});
  return Array.from(
    new Set(
      sources
        .map((source) =>
          "attribution" in source && typeof source.attribution === "string"
            ? stripHtml(source.attribution)
            : "",
        )
        .filter(Boolean),
    ),
  );
};

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
    '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
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

export const OPEN_TERRARIUM_DEM_SOURCE = {
  type: "raster-dem" as const,
  tiles: [
    "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
  ],
  encoding: "terrarium" as const,
  tileSize: 256,
  maxzoom: 15,
};

export const getBaseMapAttributions = (
  style: BaseMapStyleId | null | undefined,
  theme: string,
  apiBaseUrl = "/api",
  selectedBaseMaps?: BaseMapStyleId[],
): string[] => {
  const mapStyle = getMapStyle(style, theme, apiBaseUrl, 100, 100, selectedBaseMaps);
  if (typeof mapStyle === "string") {
    return ["© OpenFreeMap", "© OpenStreetMap contributors"];
  }
  return getStyleAttributions(mapStyle);
};

export const getSingleMapStyle = (
  style: BaseMapStyleId | null | undefined,
  theme: string,
  apiBaseUrl = "/api",
): StyleSpecification | string => {
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
    return osmStyle;
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
    case "geosampa-ortofoto-2020":
    case "geosampa-sara-brasil-1930":
    case "geosampa-ortofoto-2017":
    case "geosampa-hillshade-mdc-2004":
      return createGeosampaWmsStyle({
        id: style,
        ...GEOSAMPA_WMS_STYLES[style],
      });
    case "geosampa-vasp-cruzeiro-1954": {
      const vaspConfig = BASE_MAPS_CONFIG.find(c => c.id === "geosampa-vasp-cruzeiro-1954")!;
      return createDynamicWmsStyle(
        vaspConfig.id,
        vaspConfig.urlGeoserver!,
        vaspConfig.camada!,
        "VASP Cruzeiro 1954: GeoSampa / Prefeitura de São Paulo"
      );
    }
    default: {
      const found = BASE_MAPS_CONFIG.find(c => c.id === style);
      if (found && found.urlGeoserver && found.camada) {
        return createDynamicWmsStyle(
          found.id,
          found.urlGeoserver,
          found.camada,
          found.tipo === "ortofoto"
            ? `${found.nome}: GeoSampa / © <a href="https://prefeitura.sp.gov.br/" target="_blank" rel="noopener">Município de São Paulo</a> <span style="display:inline-block;transform:scaleX(-1);">&copy;</span> <a href="https://urbis.prefeitura.sp.gov.br/license/cc-by-sa-4.0.html" target="_blank" rel="noopener">CC BY-SA 4.0</a>`
            : `${found.nome}: GeoSampa / Prefeitura de São Paulo`
        );
      }
      return osmStyle;
    }
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
): StyleSpecification | string => {
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

  // If the 1st active style is a vector style (OpenFreeMap), return its URL directly as base
  if (
    stylesToCombine[0] === "openfreemap-liberty" ||
    stylesToCombine[0] === "openfreemap-positron" ||
    stylesToCombine[0] === "openfreemap-bright"
  ) {
    return getSingleMapStyle(stylesToCombine[0], theme, apiBaseUrl);
  }

  const combinedSources: StyleSpecification["sources"] = {};
  const combinedLayers: StyleSpecification["layers"] = [];
  const normSaturation = Math.max(-1, Math.min(1, saturation / 100 - 1));

  stylesToCombine.forEach((styleId, index) => {
    const rawSingleStyle = getSingleMapStyle(styleId, theme, apiBaseUrl);
    const singleStyle =
      typeof rawSingleStyle === "string" ? osmStyle : rawSingleStyle;

    const prefix = `bm_${index}_`;
    const styleOpacity = opacities?.[styleId] ?? (stylesToCombine.length === 1 ? opacity : 100);
    const normOpacity = Math.max(0, Math.min(1, styleOpacity / 100));

    if (singleStyle.sources) {
      Object.entries(singleStyle.sources).forEach(([srcKey, srcVal]) => {
        const newSrcKey = `${prefix}${srcKey}`;
        combinedSources[newSrcKey] = srcVal;
      });
    }

    if (singleStyle.layers) {
      singleStyle.layers.forEach((layer) => {
        // Discard any background layers from overlaid maps to prevent opaque white blocking
        if (layer.type === "background" && index > 0) return;

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
  };
};
