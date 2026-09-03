export const calculateCenterId = (input: any): [number, number] => {
  if (!input) return [0, 0];

  let coords = input;
  if (coords && typeof coords === "object") {
    if (coords.geometry) coords = coords.geometry;
    if (coords.coordinates) coords = coords.coordinates;
  }

  if (!Array.isArray(coords) || coords.length === 0) return [0, 0];

  // Point [lon, lat]
  if (
    coords.length >= 2 &&
    typeof coords[0] === "number" &&
    typeof coords[1] === "number"
  ) {
    return [coords[0], coords[1]];
  }

  // Unwrap nested arrays until coords is a 2D array: [[lon, lat], [lon, lat], ...]
  while (
    Array.isArray(coords) &&
    coords.length > 0 &&
    Array.isArray(coords[0]) &&
    Array.isArray(coords[0][0])
  ) {
    coords = coords[0];
  }

  if (!Array.isArray(coords) || coords.length === 0) return [0, 0];

  const firstPoint = coords[0];
  if (
    !Array.isArray(firstPoint) ||
    typeof firstPoint[0] !== "number" ||
    typeof firstPoint[1] !== "number"
  ) {
    return [0, 0];
  }

  let xSum = 0,
    ySum = 0,
    area = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const pt0 = coords[i];
    const pt1 = coords[i + 1];
    if (
      !Array.isArray(pt0) ||
      !Array.isArray(pt1) ||
      typeof pt0[0] !== "number" ||
      typeof pt0[1] !== "number" ||
      typeof pt1[0] !== "number" ||
      typeof pt1[1] !== "number"
    ) {
      continue;
    }
    const x0 = pt0[0],
      y0 = pt0[1];
    const x1 = pt1[0],
      y1 = pt1[1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    xSum += (x0 + x1) * cross;
    ySum += (y0 + y1) * cross;
  }

  area *= 0.5;
  if (isNaN(area) || area === 0) {
    return [firstPoint[0], firstPoint[1]];
  }

  const cx = xSum / (6 * area);
  const cy = ySum / (6 * area);

  if (isNaN(cx) || isNaN(cy)) {
    return [firstPoint[0], firstPoint[1]];
  }

  return [cx, cy];
};
