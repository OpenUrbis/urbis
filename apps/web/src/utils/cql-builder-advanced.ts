import { FilterNode, FilterGroup, FilterCondition } from "../components/FilterBuilder/types";

export const filterNodeToCQL = (node: FilterNode): string => {
  if (node.type === "condition") {
    return conditionToCQL(node);
  } else if (node.type === "group") {
    return groupToCQL(node);
  }
  return "";
};

const conditionToCQL = (condition: FilterCondition): string => {
  const { field, operator, value } = condition;
  if (!field) return "";
  
  if (operator === "IS NULL") {
    return `${field} IS NULL`;
  }
  
  // Handle text search operators
  if (operator === "LIKE") {
      return `${field} LIKE '%${value}%'`;
  }
  
  if (operator === "ILIKE") {
      return `${field} ILIKE '%${value}%'`;
  }
  
  // Handle values
  let formattedValue = value;

  // Robust check for numeric value
  const isNumber =
    (typeof value === "number" && !isNaN(value)) ||
    (typeof value === "string" &&
      value.trim() !== "" &&
      !isNaN(Number(value)) &&
      isFinite(Number(value)));

  if (!isNumber) {
    // If it's an object (like null or a real object) and we try to concat it with a string,
    // it might trigger the "Cannot convert object to primitive value" if it's a Symbol or a weird object.
    // We ensure it's a string here.
    formattedValue = `'${String(value ?? "").replace(/'/g, "''")}'`;
  }

  return `${field} ${operator} ${formattedValue}`;
};

const groupToCQL = (group: FilterGroup): string => {
  const { operator, children } = group;
  if (children.length === 0) return "";
  
  const childCQLs = children
    .map(filterNodeToCQL)
    .filter((cql) => cql.length > 0);
    
  if (childCQLs.length === 0) return "";
  
  // If single child, usually no parens needed unless nested logic requires?
  // But grouping implies parens for safety.
  // However, simple case: (A). Same as A.
  // Complex: (A OR B).
  if (childCQLs.length === 1) return childCQLs[0];
  
  const combined = childCQLs.join(` ${operator} `);
  return `(${combined})`;
};
