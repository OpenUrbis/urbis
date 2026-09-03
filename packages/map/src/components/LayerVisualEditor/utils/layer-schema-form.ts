import * as z from "zod";
import {
  DEFAULT_LAYER_BORDER_COLOR,
  DEFAULT_LAYER_FILL_COLOR,
  DEFAULT_LAYER_FORM_COLOR,
  DEFAULT_LAYER_LINE_WIDTH,
  DEFAULT_LAYER_TEXT_COLOR,
} from "../../../lib/layer-style-defaults";

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

  const normalized = [
    Number(color[0]),
    Number(color[1]),
    Number(color[2]),
    Number(color[3]),
  ];

  return normalized.every(Number.isFinite) ? normalized : undefined;
};

const layerCapabilitySchema = z
  .object({
    name: z.string(),
    title: z.string(),
    crs: z.array(z.string()).optional(),
    bbox: z.array(z.number()).optional(),
    styles: z.array(z.string()).optional(),
  })
  .optional();

export const LayerSchemaFormSchema = z
  .object({
    url: z.string().optional().default(""),
    selectedLayer: layerCapabilitySchema,
    version: z.string().optional().default("1.1.0"),
    srs: z.string().optional().default("EPSG:4326"),
    loadingMethod: z.string().optional().default("GeoJsonLayer"),
    origin: z.string().optional(),
    groupId: z.string().optional().default("geral"),
    layerName: z.string().min(1, "Insira o nome da camada"),
    summaryDescription: z.string().optional(),
    sourceParameters: z.string().optional(),
    legisLinks: z.string().optional(),
    ckanMetadataUrl: z.string().optional(),
    index: optionalNonNegativeNumber("Ordenação"),
    minZoom: optionalNonNegativeNumberString("Zoom mínimo"),
    maxZoom: optionalNonNegativeNumberString("Zoom máximo"),
    clickAction: z
      .enum(["SelectFeature", "setZoom", "openFeature", "none"])
      .optional()
      .default("none"),
    clickActionParams: z
      .object({
        zoom: optionalNonNegativeNumberString("Zoom da ação"),
        template: z.string().optional(),
      })
      .optional(),
    isActive: z.boolean().optional().default(true),
    isSelected: z.boolean().optional().default(false),
    isVisible: z.boolean().optional().default(true),
    isDynamic: z.boolean().optional().default(false),
    layerProperty: z.string().optional(),
    lineWidth: z.coerce
      .number()
      .min(0.1, "Informe uma espessura maior que zero")
      .optional()
      .default(DEFAULT_LAYER_LINE_WIDTH),
    hoverColor: z.array(z.number()).optional(),
    selectedColor: z.array(z.number()).optional(),
    label: z
      .object({
        enabled: z.boolean(),
        property: z.string().optional(),
        minZoom: optionalNonNegativeNumberString("Zoom mínimo do rótulo"),
        size: optionalNonNegativeNumber("Tamanho do texto"),
        color: hexColorSchema.optional(),
        haloColor: hexColorSchema.optional(),
        haloWidth: optionalNonNegativeNumber("Largura do contorno"),
      })
      .optional(),
    colors: z
      .array(z.any())
      .min(1, "É necessário configurar pelo menos uma cor"),
    propertyMapping: z.record(z.string(), z.any()).optional(),
    viewTemplate: z.string().optional(),
    boardTemplate: z.string().optional(),
  })
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
  )
  .refine((data) => !data.label?.enabled || Boolean(data.label.property), {
    message: "Informe o atributo usado como texto",
    path: ["label", "property"],
  })
  .refine((data) => !data.isDynamic || Boolean(data.layerProperty), {
    message: "Informe o atributo para classificação",
    path: ["layerProperty"],
  });

