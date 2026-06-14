import * as z from "zod";
import axios from "axios";

export interface LayerCapability {
  name: string;
  title: string;
  crs: string[];
  bbox?: number[];
}

export const fetchCapabilities = async (url: string): Promise<{ layers: LayerCapability[], version: string }> => {
  let baseUrlStr = url;
  try {
    const urlObj = new URL(url);
    baseUrlStr = `${urlObj.origin}${urlObj.pathname}`;
  } catch {
    // Keep original URL
  }

  const environment = import.meta.env.VITE_API_URL || "/api";

  const response = await axios.get(`${environment}/maps/proxy`, {
    params: { url: baseUrlStr, service: 'WMS', version: '1.3.0', request: 'GetCapabilities' }
  });

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(response.data, "text/xml");

  const root = xmlDoc.documentElement;
  const serviceVersion = root.getAttribute("version") || "1.1.1";

  const extractedLayers: LayerCapability[] = [];
  const layerNodes = xmlDoc.getElementsByTagName("Layer");

  for (let i = 0; i < layerNodes.length; i++) {
    const node = layerNodes[i];
    const nameNode = node.getElementsByTagName("Name")[0];
    const titleNode = node.getElementsByTagName("Title")[0];

    if (nameNode && titleNode) {
      const name = nameNode.textContent || "";
      const title = titleNode.textContent || "";

      const crsList: string[] = [];
      const crsNodes = node.getElementsByTagName("CRS");
      const srsNodes = node.getElementsByTagName("SRS");
      
      for (let j = 0; j < crsNodes.length; j++) {
        if (crsNodes[j].textContent) crsList.push(crsNodes[j].textContent!);
      }
      for (let j = 0; j < srsNodes.length; j++) {
        if (srsNodes[j].textContent) crsList.push(srsNodes[j].textContent!);
      }

      // Extract BBox
      let bbox: number[] | undefined;
      const exBbox = node.getElementsByTagName("EX_GeographicBoundingBox")[0];
      if (exBbox) {
         const west = parseFloat(exBbox.getElementsByTagName("westBoundLongitude")[0]?.textContent || "0");
         const east = parseFloat(exBbox.getElementsByTagName("eastBoundLongitude")[0]?.textContent || "0");
         const south = parseFloat(exBbox.getElementsByTagName("southBoundLatitude")[0]?.textContent || "0");
         const north = parseFloat(exBbox.getElementsByTagName("northBoundLatitude")[0]?.textContent || "0");
         bbox = [west, south, east, north];
      } else {
         const llBbox = node.getElementsByTagName("LatLonBoundingBox")[0];
         if (llBbox) {
            const minx = parseFloat(llBbox.getAttribute("minx") || "0");
            const miny = parseFloat(llBbox.getAttribute("miny") || "0");
            const maxx = parseFloat(llBbox.getAttribute("maxx") || "0");
            const maxy = parseFloat(llBbox.getAttribute("maxy") || "0");
            bbox = [minx, miny, maxx, maxy];
         }
      }

      if (name && !extractedLayers.some(l => l.name === name)) {
        extractedLayers.push({ name, title, crs: Array.from(new Set(crsList)), bbox });
      }
    }
  }
  
  return { layers: extractedLayers, version: serviceVersion };
}

export enum LayerSchemaColorTypeEnum {
  TEXT = "text",
  FILL = "fill",
  LINE = "line",
}

// Schema Definitions
const step1Schema = z.object({
  url: z.string().url("Insira uma URL válida"),
  selectedLayer: z
    .object({
      name: z.string(),
      title: z.string(),
      crs: z.array(z.string()).optional(),
      bbox: z.array(z.number()).optional(),
    })
    .optional(),
}) as any;

const step2Schema = z.object({
  version: z.string().min(1, "Informe a versão"),
  srs: z.string().min(1, "Informe o SRS"),
  loadingMethod: z.string().min(1, "Selecione o método de carregamento"),
  origin: z.string().url("Insira uma URL válida"),
  groupId: z.string().min(1, "Selecione um grupo"),
  layerName: z.string().min(1, "Insira o nome da camada"),
  index: z.coerce.number().optional(),
  minZoom: z.string().optional(),
  maxZoom: z.string().optional(),
  clickAction: z.enum(["SelectFeature", "setZoom", "openFeature", "none"]),
  clickActionParams: z
    .object({
      zoom: z.string().optional(),
      template: z.string().optional(),
    })
    .optional(),
  isActive: z.boolean(),
  isVisible: z.boolean(),
}) as any;

