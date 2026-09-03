export type MapLngLatBounds = [[number, number], [number, number]];

type BoundsAccumulator = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export const calculateCentroid = (polygon: number[][]) => {
  let xSum = 0,
    ySum = 0,
    area = 0;

  for (let i = 0; i < polygon.length - 1; i++) {
    const x0 = polygon[i][0],
      y0 = polygon[i][1];
    const x1 = polygon[i + 1][0],
      y1 = polygon[i + 1][1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    xSum += (x0 + x1) * cross;
    ySum += (y0 + y1) * cross;
  }

  area *= 0.5;
  if (area === 0) return polygon[0]; // Caso de polígono degenerado (linha ou ponto)

  return [xSum / (6 * area), ySum / (6 * area)];
};

const isLngLat = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length >= 2 &&
  typeof value[0] === "number" &&
  typeof value[1] === "number" &&
  Number.isFinite(value[0]) &&
  Number.isFinite(value[1]);

const extendBounds = (value: unknown, bounds: BoundsAccumulator) => {
  if (isLngLat(value)) {
    const [lng, lat] = value;
    bounds.minLng = Math.min(bounds.minLng, lng);
    bounds.minLat = Math.min(bounds.minLat, lat);
    bounds.maxLng = Math.max(bounds.maxLng, lng);
    bounds.maxLat = Math.max(bounds.maxLat, lat);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => extendBounds(item, bounds));
  }
};

export const getCoordinateBounds = (
  coordinates: unknown,
): MapLngLatBounds | null => {
  const bounds = {
    minLng: Infinity,
    minLat: Infinity,
    maxLng: -Infinity,
    maxLat: -Infinity,
  };

  extendBounds(coordinates, bounds);

  if (
    !Number.isFinite(bounds.minLng) ||
    !Number.isFinite(bounds.minLat) ||
    !Number.isFinite(bounds.maxLng) ||
    !Number.isFinite(bounds.maxLat)
  ) {
    return null;
  }

  return [
    [bounds.minLng, bounds.minLat],
    [bounds.maxLng, bounds.maxLat],
  ];
};

const mergeCoordinateBounds = (value: unknown, bounds: BoundsAccumulator) => {
  const coordinateBounds = getCoordinateBounds(value);
  if (!coordinateBounds) return;

  const [[minLng, minLat], [maxLng, maxLat]] = coordinateBounds;
  bounds.minLng = Math.min(bounds.minLng, minLng);
  bounds.minLat = Math.min(bounds.minLat, minLat);
  bounds.maxLng = Math.max(bounds.maxLng, maxLng);
  bounds.maxLat = Math.max(bounds.maxLat, maxLat);
};

const readBounds = (bounds: BoundsAccumulator): MapLngLatBounds | null => {
  if (
    !Number.isFinite(bounds.minLng) ||
    !Number.isFinite(bounds.minLat) ||
    !Number.isFinite(bounds.maxLng) ||
    !Number.isFinite(bounds.maxLat)
  ) {
    return null;
  }

  return [
    [bounds.minLng, bounds.minLat],
    [bounds.maxLng, bounds.maxLat],
  ];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getGeoJsonBounds = (geojson: any): MapLngLatBounds | null => {
  if (!geojson) return null;

  if (geojson.type === "FeatureCollection") {
    const bounds = {
      minLng: Infinity,
      minLat: Infinity,
      maxLng: -Infinity,
      maxLat: -Infinity,
    };

    geojson.features?.forEach((feature: unknown) => {
      const featureBounds = getGeoJsonBounds(feature);
      if (featureBounds) mergeCoordinateBounds(featureBounds, bounds);
    });

    return readBounds(bounds);
  }

  if (geojson.type === "Feature") {
    return getGeoJsonBounds(geojson.geometry);
  }

  if (geojson.type === "GeometryCollection") {
    const bounds = {
      minLng: Infinity,
      minLat: Infinity,
      maxLng: -Infinity,
      maxLat: -Infinity,
    };

    geojson.geometries?.forEach((geometry: unknown) => {
      const geometryBounds = getGeoJsonBounds(geometry);
      if (geometryBounds) mergeCoordinateBounds(geometryBounds, bounds);
    });

    return readBounds(bounds);
  }

  if (geojson.coordinates) {
    return getCoordinateBounds(geojson.coordinates);
  }

  if (Array.isArray(geojson)) {
    return getCoordinateBounds(geojson);
  }

  return null;
};
