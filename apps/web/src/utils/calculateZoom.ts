export const calculateZoom = (feature: any): number => {
  if (!feature) return 16.5;

  // Usa o BBOX se ele for disponibilizado diretamente na feição
  if (feature.bbox && feature.bbox.length === 4) {
    const [minLng, minLat, maxLng, maxLat] = feature.bbox;
    return getZoomFromBounds(minLng, minLat, maxLng, maxLat);
  }

  // Tenta estimar através da área fornecida
  if (feature.properties) {
    const areaKm2 = Number(
      feature.properties.qt_area_poligono_quilometro ||
        feature.properties.qt_area_perimetro_pde_quilometro,
    );

    if (areaKm2) {
      if (areaKm2 > 100) return 10.5;
      if (areaKm2 > 50) return 11;
      if (areaKm2 > 10) return 12;
      if (areaKm2 > 5) return 13;
      if (areaKm2 > 1) return 14;
      return 15;
    }

    const areaM2 = Number(
      feature.properties.totalArea ||
        feature.properties.qt_area_terreno ||
        feature.properties.qt_area_poligono_metro,
    );

    if (areaM2) {
      if (areaM2 > 10000000) return 10.5; // 10km2
      if (areaM2 > 1000000) return 12.5; // 1km2
      if (areaM2 > 500000) return 13.5;
      if (areaM2 > 100000) return 14.5;
      if (areaM2 > 10000) return 15.5;
      return 16.5;
    }
  }

  // Fallback iterando pela geometria
  if (feature.geometry && feature.geometry.coordinates) {
    let minLng = 180,
      minLat = 90,
      maxLng = -180,
      maxLat = -90;
    let hasCoords = false;

    const parseCoords = (coords: any[]) => {
      for (const item of coords) {
        if (typeof item[0] === "number") {
          hasCoords = true;
          minLng = Math.min(minLng, item[0]);
          minLat = Math.min(minLat, item[1]);
          maxLng = Math.max(maxLng, item[0]);
          maxLat = Math.max(maxLat, item[1]);
        } else {
          parseCoords(item);
        }
      }
    };

    parseCoords(feature.geometry.coordinates);

    if (hasCoords && minLng !== maxLng && minLat !== maxLat) {
      return getZoomFromBounds(minLng, minLat, maxLng, maxLat);
    }
  }

  return 16.5;
};

const getZoomFromBounds = (
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
): number => {
  // APROXIMAÇÃO
  // Altura (em graus) aproximada para o PolygonMapTemplate (~184px num container pequeno).
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);

  if (maxDiff <= 0) return 16.5;

  // Fórmula básica de zoom em base mercator, considerando tile width = 512
  // A matemática exata pode variar no deck.gl, mas isso servirá de excelente aproximação
  // O -2.2 cria uma folga visual (borda) para não estourar na tela
  const zoom = Math.log2(360 / maxDiff) - 2.2;

  // Limites
  return Math.min(Math.max(zoom, 8), 19);
};
