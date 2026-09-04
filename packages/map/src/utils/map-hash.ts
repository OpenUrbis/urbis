export interface MapViewStateHash {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

/**
 * Faz o parsing da hash da URL (#zoom/lat/lng ou #zoom/lat/lng/bearing/pitch).
 * Retorna null se não houver hash válida.
 */
export function parseMapHash(rawHash?: string): MapViewStateHash | null {
  const hash =
    rawHash !== undefined
      ? rawHash
      : typeof window !== "undefined"
      ? window.location.hash
      : "";

  if (!hash || !hash.startsWith("#")) {
    return null;
  }

  const clean = hash.slice(1).trim();
  if (!clean) return null;

  const parts = clean.split("/").map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) {
    return null;
  }

  const [zoom, latitude, longitude, bearing = 0, pitch = 0] = parts;

  // Validação de limites geográficos
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  // Validação de zoom aceitável
  if (zoom < 0 || zoom > 24) {
    return null;
  }

  const normalizedBearing = ((bearing % 360) + 360) % 360;
  const normalizedPitch = Math.max(0, Math.min(85, pitch));

  return {
    zoom,
    latitude,
    longitude,
    bearing: normalizedBearing,
    pitch: normalizedPitch,
  };
}

/**
 * Formata o estado da visualização do mapa para string hash compacta e limpa.
 * Arredonda coordenadas para 5 casas decimais (~1.1m) e zoom para 2 casas decimais.
 */
export function formatMapHash(view: {
  zoom: number;
  latitude: number;
  longitude: number;
  bearing?: number;
  pitch?: number;
}): string {
  const z = Number(view.zoom.toFixed(2));
  const lat = Number(view.latitude.toFixed(5));
  const lng = Number(view.longitude.toFixed(5));
  const bearing = Math.round(view.bearing || 0);
  const pitch = Math.round(view.pitch || 0);

  if (bearing !== 0 || pitch !== 0) {
    return `#${z}/${lat}/${lng}/${bearing}/${pitch}`;
  }

  return `#${z}/${lat}/${lng}`;
}

/**
 * Atualiza o hash da URL no navegador de forma limpa usando replaceState
 * (não polui o histórico de navegação com passos intermediários).
 */
export function updateMapUrlHash(hash: string): void {
  if (typeof window === "undefined") return;

  if (window.location.hash === hash) return;

  const newUrl = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(window.history.state, "", newUrl);
}
