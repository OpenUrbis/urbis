import axios from "axios";
import { getAuthHeaders } from "../utils/auth-headers";

export type AttributeType = "text" | "number" | "date" | "boolean";

export interface LayerAttribute {
  name: string;
  type: AttributeType;
}

const GEOMETRY_ATTRIBUTE_NAMES = new Set([
  "geom",
  "geometry",
  "the_geom",
  "wkb_geometry",
  "shape",
  "geometria",
  "boundingbox",
  "boundedby",
]);

const GEOMETRY_TYPE_HINTS = [
  "gml:",
  "geometry",
  "pointpropertytype",
  "multipointpropertytype",
  "linestringpropertytype",
  "multilinestringpropertytype",
  "polygonpropertytype",
  "multipolygonpropertytype",
  "surfacepropertytype",
  "multisurfacepropertytype",
  "curvepropertytype",
  "multicurvepropertytype",
];

const isGeometryAttribute = (element: Element, layerName: string) => {
  const name = element.getAttribute("name")?.trim();
  if (!name) return true;

  const rawLayer = layerName.includes(":") ? layerName.split(":")[1] : layerName;
  if (name === layerName || name === rawLayer) return true;

  const normalizedName = name.toLowerCase();
  if (GEOMETRY_ATTRIBUTE_NAMES.has(normalizedName)) return true;

  const type = element.getAttribute("type")?.toLowerCase() ?? "";
  return GEOMETRY_TYPE_HINTS.some((hint) => type.includes(hint));
};

const mapXsdTypeToFilterType = (rawType: string): AttributeType => {
  if (!rawType) return "text";
  const clean = rawType.toLowerCase().split(":").pop() || rawType.toLowerCase();

  switch (clean) {
    case "int":
    case "integer":
    case "long":
    case "short":
    case "decimal":
    case "float":
    case "double":
    case "byte":
    case "bigint":
    case "biginteger":
    case "big_integer":
    case "bigdecimal":
    case "big_decimal":
    case "numeric":
    case "real":
    case "smallint":
    case "tinyint":
    case "nonnegativeinteger":
    case "positiveinteger":
    case "nonpositiveinteger":
    case "negativeinteger":
    case "unsignedint":
    case "unsignedlong":
    case "unsignedshort":
    case "unsignedbyte":
    case "number":
      return "number";

    case "date":
    case "datetime":
    case "time":
    case "gyear":
    case "gyearmonth":
    case "timestamp":
      return "date";

    case "boolean":
    case "bool":
      return "boolean";

    default:
      if (
        clean.includes("int") ||
        clean.includes("number") ||
        clean.includes("numeric") ||
        clean.includes("decimal") ||
        clean.includes("float") ||
        clean.includes("double")
      ) {
        return "number";
      }
      return "text";
  }
};

const extractServiceException = (xmlDoc: Document): string | null => {
  const exceptions = xmlDoc.getElementsByTagNameNS("*", "ServiceException");
  if (exceptions.length > 0) {
    return exceptions[0].textContent?.trim() || "ServiceException reported by GeoServer";
  }
  const exceptionTexts = xmlDoc.getElementsByTagNameNS("*", "ExceptionText");
  if (exceptionTexts.length > 0) {
    return exceptionTexts[0].textContent?.trim() || "Exception reported by GeoServer";
  }
  return null;
};

const parseAttributeFromElement = (
  element: Element,
  layerName: string,
): LayerAttribute | null => {
  const name = element.getAttribute("name");
  if (!name || isGeometryAttribute(element, layerName)) {
    return null;
  }

  let rawType = element.getAttribute("type") || "";
  if (!rawType) {
    const restrictions = element.getElementsByTagNameNS("*", "restriction");
    if (restrictions.length > 0) {
      rawType = restrictions[0].getAttribute("base") || "";
    }
  }

  return {
    name,
    type: mapXsdTypeToFilterType(rawType),
  };
};

export const parseAttributesFromXSD = (
  xmlDoc: Document,
  layerName: string,
): LayerAttribute[] => {
  const exception = extractServiceException(xmlDoc);
  if (exception) {
    throw new Error(exception);
  }

  const foundAttributes: LayerAttribute[] = [];

  const sequences = xmlDoc.getElementsByTagNameNS("*", "sequence");
  for (let s = 0; s < sequences.length; s++) {
    const seqElements = sequences[s].children;
    for (let i = 0; i < seqElements.length; i++) {
      if (seqElements[i].localName === "element") {
        const attr = parseAttributeFromElement(seqElements[i], layerName);
        if (attr) {
          foundAttributes.push(attr);
        }
      }
    }
  }

  if (foundAttributes.length === 0) {
    const elements = xmlDoc.getElementsByTagNameNS("*", "element");
    for (let i = 0; i < elements.length; i++) {
      const attr = parseAttributeFromElement(elements[i], layerName);
      if (attr) {
        foundAttributes.push(attr);
      }
    }
  }

  const map = new Map<string, LayerAttribute>();
  for (const attr of foundAttributes) {
    if (!map.has(attr.name)) {
      map.set(attr.name, attr);
    }
  }

  return Array.from(map.values());
};

export const fetchAttributes = async (
  url: string,
  layerName: string,
): Promise<LayerAttribute[]> => {
  if (!url || !layerName) return [];

  const getBaseUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl, window.location.href);
      let clean = `${urlObj.origin}${urlObj.pathname}`;
      if (clean.includes("/geoserver/slui/wms")) {
        clean = clean.replace("/geoserver/slui/wms", "/geoserver/slui/ows");
      }
      return clean;
    } catch {
      if (inputUrl.includes("/geoserver/slui/wms")) {
        return inputUrl.replace("/geoserver/slui/wms", "/geoserver/slui/ows");
      }
      return inputUrl;
    }
  };

  const baseUrl = getBaseUrl(url);
  const environment = (import.meta as any).env?.VITE_API_URL || "/api";
  const headers = await getAuthHeaders().catch(() => ({}));

  const versions = ["2.0.0", "1.1.0", "1.0.0"];
  let lastError: unknown = null;

  for (const version of versions) {
    try {
      const response = await axios.get(`${environment}/maps/proxy`, {
        params: {
          url: `${baseUrl}?service=WFS&version=${version}&request=DescribeFeatureType&typeName=${layerName}`,
        },
        headers,
        timeout: 15000,
      });

      if (typeof response.data === "string" && response.data.trim()) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "text/xml");
        const attributes = parseAttributesFromXSD(xmlDoc, layerName);

        if (attributes.length > 0) {
          return attributes;
        }
      }
    } catch (e: any) {
      lastError = e;
    }
  }

  if (lastError) {
    const message =
      lastError instanceof Error
        ? lastError.message
        : typeof lastError === "string"
        ? lastError
        : JSON.stringify(lastError);
    throw new Error(`Falha ao obter atributos WFS DescribeFeatureType: ${message}`);
  }

  throw new Error(
    `Nenhum atributo encontrado na resposta DescribeFeatureType para a camada ${layerName}`,
  );
};
