import { Calendar, Hash, Type } from "lucide-react";
import { IGetConfigLayerGroup, IGetConfigLayerSchema } from "../types/fetch-map-config-type";

export const flattenLayerGroups = (groups: IGetConfigLayerGroup[]): IGetConfigLayerGroup[] => {
  let result: IGetConfigLayerGroup[] = [];
  
  for (const group of groups) {
    result.push(group);
    if (group.childGroups && group.childGroups.length > 0) {
      result = result.concat(flattenLayerGroups(group.childGroups));
    }
  }
  
  return result;
};

export const getLayerNameFromConfig = (config: IGetConfigLayerSchema | any): string | null => {
    // Try to get from origin
    const origin = config?.origin || config.origin;
    if (origin) {
        const match = origin.match(/[?&](typeName|LAYERS)=([^&]+)/);
        if (match) {
            return decodeURIComponent(match[2]);
        }
    }
    return null;
}

export const normalizeTerm = (term: string) => {
  return term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const getColumnType = (binding: string): "text" | "number" | "date" | null => {
  if (binding.includes("String")) return "text";
  if (
    binding.includes("Long") ||
    binding.includes("Integer") ||
    binding.includes("Double") ||
    binding.includes("BigDecimal") ||
    binding.includes("Float")
  )
    return "number";
  if (binding.includes("Date") || binding.includes("Timestamp")) return "date";
  return "text";
};

export const getIcon = (type: string) => {
    switch (type) {
        case 'number': return Hash;
        case 'date': return Calendar;
        default: return Type;
    }
}
