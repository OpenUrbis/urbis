import axios from "axios";
import * as z from "zod";
import {
  DEFAULT_LAYER_BORDER_COLOR,
  DEFAULT_LAYER_FILL_COLOR,
  DEFAULT_LAYER_FORM_COLOR,
  DEFAULT_LAYER_LINE_WIDTH,
  DEFAULT_LAYER_TEXT_COLOR,
} from "../../../../../../lib/layer-style-defaults";

export interface LayerCapability {
  name: string;
  title: string;
  crs: string[];
  bbox?: number[];
  styles?: string[];
}

export const WMS_CAPABILITIES_VERSIONS = ["1.3.0", "1.1.1"];
export const WFS_CAPABILITIES_VERSIONS = ["2.0.0", "1.1.0", "1.0.0"];

export const getBaseGeoServerUrl = (url: string) => {
  try {
    const urlObj = new URL(url.trim());
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch {
    return url.trim();
  }
};

export const getXmlElementsByLocalName = (
  node: Document | Element,
  localName: string,
) =>
  Array.from(node.getElementsByTagName("*")).filter(
    (item) => item.localName === localName || item.nodeName === localName,
  );

export const getDirectXmlChildText = (node: Element, localName: string) => {
  const child = Array.from(node.children).find(
    (item) => item.localName === localName || item.nodeName === localName,
  );

  return child?.textContent?.trim() || "";
};

export const isValidGeographicBbox = (
  bbox?: number[],
): bbox is [number, number, number, number] => {
  if (!bbox || bbox.length !== 4 || !bbox.every(Number.isFinite)) return false;

  const [minLon, minLat, maxLon, maxLat] = bbox;
  return (
    minLon >= -180 &&
    maxLon <= 180 &&
    minLat >= -90 &&
    maxLat <= 90 &&
    minLon < maxLon &&
    minLat < maxLat
  );
};

const parseBboxNumber = (value: string | null | undefined) => {
  if (!value) return undefined;

  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseWgs84Corner = (value: string) => {
  const [lon, lat] = value
    .trim()
    .split(/\s+/)
    .map((item) => Number(item));

  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return undefined;
  return [lon, lat] as const;
};

export const extractGeographicBboxFromXmlNode = (node: Element) => {
  const exBbox = getXmlElementsByLocalName(node, "EX_GeographicBoundingBox")[0];
  if (exBbox) {
    const west = parseBboxNumber(
      getDirectXmlChildText(exBbox, "westBoundLongitude"),
    );
    const east = parseBboxNumber(
      getDirectXmlChildText(exBbox, "eastBoundLongitude"),
    );
    const south = parseBboxNumber(
      getDirectXmlChildText(exBbox, "southBoundLatitude"),
    );
    const north = parseBboxNumber(
      getDirectXmlChildText(exBbox, "northBoundLatitude"),
    );
    const bbox = [west, south, east, north];

    if (bbox.every((value): value is number => value !== undefined)) {
      const geographicBbox = bbox as [number, number, number, number];
      if (isValidGeographicBbox(geographicBbox)) return geographicBbox;
    }
  }

  const llBbox = getXmlElementsByLocalName(node, "LatLonBoundingBox")[0];
  if (llBbox) {
    const minx = parseBboxNumber(llBbox.getAttribute("minx"));
    const miny = parseBboxNumber(llBbox.getAttribute("miny"));
    const maxx = parseBboxNumber(llBbox.getAttribute("maxx"));
    const maxy = parseBboxNumber(llBbox.getAttribute("maxy"));
    const bbox = [minx, miny, maxx, maxy];

    if (bbox.every((value): value is number => value !== undefined)) {
      const geographicBbox = bbox as [number, number, number, number];
      if (isValidGeographicBbox(geographicBbox)) return geographicBbox;
    }
  }

  const wgs84Bbox = getXmlElementsByLocalName(node, "WGS84BoundingBox")[0];
  if (wgs84Bbox) {
    const lowerCorner = parseWgs84Corner(
      getDirectXmlChildText(wgs84Bbox, "LowerCorner"),
    );
    const upperCorner = parseWgs84Corner(
      getDirectXmlChildText(wgs84Bbox, "UpperCorner"),
    );

    if (lowerCorner && upperCorner) {
      const bbox: [number, number, number, number] = [
        lowerCorner[0],
        lowerCorner[1],
        upperCorner[0],
        upperCorner[1],
      ];

      if (isValidGeographicBbox(bbox)) return bbox;
    }
  }

  return undefined;
};

const DEFAULT_WFS_SRS = "CRS:84";
const DEFAULT_STREAM_WFS_SRS = "EPSG:4326";
const DEFAULT_WMS_SRS = "EPSG:3857";

const normalizeLayerServiceDefaults = (
  loadingMethod?: string,
  version?: string,
) => {
  const isWms = loadingMethod === "CustomWMSLayer";
  const isStream = loadingMethod === "Stream";

  return {
    version: isWms ? "1.3.0" : isStream ? "1.1.0" : version || "2.0.0",
    srs: isWms
      ? DEFAULT_WMS_SRS
      : isStream
        ? DEFAULT_STREAM_WFS_SRS
        : DEFAULT_WFS_SRS,
  };
};

export const buildWfsGetFeatureUrl = ({
  baseUrl,
  layerName,
  version,
  srs = DEFAULT_WFS_SRS,
  limit = 10000,
  outputFormat = "application/json",
}: {
  baseUrl: string;
  layerName: string;
  version?: string;
  srs?: string;
  limit?: number;
  outputFormat?: string;
}) => {
  const effectiveVersion = version || "2.0.0";
  const isWfs20 = effectiveVersion.startsWith("2");
  const params = new URLSearchParams();

  params.set("service", "WFS");
  params.set("version", effectiveVersion);
  params.set("request", "GetFeature");
  params.set(isWfs20 ? "typeNames" : "typeName", layerName);
  params.set(isWfs20 ? "count" : "maxFeatures", String(limit));
  params.set("outputFormat", outputFormat);
  params.set("srsName", srs);

  return `${baseUrl}?${params.toString()}`;
};

export const fetchCapabilities = async (
  url: string,
): Promise<{ layers: LayerCapability[]; version: string }> => {
  const baseUrlStr = getBaseGeoServerUrl(url);

  const environment = import.meta.env.VITE_API_URL || "/api";

  console.time("fetchCapabilities-request");
  let xmlDoc: Document | null = null;
  let serviceVersion = "";
  let lastError: unknown = null;

  for (const version of WMS_CAPABILITIES_VERSIONS) {
    try {
      const response = await axios.get(`${environment}/maps/proxy`, {
        params: {
          url: baseUrlStr,
          service: "WMS",
          version,
          request: "GetCapabilities",
        },
        timeout: 20000,
      });

      const parser = new DOMParser();
      const parsed = parser.parseFromString(response.data, "text/xml");
      if (parsed.getElementsByTagName("parsererror").length === 0) {
        xmlDoc = parsed;
        serviceVersion =
          parsed.documentElement.getAttribute("version") || version;
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }

  console.timeEnd("fetchCapabilities-request");

  if (!xmlDoc) throw lastError || new Error("Capabilities inválido");

  const extractedLayers: LayerCapability[] = [];
  const layerNodes = getXmlElementsByLocalName(xmlDoc, "Layer");
  console.log("fetchCapabilities: Layer nodes count", layerNodes.length);

  console.time("fetchCapabilities-extract");
  for (let i = 0; i < layerNodes.length; i++) {
    const node = layerNodes[i];
    const name = getDirectXmlChildText(node, "Name");
    const title = getDirectXmlChildText(node, "Title") || name;
    const styles = Array.from(node.children)
      .filter(
        (child) => child.localName === "Style" || child.nodeName === "Style",
      )
      .map((styleNode) => getDirectXmlChildText(styleNode, "Name"))
      .filter(Boolean);

    if (name) {
      const crsList: string[] = [];
      const crsNodes = node.getElementsByTagName("CRS");
      const srsNodes = node.getElementsByTagName("SRS");

      for (let j = 0; j < crsNodes.length; j++) {
        if (crsNodes[j].textContent) crsList.push(crsNodes[j].textContent!);
      }
      for (let j = 0; j < srsNodes.length; j++) {
        if (srsNodes[j].textContent) crsList.push(srsNodes[j].textContent!);
      }

      const bbox = extractGeographicBboxFromXmlNode(node);

      if (name && !extractedLayers.some((l) => l.name === name)) {
        extractedLayers.push({
          name,
          title,
          crs: Array.from(new Set(crsList)),
          bbox,
          styles,
        });
      }
    }
  }
  console.timeEnd("fetchCapabilities-extract");

  return { layers: extractedLayers, version: serviceVersion };
};

export enum LayerSchemaColorTypeEnum {
  TEXT = "text",
  FILL = "fill",
  LINE = "line",
}

const optionalNonNegativeNumberString = (fieldLabel: string) =>
  z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || value === "" || Number(value) >= 0,
      `${fieldLabel} não pode ser negativo`,
    );

const optionalNonNegativeNumber = (fieldLabel: string) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(0, `${fieldLabel} não pode ser negativo`).optional(),
  );

const hexColorSchema = z
  .string()
  .regex(
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
    "Informe uma cor hexadecimal válida",
  );

const parseOptionalNonNegativeNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractLegacyTextProperty = (getText?: unknown) => {
  if (typeof getText !== "string") return "";

  const match =
    getText.match(/properties\?\.([A-Za-z0-9_]+)/)?.[1] ??
    getText.match(/properties\.([A-Za-z0-9_]+)/)?.[1] ??
    getText.match(/properties\?\.\[(['"])([^'"]+)\1\]/)?.[2] ??
    getText.match(/properties\[(['"])([^'"]+)\1\]/)?.[2];

  if (match) return match;

  // If it is a complex custom function, return the whole function string!
  if (getText.startsWith("(") || getText.includes("=>")) {
    return getText;
  }

  if (/^[A-Za-z0-9_]+$/.test(getText.trim())) {
    return getText.trim();
  }

  return "";
};

const normalizeColorArray = (
  color: unknown,
  fallback: readonly number[],
): number[] => {
  if (!Array.isArray(color)) return [...fallback];

  return [
    Number.isFinite(Number(color[0])) ? Number(color[0]) : fallback[0],
    Number.isFinite(Number(color[1])) ? Number(color[1]) : fallback[1],
    Number.isFinite(Number(color[2])) ? Number(color[2]) : fallback[2],
    Number.isFinite(Number(color[3])) ? Number(color[3]) : fallback[3],
  ];
};

const normalizeOptionalColorArray = (color: unknown): number[] | undefined => {
  if (!Array.isArray(color)) return undefined;

  const alpha = Number(color[3] !== undefined ? color[3] : 1);
  const normalizedAlpha = Math.round(
    alpha <= 1 ? alpha * 255 : alpha,
  );

  const normalized = [
    Number(color[0]),
    Number(color[1]),
    Number(color[2]),
    normalizedAlpha,
  ];

  return normalized.every(Number.isFinite) ? normalized : undefined;
};

const parseOptionalColorArray = (color: unknown): number[] | undefined => {
  if (!Array.isArray(color)) return undefined;

  const alpha = Number(color[3] !== undefined ? color[3] : 255);
  const normalizedAlpha = alpha > 1 ? alpha / 255 : alpha;

  const normalized = [
    Number(color[0]),
    Number(color[1]),
    Number(color[2]),
    normalizedAlpha,
  ];

  return normalized.every(Number.isFinite) ? normalized : undefined;
};

// Schema Definitions
const step1Schema = z.object({
  url: z.string().url("Insira uma URL válida"),
  selectedLayer: z
    .object({
      name: z.string(),
      title: z.string(),
      crs: z.array(z.string()).optional(),
      bbox: z.array(z.number()).optional(),
      styles: z.array(z.string()).optional(),
    })
    .optional(),
}) as any;

const step2Schema = z
  .object({
    version: z.string().min(1, "Informe a versão"),
    srs: z.string().optional().default(DEFAULT_WFS_SRS),
    loadingMethod: z.string().min(1, "Selecione o método de carregamento"),
    origin: z.string().url("Insira uma URL válida"),
    groupId: z.string().min(1, "Selecione um grupo"),
    layerName: z.string().min(1, "Insira o nome da camada"),
    summaryDescription: z
      .string()
      .refine(
        (value) => !value || stripHtml(value).length <= 280,
        "Use no máximo 280 caracteres",
      )
      .optional(),
    sourceParameters: z.string().optional(),
    legisLinks: z.string().optional(),
    ckanMetadataUrl: z.string().optional(),
    index: optionalNonNegativeNumber("Ordenação"),
    minZoom: optionalNonNegativeNumberString("Zoom mínimo"),
    maxZoom: optionalNonNegativeNumberString("Zoom máximo"),
    clickAction: z.enum(["SelectFeature", "setZoom", "openFeature", "info", "none"]),
    clickActionParams: z
      .object({
        zoom: optionalNonNegativeNumberString("Zoom da ação"),
        template: z.string().optional(),
      })
      .optional(),
    isActive: z.boolean(),
    isSelected: z.boolean(),
    isVisible: z.boolean(),
    includeInAnalysis: z.boolean().nullish().transform((v) => v !== false),
    includeInFiu: z.boolean().nullish().transform((v) => v !== false),
    isPublic: z.boolean().optional().default(true),
    allowedRoles: z.array(z.string()).optional().default([]),
  })
  .refine(
    (data) => data.isPublic || (data.allowedRoles?.length ?? 0) > 0,
    {
      message: "Selecione ao menos um cargo para uma camada restrita",
      path: ["allowedRoles"],
    },
  )
  .refine(
    (data) => {
      const minZoom = parseOptionalNonNegativeNumber(data.minZoom);
      const maxZoom = parseOptionalNonNegativeNumber(data.maxZoom);
      return (
        minZoom === undefined || maxZoom === undefined || maxZoom >= minZoom
      );
    },
    {
      message: "Zoom máximo deve ser maior ou igual ao zoom mínimo",
      path: ["maxZoom"],
    },
  ) as any;

const step2_5Schema = z
  .object({
    viewTemplate: z.string().optional(),
    boardTemplate: z.string().optional(),
  })
  .refine(() => {
    // We can't access clickAction from previous step here easily in z.object().refine
    // Validation logic will need to check the combined data or be handled in the step component/index
    return true;
  }) as any;

const step3Schema = z
  .object({
    isDynamic: z.boolean(),
    layerProperty: z.string().optional(),
    lineWidth: z.coerce
      .number()
      .min(0.1, "Informe uma espessura maior que zero"),
    hoverColor: z.array(z.number()).optional(),
    selectedColor: z.array(z.number()).optional(),
    label: z
      .object({
        enabled: z.boolean(),
        property: z.string().optional(),
        minZoom: optionalNonNegativeNumberString("Zoom mínimo do rótulo"),
        maxZoom: optionalNonNegativeNumberString("Zoom máximo do rótulo"),
        size: optionalNonNegativeNumber("Tamanho do texto"),
        color: hexColorSchema.optional(),
        haloColor: hexColorSchema.optional(),
        haloWidth: optionalNonNegativeNumber("Largura do contorno"),
      })
      .optional(),
    colors: z
      .array(z.any())
      .min(1, "É necessário configurar pelo menos uma cor"),
  })
  .refine(
    (data) => {
      if (data.label?.enabled && !data.label.property) {
        return false;
      }
      return true;
    },
    {
      message: "Informe o atributo usado como texto",
      path: ["label", "property"],
    },
  )
  .refine(
    (data) => {
      if (data.isDynamic && !data.layerProperty) {
        return false;
      }
      return true;
    },
    {
      message: "Informe o atributo para classification",
      path: ["layerProperty"],
    },
  ) as any;

const step4Schema = z.object({
  propertyMapping: z
    .record(
      z.string(),
      z.object({
        label: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
}) as any;

// Combined schema for form type
export const LayerSchemaFormSchema = step1Schema
  .merge(step2Schema)
  .merge(step2_5Schema)
  .merge(step3Schema)
  .merge(step4Schema);

export type LayerSchemaFormValues = z.infer<typeof LayerSchemaFormSchema>;

export const generateOriginUrl = (
  url: string,
  selectedLayer: { name: string; title: string } | undefined,
  loadingMethod: string,
  version?: string,
  _srs?: string,
) => {
  const baseUrl = getBaseGeoServerUrl(url);
  const defaults = normalizeLayerServiceDefaults(loadingMethod, version);

  if (loadingMethod === "CustomWMSLayer") {
    // For CustomWMSLayer, we return the base URL because the component constructs the GetMap request
    // The params are saved in properties or handled by the component
    return baseUrl;
  } else {
    return buildWfsGetFeatureUrl({
      baseUrl,
      layerName: selectedLayer?.name || "",
      version: defaults.version,
      srs: defaults.srs,
      limit: 10000,
      outputFormat: loadingMethod === "Stream" ? "json" : "application/json",
    });
  }
};

export const buildLayerSchema = (data: LayerSchemaFormValues) => {
  const {
    url,
    selectedLayer,
    loadingMethod,
    version,
    srs,
    origin,
    groupId,
    layerName,
    summaryDescription,
    sourceParameters,
    legisLinks,
    ckanMetadataUrl,
    index,
    minZoom,
    maxZoom,
    clickAction,
    clickActionParams,
    viewTemplate,
    boardTemplate,
    isActive,
    isSelected,
    isVisible,
    isPublic,
    allowedRoles,
    isDynamic,
    layerProperty,
    lineWidth,
    hoverColor,
    selectedColor,
    label,
    colors,
    propertyMapping,
  } = data;

  const id = selectedLayer?.name?.split(":").pop() || "";

  // Use the origin from the form data, or generate it as a fallback
  const defaults = normalizeLayerServiceDefaults(loadingMethod, version);

  const finalOrigin =
    origin ||
    generateOriginUrl(
      url,
      selectedLayer,
      loadingMethod,
      defaults.version,
      defaults.srs,
    );

  let type = "GeoJsonLayer";
  if (loadingMethod === "CustomWMSLayer") type = "CustomWMSLayer";
  if (loadingMethod === "Stream") type = "Stream";
  if (loadingMethod === "BitmapLayer") type = "BitmapLayer";

  let clickActionObj = undefined;
  if (clickAction && clickAction !== "none") {
    clickActionObj = {
      action: clickAction,
      params: {}, // Initialize params object
    };

    if (clickAction === "setZoom" && clickActionParams?.zoom) {
      clickActionObj.params = { zoom: Number(clickActionParams.zoom) };
    } else if (clickAction === "openFeature" && clickActionParams?.template) {
      clickActionObj.params = { template: clickActionParams.template };
    }
  }

  const normalizedMinZoom = parseOptionalNonNegativeNumber(minZoom);
  const normalizedMaxZoom = parseOptionalNonNegativeNumber(maxZoom);
  const normalizedIndex = parseOptionalNonNegativeNumber(index);
  const normalizedLineWidth =
    parseOptionalNonNegativeNumber(lineWidth) ?? DEFAULT_LAYER_LINE_WIDTH;
  const shouldPersistVisualState =
    loadingMethod !== "CustomWMSLayer" && isSelected;
  const normalizedHoverColor = shouldPersistVisualState
    ? normalizeOptionalColorArray(hoverColor)
    : undefined;
  const normalizedSelectedColor = shouldPersistVisualState
    ? normalizeOptionalColorArray(selectedColor)
    : undefined;
  const normalizedLabelMinZoom = parseOptionalNonNegativeNumber(label?.minZoom);
  const normalizedLabelMaxZoom = parseOptionalNonNegativeNumber(label?.maxZoom);
  const normalizedLabelSize = parseOptionalNonNegativeNumber(label?.size);
  const normalizedLabelHaloWidth = parseOptionalNonNegativeNumber(
    label?.haloWidth,
  );
  const labelSchema = label?.enabled
    ? {
        enabled: true,
        property: label.property,
        minZoom: normalizedLabelMinZoom,
        maxZoom: normalizedLabelMaxZoom,
        size: normalizedLabelSize,
        color: label.color,
        haloColor: label.haloColor,
        haloWidth: normalizedLabelHaloWidth,
      }
    : label
      ? { enabled: false }
      : undefined;
  const visualState = {
    ...(normalizedHoverColor ? { hoverColor: normalizedHoverColor } : {}),
    ...(normalizedSelectedColor
      ? { selectedColor: normalizedSelectedColor }
      : {}),
  };

  const sourceColors =
    Array.isArray(colors) && colors.length > 0
      ? (colors as any[])
      : [DEFAULT_LAYER_FORM_COLOR];

  const transformedColors = sourceColors.flatMap((c) => {
    const common = {
      label: isDynamic ? c.label || c.value : "default",
      value: isDynamic ? c.value : undefined,
      legisUrl: isDynamic ? c.legisUrl?.trim() || undefined : undefined,
    };

    const normalizedFillColor = normalizeColorArray(
      c.fillColor,
      DEFAULT_LAYER_FILL_COLOR,
    );
    const normalizedBorderColor = normalizeColorArray(
      c.borderColor,
      isDynamic ? normalizedFillColor : DEFAULT_LAYER_BORDER_COLOR,
    );
    const normalizedTextColor = normalizeColorArray(
      c.textColor,
      DEFAULT_LAYER_TEXT_COLOR,
    );

    const fillAlpha = Math.round(
      normalizedFillColor[3] <= 1
        ? normalizedFillColor[3] * 255
        : normalizedFillColor[3],
    );
    const lineAlpha = Math.round(
      normalizedBorderColor[3] <= 1
        ? normalizedBorderColor[3] * 255
        : normalizedBorderColor[3],
    );
    const textAlpha = Math.round(
      normalizedTextColor[3] <= 1
        ? normalizedTextColor[3] * 255
        : normalizedTextColor[3],
    );

    const fillColor = [
      normalizedFillColor[0],
      normalizedFillColor[1],
      normalizedFillColor[2],
      fillAlpha,
    ];
    const borderColor = [
      normalizedBorderColor[0],
      normalizedBorderColor[1],
      normalizedBorderColor[2],
      lineAlpha,
    ];
    const textColor = [
      normalizedTextColor[0],
      normalizedTextColor[1],
      normalizedTextColor[2],
      textAlpha,
    ];

    // If all three colors are identical, save only as FILL type
    const areAllEqual =
      JSON.stringify(fillColor) === JSON.stringify(borderColor) &&
      JSON.stringify(fillColor) === JSON.stringify(textColor);

    if (areAllEqual) {
      return [
        {
          ...common,
          type: LayerSchemaColorTypeEnum.FILL,
          pattern: c.pattern && c.pattern !== "full" ? c.pattern : undefined,
          patternConfig:
            c.patternConfig && Object.keys(c.patternConfig).length > 0
              ? c.patternConfig
              : undefined,
          color: fillColor,
        },
      ];
    }

    return [
      {
        ...common,
        type: LayerSchemaColorTypeEnum.FILL,
        pattern: c.pattern && c.pattern !== "full" ? c.pattern : undefined,
        patternConfig:
          c.patternConfig && Object.keys(c.patternConfig).length > 0
            ? c.patternConfig
            : undefined,
        color: fillColor,
      },
      {
        ...common,
        type: LayerSchemaColorTypeEnum.LINE,
        color: borderColor,
      },
      {
        ...common,
        type: LayerSchemaColorTypeEnum.TEXT,
        color: textColor,
      },
    ];
  });

  const schema: any = {
    id,
    name: layerName,
    description: summaryDescription?.trim() || undefined,
    origin: finalOrigin,
    isActive,
    isSelected,
    isVisible,
    isPublic: isPublic ?? true,
    allowedRoles: allowedRoles ?? [],
    type,
    index: normalizedIndex ?? undefined,
    minZoom: normalizedMinZoom ?? undefined,
    maxZoom: normalizedMaxZoom ?? undefined,
    getTextColorPropName: isDynamic ? layerProperty : null,
    getFillColorPropName: isDynamic ? layerProperty : null,
    getLineColorPropName: isDynamic ? layerProperty : null,
    groupId,
    includeInAnalysis: data.includeInAnalysis !== false,
    includeInFiu: data.includeInFiu !== false,
    clickAction: clickActionObj,
    viewTemplate: viewTemplate ? JSON.parse(viewTemplate) : undefined,
    boardTemplate: boardTemplate ? JSON.parse(boardTemplate) : undefined,
    colors: transformedColors,
    properties: {
      includeInAnalysis: data.includeInAnalysis !== false,
      includeInFiu: data.includeInFiu !== false,
      attributeMapping: propertyMapping,
      metadata: {
        summaryDescription: summaryDescription?.trim() || "",
        sourceParameters: sourceParameters?.trim() || "",
        legisLinks: legisLinks?.trim() || "",
        ckanMetadataUrl: ckanMetadataUrl?.trim() || "",
      },
      getLineWidth: normalizedLineWidth,
      lineWidthUnits: "pixels",
      filled: true,
      stroked: true,
      pickable: true,
      ...(labelSchema ? { label: labelSchema } : {}),
      ...(Object.keys(visualState).length > 0 ? { visualState } : {}),
      version: defaults.version,
      srs: defaults.srs,
      typeName: selectedLayer?.name,
      maxZoom: normalizedMaxZoom,
    },
  };

  if (labelSchema && labelSchema.enabled) {
    let prop = labelSchema.property;
    if (prop) {
      const isLiteralString =
        (prop.startsWith("'") && prop.endsWith("'")) ||
        (prop.startsWith('"') && prop.endsWith('"'));

      const cleanProp = isLiteralString ? prop.slice(1, -1) : prop;
      const isExpression = cleanProp.startsWith("(") || cleanProp.includes("=>");

      if (isExpression) {
        schema.properties.getText = cleanProp;
      } else if (isLiteralString) {
        schema.properties.getText = `(d) => "${cleanProp}"`;
      } else {
        schema.properties.getText = `(d) => d?.properties?.${cleanProp}`;
      }
    }
    schema.properties.minZoomText = parseOptionalNonNegativeNumber(labelSchema.minZoom);
    schema.properties.maxZoomText = parseOptionalNonNegativeNumber(labelSchema.maxZoom);
    schema.properties.getTextSize = parseOptionalNonNegativeNumber(labelSchema.size);
  }

  // For CustomWMSLayer, ensure we have the nested wms property that MapView/CustomWMSLayer expects
  if (type === "CustomWMSLayer") {
    schema.properties.wms = {
      url: finalOrigin,
      layers: selectedLayer?.name || "",
      version: defaults.version,
      srs: defaults.srs,
      transparent: true,
      format: "image/png",
    };

    // Also ensure we have a clickAction for info if none is specified
    if (!schema.clickAction) {
      schema.clickAction = { action: "info", params: {} };
    }
  }

  return schema;
};

export interface LayerSchemaColor {
  type: LayerSchemaColorTypeEnum;
  color: number[];
  label?: string;
  value?: string;
  pattern?: string;
  patternConfig?: Record<string, any>;
}

export interface LayerSchema {
  origin: string;
  name: string;
  description?: string;
  type: string;
  index?: number;
  minZoom?: number | null;
  maxZoom?: number | null;
  getFillColorPropName?: string | null;
  groupId: string;
  isActive: boolean;
  isSelected: boolean;
  isVisible: boolean;
  isPublic?: boolean;
  allowedRoles?: string[];
  layerGroup?: any;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
  colors: LayerSchemaColor[];
  label?: {
    enabled: boolean;
    property?: string;
    minZoom?: number;
    maxZoom?: number;
    size?: number;
    color?: string;
    haloColor?: string;
    haloWidth?: number;
  };
  clickAction?: {
    action: string;
    zoom?: number;
    template?: string;
    params?: any;
  };
  viewTemplate?: any;
  boardTemplate?: any;
  properties?: Record<string, any>;
}

export const parseLayerSchemaToForm = (
  data: LayerSchema,
): LayerSchemaFormValues => {
  const {
    origin,
    name,
    description,
    type,
    index,
    minZoom,
    maxZoom,
    getFillColorPropName,
    groupId,
    colors,
    clickAction,
    viewTemplate,
    boardTemplate,
    label,
    properties,
  } = data;

  // Extract base URL from origin
  const urlParts = origin.split("?");
  const url = urlParts[0];

  // Reconstruct selectedLayer from origin params if possible
  let selectedLayer = undefined;
  let version = type === "CustomWMSLayer" ? "1.3.0" : "2.0.0";
  let srs = type === "CustomWMSLayer" ? DEFAULT_WMS_SRS : DEFAULT_WFS_SRS;

  if (urlParts[1]) {
    const params = new URLSearchParams(urlParts[1]);
    // Actually URLSearchParams keys are case sensitive. WMS keys are case insensitive but usually uppercase in generated URLs.

    // Check various casing for LAYERS/layers/typeName
    const name =
      params.get("typeNames") ||
      params.get("typeName") ||
      params.get("layers") ||
      params.get("LAYERS");

    if (name) {
      selectedLayer = {
        name: name,
        title: data.name || name,
      };
    }

    // Extract version
    version =
      params.get("version") ||
      params.get("VERSION") ||
      properties?.version ||
      (type === "CustomWMSLayer" ? "1.3.0" : "2.0.0");

    srs = normalizeLayerServiceDefaults(type, version).srs;
  } else {
    // Fallback if URL params are missing (e.g. cleaned WMS URL), check properties
    if (properties?.version) version = properties.version;
    srs = normalizeLayerServiceDefaults(type, version).srs;

    // Try to reconstruct selectedLayer from properties.typeName
    if (properties?.typeName) {
      selectedLayer = {
        name: properties.typeName,
        title: data.name || properties.typeName,
      };
    }
  }

  // Group colors by label/value to reconstruct form items
  const colorGroups: Record<
    string,
    {
      label: string;
      value: string;
      pattern: string;
      patternConfig?: Record<string, any>;
      fillColor?: number[];
      borderColor?: number[];
      textColor?: number[];
      legisUrl?: string;
    }
  > = {};

  const hasDynamicColorProperty = Boolean(getFillColorPropName);

  colors.forEach((c) => {
    const key = hasDynamicColorProperty
      ? c.value || c.label || `default-${c.type}`
      : "default";
    if (!colorGroups[key]) {
      colorGroups[key] = {
        label:
          hasDynamicColorProperty && c.label !== "default" ? c.label || "" : "",
        value: hasDynamicColorProperty ? c.value || "" : "",
        pattern: c.pattern || "full",
        patternConfig: c.patternConfig,
        legisUrl: (c as any).legisUrl || "",
      };
    } else if ((c as any).legisUrl && !colorGroups[key].legisUrl) {
      colorGroups[key].legisUrl = (c as any).legisUrl;
    }

    const alpha = c.color[3] !== undefined ? c.color[3] : 255;
    const colorWithAlpha = [
      c.color[0],
      c.color[1],
      c.color[2],
      alpha > 1 ? alpha / 255 : alpha, // Convert back to 0-1 range for the form
    ];

    if (!c.type || c.type === LayerSchemaColorTypeEnum.FILL) {
      colorGroups[key].fillColor = colorWithAlpha;
      if (c.pattern) colorGroups[key].pattern = c.pattern;
      if (c.patternConfig) colorGroups[key].patternConfig = c.patternConfig;
    } else if (c.type === LayerSchemaColorTypeEnum.LINE) {
      colorGroups[key].borderColor = colorWithAlpha;
    } else if (c.type === LayerSchemaColorTypeEnum.TEXT) {
      colorGroups[key].textColor = colorWithAlpha;
    }
  });

  const formColors = Object.values(colorGroups).map((group) => {
    const fill =
      group.fillColor || group.borderColor || [...DEFAULT_LAYER_FILL_COLOR];
    return {
      fillColor: fill,
      borderColor:
        group.borderColor ||
        (hasDynamicColorProperty ? fill : [...DEFAULT_LAYER_BORDER_COLOR]),
      textColor: group.textColor || [...DEFAULT_LAYER_TEXT_COLOR],
      pattern: group.pattern,
      patternConfig: group.patternConfig,
      label: group.label,
      value: group.value,
      legisUrl: group.legisUrl || "",
    };
  });

  let loadingMethod = "GeoJsonLayer";
  if (type === "CustomWMSLayer") loadingMethod = "CustomWMSLayer";
  if (type === "Stream") loadingMethod = "Stream";
  if (type === "BitmapLayer") loadingMethod = "BitmapLayer";

  let formClickAction = "none";
  let formClickActionParams = {};

  if (clickAction?.action) {
    formClickAction = clickAction.action;

    if (clickAction.action === "setZoom") {
      formClickActionParams = {
        zoom:
          clickAction.zoom?.toString() || clickAction.params?.zoom?.toString(),
      };
    } else if (clickAction.action === "openFeature") {
      formClickActionParams = {
        template: clickAction.template || clickAction.params?.template,
      };
    }
  }

  const rawMapping = properties?.attributeMapping || {};
  const normalizedMapping: Record<
    string,
    { label: string; description?: string }
  > = {};

  Object.entries(rawMapping).forEach(([key, value]) => {
    if (typeof value === "string") {
      normalizedMapping[key] = { label: value };
    } else if (typeof value === "object" && value !== null) {
      normalizedMapping[key] = {
        label: (value as any).label || "",
        description: (value as any).description,
      };
    }
  });

  const finalMinZoom = minZoom ?? properties?.minZoom;
  const finalMaxZoom = maxZoom ?? properties?.maxZoom;
  const finalLineWidth = Number(
    properties?.getLineWidth ?? DEFAULT_LAYER_LINE_WIDTH,
  );
  const legacyLabelProperty = extractLegacyTextProperty(properties?.getText);
  const isLegacyLabelEnabled = Boolean(properties?.getText);
  const normalizedLabel =
    properties?.label && !isLegacyLabelEnabled
      ? properties.label
      : (isLegacyLabelEnabled || label?.enabled
          ? {
              enabled: true,
              property: legacyLabelProperty || properties?.label?.property || label?.property || "",
              minZoom: properties?.minZoomText?.toString() || properties?.label?.minZoom?.toString() || label?.minZoom?.toString() || "",
              maxZoom: properties?.maxZoomText?.toString() || properties?.label?.maxZoom?.toString() || label?.maxZoom?.toString() || "",
              size: properties?.getTextSize || properties?.label?.size || label?.size || 13,
              color: properties?.label?.color || label?.color || "#111827",
              haloColor: properties?.label?.haloColor || label?.haloColor || "#ffffff",
              haloWidth: properties?.label?.haloWidth || label?.haloWidth || 2,
            }
          : undefined);
  const visualState = properties?.visualState ?? {};
  const metadata = properties?.metadata ?? {};

  return {
    url,
    selectedLayer,
    origin,
    loadingMethod,
    version,
    srs,
    groupId: groupId || "geral",
    layerName: name,
    summaryDescription: metadata.summaryDescription ?? description ?? "",
    sourceParameters: metadata.sourceParameters ?? "",
    legisLinks: metadata.legisLinks ?? "",
    ckanMetadataUrl: metadata.ckanMetadataUrl ?? "",
    index,
    minZoom: finalMinZoom?.toString() || "",
    maxZoom: finalMaxZoom?.toString() || "",
    clickAction: formClickAction as any,
    clickActionParams: formClickActionParams,
    viewTemplate: viewTemplate ? JSON.stringify(viewTemplate, null, 2) : "",
    boardTemplate: boardTemplate ? JSON.stringify(boardTemplate, null, 2) : "",
    isActive: data.isActive ?? true,
    isSelected: data.isSelected ?? false,
    isVisible: data.isVisible ?? true,
    includeInAnalysis: (data as any).includeInAnalysis ?? properties?.includeInAnalysis ?? true,
    includeInFiu: (data as any).includeInFiu ?? properties?.includeInFiu ?? true,
    isPublic: data.isPublic ?? true,
    allowedRoles: data.allowedRoles ?? [],
    isDynamic: !!getFillColorPropName,
    layerProperty: getFillColorPropName || "",
    lineWidth: Number.isNaN(finalLineWidth)
      ? DEFAULT_LAYER_LINE_WIDTH
      : finalLineWidth,
    hoverColor: parseOptionalColorArray(visualState.hoverColor),
    selectedColor: parseOptionalColorArray(visualState.selectedColor),
    label: {
      enabled: normalizedLabel?.enabled ?? false,
      property: normalizedLabel?.property ?? "",
      minZoom: normalizedLabel?.minZoom?.toString() ?? "",
      maxZoom: normalizedLabel?.maxZoom?.toString() ?? "",
      size: normalizedLabel?.size ?? 13,
      color: normalizedLabel?.color ?? "#111827",
      haloColor: normalizedLabel?.haloColor ?? "#ffffff",
      haloWidth: normalizedLabel?.haloWidth ?? 2,
    },
    colors: formColors,
    propertyMapping: normalizedMapping,
  };
};
