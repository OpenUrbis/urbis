import { Data as ejsData, render as ejsRender } from "ejs";
import { useMemo } from "preact/compat";
import { ITemplateProps } from "../components/ViewTemplate/types/templates-type";

export function normalizeEjsData(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return {
      properties: {},
      data: {},
      feature: {},
    };
  }

  let rawObj = Array.isArray(data)
    ? { items: data }
    : (data as Record<string, unknown>);

  // If rawObj wraps the feature inside `feature` or `rawData`
  if (
    rawObj.feature &&
    typeof rawObj.feature === "object" &&
    !Array.isArray(rawObj.feature) &&
    (rawObj.feature as Record<string, unknown>).properties
  ) {
    const innerFeat = rawObj.feature as Record<string, unknown>;
    rawObj = {
      ...innerFeat,
      ...(rawObj.response !== undefined ? { response: rawObj.response } : {}),
      ...(rawObj.id && !innerFeat.id ? { id: rawObj.id } : {}),
    };
  } else if (
    rawObj.rawData &&
    typeof rawObj.rawData === "object" &&
    !Array.isArray(rawObj.rawData) &&
    (rawObj.rawData as Record<string, unknown>).properties
  ) {
    const innerRaw = rawObj.rawData as Record<string, unknown>;
    rawObj = {
      ...innerRaw,
      ...(rawObj.response !== undefined ? { response: rawObj.response } : {}),
      ...(rawObj.id && !innerRaw.id ? { id: rawObj.id } : {}),
    };
  }

  const hasNestedProps =
    rawObj.properties &&
    typeof rawObj.properties === "object" &&
    !Array.isArray(rawObj.properties);

  let propsObj = (hasNestedProps
    ? (rawObj.properties as Record<string, unknown>)
    : rawObj) ?? {};

  // If propsObj itself has a nested properties object
  if (
    propsObj.properties &&
    typeof propsObj.properties === "object" &&
    !Array.isArray(propsObj.properties)
  ) {
    propsObj = {
      ...propsObj,
      ...(propsObj.properties as Record<string, unknown>),
    };
  }

  const compositeData = {
    ...propsObj,
    properties: propsObj,
  };

  const featureObj = hasNestedProps
    ? rawObj
    : {
        type: "Feature",
        properties: propsObj,
        ...(rawObj.id ? { id: rawObj.id } : {}),
        ...(rawObj.geometry ? { geometry: rawObj.geometry } : {}),
      };

  const idVal = rawObj.id ?? propsObj.id ?? "";

  return {
    id: idVal,
    ...propsObj,
    ...rawObj,
    properties: propsObj,
    data: compositeData,
    feature: featureObj,
    ...(rawObj.response !== undefined ? { response: rawObj.response } : {}),
  };
}

export const useRenderedValue = ({ template, data }: ITemplateProps) => {
  const value = useMemo(() => {
    const templateValue = template?.value;
    if (!templateValue) return "-";

    try {
      const context = normalizeEjsData(data);
      return ejsRender(templateValue, context as ejsData);
    } catch (err) {
      console.error(
        `Error on render value from ${templateValue} with EJS and data.`,
        data,
        err,
      );
      return "Error on render value";
    }
  }, [template?.value, data]);

  return value;
};
