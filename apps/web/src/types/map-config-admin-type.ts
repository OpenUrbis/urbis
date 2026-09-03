export enum MapConfigValueType {
  LITERAL_NUMBER = "literal-number",
  LITERAL_STRING = "literal-string",
  ARRAY = "array",
  OBJECT = "object",
  VIEW_TEMPLATE = "view-template",
}

export interface IMapConfigAdminItem {
  id: string;
  description: string;
  type: MapConfigValueType;
  value: unknown;
}

export interface IUpdateMapConfigPayload {
  description: string;
  value: unknown;
}
