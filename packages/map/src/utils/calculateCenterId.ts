export const calculateCenterId = (polygon: number[][]) => {
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