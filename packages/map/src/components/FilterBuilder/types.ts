export type FilterOperator = "AND" | "OR";

export type FilterConditionOperator =
  | "="
  | "<>"
  | ">"
  | ">="
  | "<"
  | "<="
  | "LIKE"
  | "ILIKE"
  | "IN"
  | "IS NULL";

export interface FilterCondition {
  id: string;
  type: "condition";
  field: string;
  operator: FilterConditionOperator;
  value: any;
}

export interface FilterGroup {
  id: string;
  type: "group";
  operator: FilterOperator;
  children: (FilterCondition | FilterGroup)[];
}

export type FilterNode = FilterGroup | FilterCondition;
