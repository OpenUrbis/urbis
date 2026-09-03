import { normalizeTerm } from "./layer-utils";

export const filtersToCQL = (filters: any[]): string => {
  if (!filters || filters.length === 0) return "";

  const conditions = filters
    .map((filter) => {
      const { columnId, operator, values, type } = filter;
      const value = values[0];

      const formatValue = (val: any) => {
        if (type === "number") return val;
        if (type === "date") return `'${new Date(val).toISOString()}'`; // Or format as needed by GeoServer
        return `'${String(val).replace(/'/g, "''")}'`;
      };

      switch (operator) {
        // Text
        case "contains":
          return `strToLowerCase(${columnId}) like '%${String(value).replace(/'/g, "''").toLowerCase()}%'`;
        case "does not contain":
          return `not (strToLowerCase(${columnId}) like '%${String(value).replace(/'/g, "''").toLowerCase()}%')`;
        case "similar to":
          // Remove accents and replace single quotes with space to match normalized search term
          // strReplace(string, search, replace, global)
          return `strToLowerCase(strReplace(strStripAccents(${columnId}), '''', ' ', true)) like '%${normalizeTerm(String(value))}%'`;
        case "is":
        case "is (text)": // In case the label differs
          return `${columnId} = ${formatValue(value)}`;
        case "is not":
          return `${columnId} <> ${formatValue(value)}`;
        case "is empty":
          if (type === "number" || type === "date")
            return `${columnId} IS NULL`;
          return `(${columnId} IS NULL OR ${columnId} = '')`;
        case "is not empty":
          if (type === "number" || type === "date")
            return `${columnId} IS NOT NULL`;
          return `(${columnId} IS NOT NULL AND ${columnId} <> '')`;

        // Number
        case "is greater than":
          return `${columnId} > ${value}`;
        case "is greater than or equal to":
          return `${columnId} >= ${value}`;
        case "is less than":
          return `${columnId} < ${value}`;
        case "is less than or equal to":
          return `${columnId} <= ${value}`;
        case "is between":
          return `${columnId} BETWEEN ${values[0]} AND ${values[1]}`;
        case "is not between":
          return `not (${columnId} BETWEEN ${values[0]} AND ${values[1]})`;

        // Date
        case "is before":
          return `${columnId} < ${formatValue(value)}`;
        case "is on or after":
          return `${columnId} >= ${formatValue(value)}`;
        case "is after":
          return `${columnId} > ${formatValue(value)}`;
        case "is on or before":
          return `${columnId} <= ${formatValue(value)}`;

        // Option
        case "is any of":
        case "include any of": {
          const opts = values.map(formatValue).join(", ");
          return `${columnId} IN (${opts})`;
        }
        case "is none of": {
          const notOpts = values.map(formatValue).join(", ");
          return `${columnId} NOT IN (${notOpts})`;
        }

        default:
          console.warn(`Unsupported operator: ${operator}`);
          return "";
      }
    })
    .filter((c) => c !== "");

  return conditions.join(" AND ");
};