export type LayerSchemaFormValues = z.infer<typeof LayerSchemaFormSchema>;

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
  const finalOrigin = origin || url || "";
  const type =
    loadingMethod === "CustomWMSLayer"
      ? "CustomWMSLayer"
      : loadingMethod || "GeoJsonLayer";

  let clickActionObj:
    | { action: string; params: Record<string, unknown> }
    | undefined;
  if (clickAction && clickAction !== "none") {
    clickActionObj = { action: clickAction, params: {} };
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
  const normalizedLabelSize = parseOptionalNonNegativeNumber(label?.size);
  const normalizedLabelHaloWidth = parseOptionalNonNegativeNumber(
    label?.haloWidth,
  );
  const labelSchema = label?.enabled
    ? {
        enabled: true,
        property: label.property,
        minZoom: normalizedLabelMinZoom,
        size: normalizedLabelSize,
        color: label.color,
        haloColor: label.haloColor,
        haloWidth: normalizedLabelHaloWidth,
      }
    : label
      ? { enabled: false }
      : undefined;

  const sourceColors =
    Array.isArray(colors) && colors.length > 0
      ? colors
      : [DEFAULT_LAYER_FORM_COLOR];

  const transformedColors = sourceColors.flatMap((c: any) => {
    const common = {
      label: isDynamic ? c.label || c.value : "default",
      value: isDynamic ? c.value : undefined,
      legisUrl: isDynamic ? c.legisUrl?.trim() || undefined : undefined,
    };

    const fillColor = normalizeColorArray(
      c.fillColor ?? c.color,
      DEFAULT_LAYER_FILL_COLOR,
    ).map((value, index) =>
      index === 3 && value <= 1 ? Math.round(value * 255) : value,
    );
    const defaultBorder = isDynamic
      ? (c.fillColor ?? c.color ?? DEFAULT_LAYER_FILL_COLOR)
      : DEFAULT_LAYER_BORDER_COLOR;
    const borderColor = normalizeColorArray(
      c.borderColor ?? c.color,
      defaultBorder,
    ).map((value, index) =>
      index === 3 && value <= 1 ? Math.round(value * 255) : value,
    );
    const textColor = normalizeColorArray(
      c.textColor,
      DEFAULT_LAYER_TEXT_COLOR,
    ).map((value, index) =>
      index === 3 && value <= 1 ? Math.round(value * 255) : value,
    );

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
      { ...common, type: LayerSchemaColorTypeEnum.LINE, color: borderColor },
      { ...common, type: LayerSchemaColorTypeEnum.TEXT, color: textColor },
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
    type,
    index: normalizedIndex,
    minZoom: normalizedMinZoom ?? null,
    maxZoom: normalizedMaxZoom ?? null,
    getTextColorPropName: isDynamic ? layerProperty : null,
    getFillColorPropName: isDynamic ? layerProperty : null,
    getLineColorPropName: isDynamic ? layerProperty : null,
    groupId,
    ...(labelSchema ? { label: labelSchema } : {}),
    clickAction: clickActionObj,
    viewTemplate: viewTemplate ? JSON.parse(viewTemplate) : undefined,
    boardTemplate: boardTemplate ? JSON.parse(boardTemplate) : undefined,
    colors: transformedColors,
    properties: {
      attributeMapping: propertyMapping,
      metadata: {
        summaryDescription: summaryDescription?.trim() || "",
        sourceParameters: sourceParameters?.trim() || "",
        legisLinks: legisLinks?.trim() || "",
        ckanMetadataUrl: ckanMetadataUrl?.trim() || "",
      },
      getLineWidth: normalizedLineWidth,
      ...(normalizedHoverColor || normalizedSelectedColor
        ? {
            visualState: {
              ...(normalizedHoverColor
                ? { hoverColor: normalizedHoverColor }
                : {}),
              ...(normalizedSelectedColor
                ? { selectedColor: normalizedSelectedColor }
                : {}),
            },
          }
        : {}),
      version,
      srs,
      typeName: selectedLayer?.name,
      maxZoom: normalizedMaxZoom,
    },
  };

  if (type === "CustomWMSLayer") {
    schema.properties.wms = {
      url: finalOrigin,
      layers: selectedLayer?.name || "",
      version: version || "1.3.0",
      transparent: true,
      format: "image/png",
    };

    if (!schema.clickAction) {
      schema.clickAction = { action: "info", params: {} };
    }
  }

  return schema;
};

export const parseLayerSchemaToForm = (data: any): LayerSchemaFormValues => {
  const visualState = data.properties?.visualState ?? {};
  const firstFillColor = data.colors?.find(
    (color: any) => color.type === LayerSchemaColorTypeEnum.FILL,
  );
  const firstLineColor = data.colors?.find(
    (color: any) => color.type === LayerSchemaColorTypeEnum.LINE,
  );
  const firstTextColor = data.colors?.find(
    (color: any) => color.type === LayerSchemaColorTypeEnum.TEXT,
  );

  return {
    url: data.origin || data.properties?.wms?.url || "",
    selectedLayer: {
      name:
        data.properties?.wms?.layers || data.properties?.typeName || data.name,
      title: data.name,
    },
    version:
      data.properties?.version || data.properties?.wms?.version || "1.1.0",
    srs: data.properties?.srs || "EPSG:4326",
    loadingMethod: data.type || "GeoJsonLayer",
    origin: data.origin || "",
    groupId: data.groupId || "geral",
    layerName: data.name || "",
    summaryDescription:
      data.description || data.properties?.metadata?.summaryDescription || "",
    sourceParameters: data.properties?.metadata?.sourceParameters || "",
    legisLinks: data.properties?.metadata?.legisLinks || "",
    ckanMetadataUrl: data.properties?.metadata?.ckanMetadataUrl || "",
    index: data.index,
    minZoom: data.minZoom == null ? "" : String(data.minZoom),
    maxZoom: data.maxZoom == null ? "" : String(data.maxZoom),
    clickAction: data.clickAction?.action || "none",
    clickActionParams: data.clickAction?.params || {},
    isActive: data.isActive ?? true,
    isSelected: data.isSelected ?? false,
    isVisible: data.isVisible ?? true,
    isDynamic: Boolean(
      data.getFillColorPropName ||
      data.getLineColorPropName ||
      data.getTextColorPropName,
    ),
    layerProperty:
      data.getFillColorPropName ||
      data.getLineColorPropName ||
      data.getTextColorPropName ||
      "",
    lineWidth: data.properties?.getLineWidth ?? DEFAULT_LAYER_LINE_WIDTH,
    hoverColor: visualState.hoverColor,
    selectedColor: visualState.selectedColor,
    label: {
      enabled: Boolean(data.label?.enabled),
      property: data.label?.property || "",
      minZoom: data.label?.minZoom == null ? "" : String(data.label.minZoom),
      size: data.label?.size,
      color: data.label?.color,
      haloColor: data.label?.haloColor,
      haloWidth: data.label?.haloWidth,
    },
    colors: [
      {
        fillColor: firstFillColor?.color ?? [...DEFAULT_LAYER_FILL_COLOR],
        borderColor:
          firstLineColor?.color ??
          firstFillColor?.color ??
          [...DEFAULT_LAYER_BORDER_COLOR],
        textColor: firstTextColor?.color ?? [...DEFAULT_LAYER_TEXT_COLOR],
        pattern: firstFillColor?.pattern ?? "full",
        patternConfig: firstFillColor?.patternConfig,
      },
    ],
    propertyMapping: data.properties?.attributeMapping,
    viewTemplate: data.viewTemplate
      ? JSON.stringify(data.viewTemplate)
      : undefined,
    boardTemplate: data.boardTemplate
      ? JSON.stringify(data.boardTemplate)
      : undefined,
  } as LayerSchemaFormValues;
};
