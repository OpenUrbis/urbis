import { calculateCenterId } from "../hooks/useMapContext";

export const createFn = (strFn: string, skipError = true) => {
  try {
    const fn = new Function("utils", `return ${strFn}`);
    return fn({ calculateCenterId });
  } catch (error) {
    console.error("Error creating function from string:", strFn, error);
    return skipError ? () => {} : undefined;
  }
};
