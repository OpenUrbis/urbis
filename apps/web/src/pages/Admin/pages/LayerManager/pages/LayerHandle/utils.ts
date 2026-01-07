import * as z from "zod";

export enum LayerSchemaColorTypeEnum {
  TEXT = 'text',
  FILL = 'fill',
  LINE = 'line',
}

// Schema Definitions
const step1Schema = z.object({
  url: z.string().url("Insira uma URL válida"),
  selectedLayer: z.object({
    name: z.string(),
    title: z.string()
  }).optional()
});

const step2Schema = z.object({
  loadingMethod: z.string().min(1, "Selecione o método de carregamento"),
  groupId: z.string().min(1, "Selecione um grupo"),
  layerName: z.string().min(1, "Insira o nome da camada"),
  minZoom: z.string().optional(),
  maxZoom: z.string().optional(),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true)
});

const step3Schema = z.object({
  isDynamic: z.boolean(),
  layerProperty: z.string().optional(),
  colors: z.array(z.any()).min(1, "É necessário configurar pelo menos uma cor")
}).refine((data) => {
  if (data.isDynamic && !data.layerProperty) {
    return false;
  }
  return true;
}, {
  message: "Informe o atributo para classificação",
  path: ["layerProperty"]
});

// Combined schema for form type
export const LayerSchemaFormSchema = step1Schema.merge(step2Schema).merge(step3Schema);

export type LayerSchemaFormValues = z.infer<typeof LayerSchemaFormSchema>;

export const buildLayerSchema = (data: LayerSchemaFormValues) => {
  const {
    url,
    selectedLayer,
    loadingMethod,
    groupId,
    layerName,
    minZoom,
    maxZoom,
    isActive,
    isVisible,
    isDynamic,
    layerProperty,
    colors,
  } = data;

  const id = selectedLayer?.name?.split(":").pop() || "";
  const origin = `${url}?service=WFS&version=1.0.0&request=GetFeature&typeName=${selectedLayer?.name}&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326`;

  let type = "GeoJsonLayer";
  if (loadingMethod === "CustomWMSLayer") type = "CustomWMSLayer";
  if (loadingMethod === "Stream") type = "Stream";

  const transformedColors = colors.flatMap((c) => {
    const common = {
      label: isDynamic ? c.label || c.value : "default",
      value: isDynamic ? c.value : undefined,
    };

    const fillAlpha = Math.round(c.fillColor[3] <= 1 ? c.fillColor[3] * 255 : c.fillColor[3]);
    const lineAlpha = Math.round(c.borderColor[3] <= 1 ? c.borderColor[3] * 255 : c.borderColor[3]);
    const textAlpha = Math.round(c.textColor[3] <= 1 ? c.textColor[3] * 255 : c.textColor[3]);

    const fillColor = [c.fillColor[0], c.fillColor[1], c.fillColor[2], fillAlpha];
    const borderColor = [c.borderColor[0], c.borderColor[1], c.borderColor[2], lineAlpha];
    const textColor = [c.textColor[0], c.textColor[1], c.textColor[2], textAlpha];

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
        }
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
    origin,
    isActive,
    isVisible,
    type,
    minZoom: minZoom ? Number.parseInt(minZoom) : null,
    maxZoom: maxZoom ? Number.parseInt(maxZoom) : null,
    getTextColorPropName: isDynamic ? layerProperty : null,
    getFillColorPropName: isDynamic ? layerProperty : null,
    getLineColorPropName: isDynamic ? layerProperty : null,
    groupId,
    colors: transformedColors,
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
}

export const parseLayerSchemaToForm = (data: LayerSchema): LayerSchemaFormValues => {
  const {
    origin,
    name,
    type,
    minZoom,
    maxZoom,
    getFillColorPropName,
    groupId,
    colors,
  } = data;

  // Extract base URL from origin
  const urlParts = origin.split("?");
  const url = urlParts[0];

  // Reconstruct selectedLayer from origin params if possible
  let selectedLayer = undefined;
  if (urlParts[1]) {
    const params = new URLSearchParams(urlParts[1]);
    const typeName = params.get("typeName") || params.get("LAYERS");
    if (typeName) {
      selectedLayer = {
        name: typeName,
        title: name || typeName,
      };
    }
  }

  // Group colors by label/value to reconstruct form items
  const colorGroups: Record<string, {
    label: string;
    value: string;
    pattern: string;
    fillColor?: number[];
    borderColor?: number[];
    textColor?: number[];
  }> = {};

  colors.forEach((c) => {
    const key = c.value || c.label || `default-${c.type}`;
    if (!colorGroups[key]) {
      colorGroups[key] = {
        label: c.label === "default" ? "" : (c.label || ""),
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

  return {
    url,
    selectedLayer,
    loadingMethod,
    groupId: groupId || "geral",
    layerName: name,
    minZoom: minZoom?.toString() || "",
    maxZoom: maxZoom?.toString() || "",
    isActive: data.isActive ?? true,
    isVisible: data.isVisible ?? true,
    isDynamic: !!getFillColorPropName,
    layerProperty: getFillColorPropName || "",
    colors: formColors,
  };
};
