import { ITemplate } from "@/components/ViewTemplate/types/templates-type";

type TemplateWithPolygon = ITemplate & {
  polygonTemplate?: ITemplate[];
};

const isTemplateArray = (value: unknown): value is TemplateWithPolygon[] => {
  return Array.isArray(value);
};

export const ensureViewTemplateIds = (value: unknown): ITemplate[] => {
  if (!isTemplateArray(value)) {
    return [];
  }

  return value.map((item) => {
    const normalizedItem: TemplateWithPolygon = {
      ...item,
      id: item.id || crypto.randomUUID(),
    };

    if (Array.isArray(item.templates)) {
      normalizedItem.templates = ensureViewTemplateIds(item.templates);
    }

    if (Array.isArray(item.polygonTemplate)) {
      normalizedItem.polygonTemplate = ensureViewTemplateIds(
        item.polygonTemplate,
      );
    }

    return normalizedItem;
  });
};

export const parseAndNormalizeViewTemplate = (value: unknown): ITemplate[] => {
  if (typeof value === "string") {
    try {
      return ensureViewTemplateIds(JSON.parse(value));
    } catch {
      return [];
    }
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return ensureViewTemplateIds([value]);
  }

  return ensureViewTemplateIds(value);
};

export const stringifyNormalizedViewTemplate = (value: unknown): string => {
  return JSON.stringify(parseAndNormalizeViewTemplate(value), null, 2);
};
