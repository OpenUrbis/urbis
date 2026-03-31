import * as z from "zod";

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
    })
    .optional(),
});

const step2Schema = z.object({
  loadingMethod: z.string().min(1, "Selecione o método de carregamento"),
  urlParameterType: z.enum(["WFS", "WMS"]),
  origin: z.string().url("Insira uma URL válida"),
  groupId: z.string().min(1, "Selecione um grupo"),
  layerName: z.string().min(1, "Insira o nome da camada"),
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
});

const step2_5Schema = z
  .object({
    viewTemplate: z.string().optional(),
  })
  .refine((data) => {
    // We can't access clickAction from previous step here easily in z.object().refine
    // Validation logic will need to check the combined data or be handled in the step component/index
    return true;
  });

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
      message: "Informe o atributo para classificação",
      path: ["layerProperty"],
    }
  );

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
});

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
  parameterType: "WFS" | "WMS"
) => {
  // Extract base URL
  let baseUrl = url;
  try {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;

    // Adjust endpoint based on service type
    if (parameterType === "WMS") {
      // Replace /ows or /wfs with /wms
      pathname = pathname.replace(/\/ows\/?$/, "/wms");
      pathname = pathname.replace(/\/wfs\/?$/, "/wms");
    } else {
      // WFS: Replace /wms with /ows (or /wfs if preferred, but examples use /ows)
      pathname = pathname.replace(/\/wms\/?$/, "/ows");
    }

    baseUrl = `${urlObj.origin}${pathname}`;
  } catch (e) {
    // Keep original URL if parsing fails
  }

  const params = new URLSearchParams();

  if (parameterType === "WMS") {
    params.set("LAYERS", selectedLayer?.name || "");
    params.set("FORMAT", "image/jpeg");
    params.set("TRANSPARENT", "true");
  } else {
    // WFS
    params.set("service", "WFS");
    params.set("version", "1.0.0");
    params.set("request", "GetFeature");
    params.set("typeName", selectedLayer?.name || "");
    params.set("maxFeatures", "10000");
    params.set("outputFormat", "json");
    params.set("srsName", "EPSG:4326");
  }

  return `${baseUrl}?${params.toString()}`;
};

export const buildLayerSchema = (data: LayerSchemaFormValues) => {
  const {
    url,
    selectedLayer,
    loadingMethod,
    urlParameterType,
    origin,
    groupId,
    layerName,
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
    origin || generateOriginUrl(url, selectedLayer, urlParameterType);

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

  const transformedColors = colors.flatMap((c) => {
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
          color: fillColor,
        },
      ];
    }

    return [
      {
        ...common,
        type: LayerSchemaColorTypeEnum.FILL,
        pattern: c.pattern && c.pattern !== "full" ? c.pattern : undefined,
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

  return {
    id,
    name: layerName,
    origin: finalOrigin,
    isActive,
    isVisible,
    type,
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
    },
  };
};

export interface LayerSchemaColor {
  type: LayerSchemaColorTypeEnum;
  color: number[];
  label?: string;
  value?: string;
  pattern?: string;
}

export interface LayerSchema {
  origin: string;
  name: string;
  type: string;
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

  let urlParameterType: "WFS" | "WMS" = "WFS";
  let selectedLayer = undefined;

  if (urlParts[1]) {
    const params = new URLSearchParams(urlParts[1]);
    const typeName = params.get("typeName");
    const layers = params.get("LAYERS");

    if (layers) {
      urlParameterType = "WMS";
      selectedLayer = {
        name: layers,
        title: name || layers,
      };
    } else if (typeName) {
      urlParameterType = "WFS";
      selectedLayer = {
        name: typeName,
        title: name || typeName,
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
      };
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
      label: group.label,
      value: group.value,
    };
  });

  let loadingMethod = "GeoJsonLayer";
  if (type === "CustomWMSLayer") loadingMethod = "CustomWMSLayer";
  if (type === "Stream") loadingMethod = "Stream";

  // Infer parameter type if not detected from URL (fallback)
  if (!urlParameterType && loadingMethod === "CustomWMSLayer") {
    // If it was CustomWMSLayer but no params detected, default to WMS?
    // Or maybe the user used WFS params for CustomWMSLayer (as in the example).
    // The previous logic for urlParameterType detection handles the content.
    // If explicit params were found, urlParameterType is set.
    // If not found, default to WFS is safe or we can check loadingMethod.
  }

  let formClickAction = "none";
  let formClickActionParams = {};

  if (clickAction?.action) {
    // @ts-ignore
    formClickAction = clickAction.action;

    if (clickAction.action === "setZoom") {
      // @ts-ignore
      formClickActionParams = {
        zoom:
          clickAction.zoom?.toString() || clickAction.params?.zoom?.toString(),
      };
    } else if (clickAction.action === "openFeature") {
      // @ts-ignore
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

  return {
    url,
    selectedLayer,
    origin,
    loadingMethod,
    urlParameterType,
    groupId: groupId || "geral",
    layerName: name,
    minZoom: minZoom?.toString() || "",
    maxZoom: maxZoom?.toString() || "",
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
