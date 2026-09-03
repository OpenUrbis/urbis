import {
  FilterNode,
  FilterGroup,
  FilterCondition,
} from "../components/FilterBuilder/types";
import { FilterField } from "../components/FilterBuilder";

export type AttributeType = "text" | "number" | "date" | "boolean";
export type FieldTypeMap = Record<string, AttributeType>;

const buildFieldsMap = (
  fields?: FilterField[] | { name: string; type: any }[] | FieldTypeMap
): FieldTypeMap => {
  if (!fields) return {};
  if (Array.isArray(fields)) {
    const map: FieldTypeMap = {};
    for (const f of fields) {
      if (f && f.name) {
        map[f.name] = (f.type as AttributeType) || "text";
      }
    }
    return map;
  }
  return fields;
};

export const filterNodeToCQL = (
  node: FilterNode,
  fields?: FilterField[] | { name: string; type: any }[] | FieldTypeMap
): string => {
  const fieldsMap = buildFieldsMap(fields);
  return convertNodeToCQL(node, fieldsMap);
};

const convertNodeToCQL = (
  node: FilterNode,
  fieldsMap: FieldTypeMap
): string => {
  if (node.type === "condition") {
    return conditionToCQL(node, fieldsMap);
  } else if (node.type === "group") {
    return groupToCQL(node, fieldsMap);
  }
  return "";
};

const conditionToCQL = (
  condition: FilterCondition,
  fieldsMap: FieldTypeMap
): string => {
  const { field, operator, value } = condition;
  if (!field) return "";

  if (operator === "IS NULL") {
    return `${field} IS NULL`;
  }

  const rawType = condition.fieldType || fieldsMap[field];
  const fieldType = rawType || inferFieldType(operator, value);

  const escapeQuotes = (val: any) =>
    String(val ?? "").replace(/'/g, "''");

  // Operators ILIKE and LIKE are string-specific
  if (operator === "LIKE") {
    return `${field} LIKE '%${escapeQuotes(value)}%'`;
  }

  if (operator === "ILIKE") {
    return `${field} ILIKE '%${escapeQuotes(value)}%'`;
  }

  if (fieldType === "number") {
    if (value === "" || value === null || value === undefined) return "";
    const num = Number(value);
    if (isNaN(num)) return "";
    return `${field} ${operator} ${num}`;
  }

  if (fieldType === "boolean") {
    const boolVal = String(value).toLowerCase() === "true" || value === true;
    return `${field} ${operator} ${boolVal ? "TRUE" : "FALSE"}`;
  }

  if (fieldType === "date") {
    if (!value) return "";
    return `${field} ${operator} '${escapeQuotes(value)}'`;
  }

  // Default / "text"
  if (value === "" || value === null || value === undefined) return "";
  return `${field} ${operator} '${escapeQuotes(value)}'`;
};

const inferFieldType = (
  operator: string,
  value: any
): AttributeType => {
  if (operator === "LIKE" || operator === "ILIKE") return "text";
  if (typeof value === "boolean") return "boolean";
  return "text";
};

const groupToCQL = (
  group: FilterGroup,
  fieldsMap: FieldTypeMap
): string => {
  const { operator, children } = group;
  if (!children || children.length === 0) return "";

  const childCQLs = children
    .map((child) => convertNodeToCQL(child, fieldsMap))
    .filter((cql) => cql.length > 0);

  if (childCQLs.length === 0) return "";

  if (childCQLs.length === 1) return childCQLs[0];

  const combined = childCQLs.join(` ${operator} `);
  return `(${combined})`;
};