const step2_5Schema = z
  .object({
    viewTemplate: z.string().optional(),
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
    colors: z
      .array(z.any())
      .min(1, "É necessário configurar pelo menos uma cor"),
  })
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
    }
  ) as any;

const step4Schema = z.object({
  propertyMapping: z
    .record(
      z.string(),
      z.object({
        label: z.string(),
        description: z.string().optional(),
      })
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
  srs?: string
) => {
  // Extract base URL
  let baseUrl = url;
  try {
    const urlObj = new URL(url);
    baseUrl = `${urlObj.origin}${urlObj.pathname}`;
  } catch {
    // Keep original URL if parsing fails
  }

  const params = new URLSearchParams();

  if (loadingMethod === "CustomWMSLayer") {
    // For CustomWMSLayer, we return the base URL because the component constructs the GetMap request
    // The params are saved in properties or handled by the component
    return baseUrl;
  } else {
    // GeoJsonLayer or Stream
    params.set("service", "WFS");
    params.set("version", version || "1.0.0");
    params.set("request", "GetFeature");
    params.set("typeName", selectedLayer?.name || "");
    params.set("maxFeatures", "10000");
    params.set("outputFormat", "json");

    if (srs) {
      params.set("srsName", srs);
    }
  }

  return `${baseUrl}?${params.toString()}`;
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
    index,
    minZoom,
    maxZoom,
    clickAction,
    clickActionParams,
    viewTemplate,
    isActive,
    isVisible,
    isDynamic,
    layerProperty,
    colors,
    propertyMapping,
  } = data;

  const id = selectedLayer?.name?.split(":").pop() || "";

  // Use the origin from the form data, or generate it as a fallback
  const finalOrigin =
    origin || generateOriginUrl(url, selectedLayer, loadingMethod, version, srs);

  let type = "GeoJsonLayer";
  if (loadingMethod === "CustomWMSLayer") type = "CustomWMSLayer";
  if (loadingMethod === "Stream") type = "Stream";

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

  const transformedColors = (colors as any[]).flatMap((c) => {
    const common = {
      label: isDynamic ? c.label || c.value : "default",
      value: isDynamic ? c.value : undefined,
    };

    const fillAlpha = Math.round(
      c.fillColor[3] <= 1 ? c.fillColor[3] * 255 : c.fillColor[3]
    );
    const lineAlpha = Math.round(
      c.borderColor[3] <= 1 ? c.borderColor[3] * 255 : c.borderColor[3]
    );
    const textAlpha = Math.round(
      c.textColor[3] <= 1 ? c.textColor[3] * 255 : c.textColor[3]
    );

    const fillColor = [
      c.fillColor[0],
      c.fillColor[1],
      c.fillColor[2],
      fillAlpha,
    ];
    const borderColor = [
      c.borderColor[0],
      c.borderColor[1],
      c.borderColor[2],
      lineAlpha,
    ];
    const textColor = [
      c.textColor[0],
      c.textColor[1],
      c.textColor[2],
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
    origin: finalOrigin,
    isActive,
    isVisible,
    type,
    index,
    minZoom: minZoom ? Number.parseInt(minZoom) : null,
    maxZoom: maxZoom ? Number.parseInt(maxZoom) : null,
    getTextColorPropName: isDynamic ? layerProperty : null,
    getFillColorPropName: isDynamic ? layerProperty : null,
    getLineColorPropName: isDynamic ? layerProperty : null,
    groupId,
    clickAction: clickActionObj,
    viewTemplate: viewTemplate ? JSON.parse(viewTemplate) : undefined,
    colors: transformedColors,
    properties: {
      attributeMapping: propertyMapping,
      version,
      srs,
      typeName: selectedLayer?.name,
      maxZoom: maxZoom ? Number.parseInt(maxZoom) : undefined,
    },
  };

  // For CustomWMSLayer, ensure we have the nested wms property that MapView/CustomWMSLayer expects
  if (type === "CustomWMSLayer") {
    schema.properties.wms = {
      url: finalOrigin,
      layers: selectedLayer?.name || "",
      version: version || "1.3.0",
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
  type: string;
  index?: number;
  minZoom?: number | null;
  maxZoom?: number | null;
  getFillColorPropName?: string | null;
  groupId: string;
  isActive: boolean;
  isVisible: boolean;
  colors: LayerSchemaColor[];
  clickAction?: {
    action: string;
    zoom?: number;
    template?: string;
    params?: any;
  };
  viewTemplate?: any;
  properties?: Record<string, any>;
}

export const parseLayerSchemaToForm = (
  data: LayerSchema
): LayerSchemaFormValues => {
  const {
    origin,
    name,
    type,
    index,
    minZoom,
    maxZoom,
    getFillColorPropName,
    groupId,
    colors,
    clickAction,
    viewTemplate,
    properties,
  } = data;

  // Extract base URL from origin
  const urlParts = origin.split("?");
  const url = urlParts[0];

  // Reconstruct selectedLayer from origin params if possible
  let selectedLayer = undefined;
  let version = "1.0.0";
  let srs = "EPSG:4326";

  if (urlParts[1]) {
    const params = new URLSearchParams(urlParts[1]);
    // Actually URLSearchParams keys are case sensitive. WMS keys are case insensitive but usually uppercase in generated URLs.
    
    // Check various casing for LAYERS/layers/typeName
    const name = params.get("typeName") || params.get("layers") || params.get("LAYERS");

    if (name) {
      selectedLayer = {
        name: name,
        title: data.name || name,
      };
    }

    // Extract version
    version = params.get("version") || params.get("VERSION") || properties?.version || "1.0.0";

    // Extract SRS
    srs = params.get("srsName") || params.get("SRS") || params.get("CRS") || properties?.srs || "EPSG:4326";
  } else {
    // Fallback if URL params are missing (e.g. cleaned WMS URL), check properties
    if (properties?.version) version = properties.version;
    if (properties?.srs) srs = properties.srs;
    
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
    }
  > = {};

  colors.forEach((c) => {
    const key = c.value || c.label || `default-${c.type}`;
    if (!colorGroups[key]) {
      colorGroups[key] = {
        label: c.label === "default" ? "" : c.label || "",
        value: c.value || "",
        pattern: c.pattern || "full",
        patternConfig: c.patternConfig,
      };
    } else if (c.patternConfig && !colorGroups[key].patternConfig) {
      colorGroups[key].patternConfig = c.patternConfig;
    }

    const alpha = c.color[3] !== undefined ? c.color[3] : 255;
    const colorWithAlpha = [
      c.color[0],
      c.color[1],
      c.color[2],
      alpha > 1 ? alpha / 255 : alpha, // Convert back to 0-1 range for the form
    ];

    if (c.type === LayerSchemaColorTypeEnum.FILL) {
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
    const fill = group.fillColor || [255, 0, 0, 0.5];
    return {
      fillColor: fill,
      borderColor: group.borderColor || fill, // Fallback to fill if missing
      textColor: group.textColor || fill, // Fallback to fill if missing
      pattern: group.pattern,
      patternConfig: group.patternConfig,
      label: group.label,
      value: group.value,
    };
  });

  let loadingMethod = "GeoJsonLayer";
  if (type === "CustomWMSLayer") loadingMethod = "CustomWMSLayer";
  if (type === "Stream") loadingMethod = "Stream";

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

  return {
    url,
    selectedLayer,
    origin,
    loadingMethod,
    version,
    srs,
    groupId: groupId || "geral",
    layerName: name,
    index,
    minZoom: finalMinZoom?.toString() || "",
    maxZoom: finalMaxZoom?.toString() || "",
    clickAction: formClickAction as any,
    clickActionParams: formClickActionParams,
    viewTemplate: viewTemplate ? JSON.stringify(viewTemplate, null, 2) : "",
    isActive: data.isActive ?? true,
    isVisible: data.isVisible ?? true,
    isDynamic: !!getFillColorPropName,
    layerProperty: getFillColorPropName || "",
    colors: formColors,
    propertyMapping: normalizedMapping,
  };
};
