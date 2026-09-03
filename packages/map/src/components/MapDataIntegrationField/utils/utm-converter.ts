// packages/map/src/components/MapDataIntegrationField/utils/utm-converter.ts
import proj4 from "proj4";

// Define explicitamente as projeções para garantir compatibilidade
const utm23s =
  "+proj=utm +zone=23 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const wgs84 = "EPSG:4326";

/**
 * Converte coordenadas UTM (Easting, Northing) para [Longitude, Latitude]
 */
export function utmToLatLng(
  easting: number,
  northing: number,
): [number, number] {
  try {
    const e = typeof easting === "number" ? easting : Number(easting);
    const n = typeof northing === "number" ? northing : Number(northing);
    if (isNaN(e) || isNaN(n)) return [0, 0];
    const [lng, lat] = proj4(utm23s, wgs84, [e, n]);
    return [lng, lat];
  } catch (error) {
    return [0, 0];
  }
}

/**
 * Converte uma geometria UTM recursivamente para LatLng (WGS84)
 */
export function convertGeometryToWGS84(geometry: any): any {
  if (!geometry) return geometry;

  // Unwrap profundo
  let raw;
  try {
    raw = JSON.parse(JSON.stringify(geometry));
  } catch (e) {
    raw = geometry;
  }

  if (!raw.coordinates || !Array.isArray(raw.coordinates)) {
    console.error(
      "convertGeometryToWGS84: Geometria sem coordenadas válidas",
      raw,
    );
    return raw;
  }

  const convertArray = (arr: any[]): any => {
    if (typeof arr[0] === "number") {
      return utmToLatLng(arr[0], arr[1]);
    }
    if (Array.isArray(arr)) {
      return arr.map(convertArray);
    }
    return arr;
  };

  const result = {
    ...raw,
    coordinates: raw.coordinates.map(convertArray),
  };

  console.log(
    "convertGeometryToWGS84: Exemplo de coordenada convertida:",
    raw.coordinates[0][0],
    " -> ",
    result.coordinates[0][0],
  );

  return result;
}
