import { calculateCenterId } from "./calculateCenterId";
import { generateColor } from "./generateColor";
import { calculateZoom } from "./calculateZoom";

export const createFn = (strFn: string, returnEmptyFnIfError = true) => {
  if (typeof strFn !== "string") {
    if (typeof strFn === "function") return strFn;
    return returnEmptyFnIfError ? () => {} : undefined;
  }

  const cleanedStrFn = strFn
    .replace(/[\n\r\t\s]+/g, " ")
    .replace(/\\u003E/g, ">")
    .replace(/\\u003C/g, "<")
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\u00[\dA-F]{2}/g, "")
    .trim();

  if (!cleanedStrFn) {
    return returnEmptyFnIfError ? () => {} : undefined;
  }

  // If it's a simple property identifier (e.g. "vl_altura_estimada_metros", "lote_fiscal")
  if (/^[A-Za-z0-9_]+$/.test(cleanedStrFn)) {
    return (d: any) =>
      d?.properties?.[cleanedStrFn] ?? d?.[cleanedStrFn] ?? cleanedStrFn;
  }

  try {
    const fn = new Function("utils", `return ${cleanedStrFn}`);
    return fn({ calculateCenterId, generateColor, calculateZoom });
  } catch (error) {
    console.error(
      "Error creating function from string:",
      { strFn, cleanedStrFn },
      error,
    );
    return returnEmptyFnIfError ? () => {} : undefined;
  }
};
