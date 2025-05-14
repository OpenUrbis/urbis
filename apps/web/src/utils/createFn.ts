import { calculateCenterId } from "../hooks/useMapContext";

export const createFn = (strFn: string, skipError = true) => {
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

  try {
    const fn = new Function("utils", `return ${cleanedStrFn}`);
    return fn({ calculateCenterId });
  } catch (error) {
    console.error(
      "Error creating function from string:",
      { strFn, cleanedStrFn },
      error
    );
    return skipError ? () => {} : undefined;
  }
};
