import { ITemplate } from "./types/templates-type";

interface ISemanticTemplateUnit {
  template: ITemplate;
  weight: number;
  preferredColumn?: number;
  sourceIndex: number;
}

export interface ISemanticTemplateGridItem {
  template: ITemplate;
  span: number;
  sourceIndex: number;
}

type ISemanticTemplateUnitDraft = Omit<ISemanticTemplateUnit, "sourceIndex">;

const DEFAULT_COLUMN_COUNT = 3;
const SEMANTIC_WEIGHT_KEYS = [
  "semanticCardWeight",
  "printColumnWeight",
] as const;
const SEMANTIC_COLUMN_KEYS = ["semanticColumn", "printColumn"] as const;
const SEMANTIC_SPAN_KEYS = ["semanticSpan", "printSpan"] as const;

const getTemplateProperties = (template: ITemplate) => {
  return (template.properties ?? {}) as Record<string, unknown>;
};

const getCustomTemplateWeight = (template: ITemplate) => {
  const properties = getTemplateProperties(template);

  for (const key of SEMANTIC_WEIGHT_KEYS) {
    const value = properties[key];

    if (typeof value === "number" && Number.isFinite(value) && value > 0)
      return value;
  }

  return undefined;
};

const getCustomTemplateColumn = (template: ITemplate) => {
  const properties = getTemplateProperties(template);

  for (const key of SEMANTIC_COLUMN_KEYS) {
    const value = properties[key];

    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      return value;
    }
  }

  return undefined;
};

const getCustomTemplateSpan = (template: ITemplate) => {
  const properties = getTemplateProperties(template);

  for (const key of SEMANTIC_SPAN_KEYS) {
    const value = properties[key];

    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      return Math.min(12, Math.max(1, value));
    }
  }

  return undefined;
};

const hasDescendantType = (
  template: ITemplate,
  targetType: string,
): boolean => {
  if (template.type === targetType) return true;

  return (template.templates ?? []).some((childTemplate) =>
    hasDescendantType(childTemplate, targetType),
  );
};

const estimateTemplateWeight = (template: ITemplate): number => {
  const customWeight = getCustomTemplateWeight(template);

  if (customWeight) return customWeight;

  let weight = 1;

  if (hasDescendantType(template, "wrapper-tabs")) weight += 2;

  return weight;
};

const buildSemanticRequestUnit = (
  requestTemplate: ITemplate,
  childTemplate: ITemplate,
  index: number,
  sourceIndex: number,
): ISemanticTemplateUnit => {
  const requestUnitId =
    childTemplate.id ?? childTemplate.label ?? String(index);

  return {
    template: {
      ...requestTemplate,
      id: `${requestTemplate.id ?? requestTemplate.type}-${requestUnitId}`,
      properties: {
        ...(requestTemplate.properties ?? {}),
        ...(childTemplate.properties ?? {}),
      },
      templates: [childTemplate],
    },
    weight: estimateTemplateWeight(childTemplate),
    preferredColumn: getCustomTemplateColumn(childTemplate),
    sourceIndex,
  };
};

const extractSemanticUnits = (
  templates: ITemplate[],
): ISemanticTemplateUnit[] => {
  const units = templates.reduce<ISemanticTemplateUnitDraft[]>(
    (acc, template) => {
      if (template.type !== "wrapper-request") {
        acc.push({
          template,
          weight: estimateTemplateWeight(template),
          preferredColumn: getCustomTemplateColumn(template),
        });

        return acc;
      }

      const requestTemplates = template.templates ?? [];

      if (!requestTemplates.length) {
        acc.push({
          template,
          weight: estimateTemplateWeight(template),
          preferredColumn: getCustomTemplateColumn(template),
        });

        return acc;
      }

      requestTemplates.forEach((childTemplate, index) => {
        const { sourceIndex: _sourceIndex, ...unit } = buildSemanticRequestUnit(
          template,
          childTemplate,
          index,
          0,
        );

        acc.push(unit);
      });

      return acc;
    },
    [],
  );

  return units.map(
    (unit, index): ISemanticTemplateUnit => ({
      ...unit,
      sourceIndex: index,
    }),
  );
};

const isValidPreferredColumn = (
  preferredColumn: number | undefined,
  columnCount: number,
) =>
  typeof preferredColumn === "number" &&
  preferredColumn >= 1 &&
  preferredColumn <= columnCount;

export const buildSemanticTemplateGridItems = (
  templates: ITemplate[],
  defaultSpan = 4,
): ISemanticTemplateGridItem[] =>
  extractSemanticUnits(templates).map((unit) => ({
    template: unit.template,
    span: getCustomTemplateSpan(unit.template) ?? defaultSpan,
    sourceIndex: unit.sourceIndex,
  }));

export const buildSemanticTemplateColumns = (
  templates: ITemplate[],
  columnCount = DEFAULT_COLUMN_COUNT,
): ITemplate[][] => {
  if (columnCount <= 1) return [templates];

  const units = extractSemanticUnits(templates);

  if (!units.length) {
    return Array.from({ length: columnCount }, () => [] as ITemplate[]);
  }

  const columns = Array.from({ length: columnCount }, () => ({
    weight: 0,
    items: [] as ISemanticTemplateUnit[],
  }));

  const remainingUnits = units
    .filter((unit) => {
      if (!isValidPreferredColumn(unit.preferredColumn, columnCount))
        return true;

      const targetColumn = columns[unit.preferredColumn! - 1];
      targetColumn.items.push(unit);
      targetColumn.weight += unit.weight;

      return false;
    })
    .sort((unitA, unitB) => {
      if (unitB.weight !== unitA.weight) return unitB.weight - unitA.weight;

      return unitA.sourceIndex - unitB.sourceIndex;
    });

  remainingUnits.forEach((unit) => {
    let targetColumnIndex = 0;

    for (let columnIndex = 1; columnIndex < columns.length; columnIndex += 1) {
      const currentColumn = columns[columnIndex];
      const targetColumn = columns[targetColumnIndex];

      if (currentColumn.weight < targetColumn.weight) {
        targetColumnIndex = columnIndex;
        continue;
      }

      if (
        currentColumn.weight === targetColumn.weight &&
        currentColumn.items.length < targetColumn.items.length
      ) {
        targetColumnIndex = columnIndex;
      }
    }

    columns[targetColumnIndex].items.push(unit);
    columns[targetColumnIndex].weight += unit.weight;
  });

  return columns.map((column) =>
    column.items
      .sort((unitA, unitB) => unitA.sourceIndex - unitB.sourceIndex)
      .map((unit) => unit.template),
  );
};
