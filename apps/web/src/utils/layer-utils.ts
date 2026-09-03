import { Calendar, Hash, Type, CheckSquare } from "lucide-react";
import {
  IGetConfigLayerGroup,
  IGetConfigLayerSchema,
} from "../types/fetch-map-config-type";

export const flattenLayerGroups = (
  groups: IGetConfigLayerGroup[],
): IGetConfigLayerGroup[] => {
  let result: IGetConfigLayerGroup[] = [];

  for (const group of groups) {
    result.push(group);
    if (group.childGroups && group.childGroups.length > 0) {
      result = result.concat(flattenLayerGroups(group.childGroups));
    }
  }

  return result;
};

export const getLayerNameFromConfig = (
  config: IGetConfigLayerSchema | any,
): string | null => {
  if (!config) return null;

  // 1. Try explicit properties on config
  const props = config.properties || {};
  const directName =
    props.typeName ||
    props.type_name ||
    props.layers ||
    props.wms?.layers;
  if (directName && typeof directName === "string" && directName.trim().length > 0) {
    return directName.trim();
  }

  // 2. Try to extract from origin or source URL query params
  const origin = config.origin || props.source?.url;
  if (origin && typeof origin === "string") {
    const match = origin.match(/[?&](typeName|type_name|typename|layers|layer|LAYERS)=([^&]+)/i);
    if (match && match[2]) {
      return decodeURIComponent(match[2]).trim();
    }
  }

  // 3. Fallback to id if it contains a workspace prefix (e.g. "slui:terras_indigenas")
  if (config.id && typeof config.id === "string" && config.id.includes(":")) {
    return config.id.trim();
  }

  return null;
};

export const normalizeTerm = (term: string) => {
  return term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const getColumnType = (
  binding: string,
): "text" | "number" | "date" | "boolean" | null => {
  if (!binding) return "text";
  const lower = binding.toLowerCase();
  if (
    lower.includes("long") ||
    lower.includes("integer") ||
    lower.includes("double") ||
    lower.includes("decimal") ||
    lower.includes("bigdecimal") ||
    lower.includes("biginteger") ||
    lower.includes("bigint") ||
    lower.includes("float") ||
    lower.includes("short") ||
    lower.includes("byte") ||
    lower.includes("numeric") ||
    lower.includes("number")
  )
    return "number";
  if (
    lower.includes("date") ||
    lower.includes("time") ||
    lower.includes("timestamp")
  )
    return "date";
  if (lower.includes("boolean") || lower.includes("bool")) return "boolean";
  if (lower.includes("string") || lower.includes("text") || lower.includes("char")) return "text";
  return "text";
};

export const getIcon = (type: string) => {
  switch (type) {
    case "number":
      return Hash;
    case "date":
      return Calendar;
    case "boolean":
      return CheckSquare;
    default:
      return Type;
  }
};
