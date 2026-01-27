import proj4 from "proj4";

// Função para transformar os limites de longitude e latitude para UTM (EPSG:31983)
export function transformBoundsToUTM(coordinates: any) {
  // Definindo a projeção de origem (WGS84)
  const source = "+proj=longlat +datum=WGS84";

  // Definindo a projeção de destino (UTM zone 23S - EPSG:31983)
  const destination =
    "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

  // Realizando a transformação de projeção
  const transformedCoordinates = proj4(source, destination, coordinates);

  return transformedCoordinates;
}

// Função para formatar os limites transformados para o formato da URL
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatBoundsForURL(bounds: any) {
  // Formatando os limites para o formato da URL
  const formattedBounds = bounds.join(",");

  return formattedBounds;
}

// Função para transformar coordenadas UTM (EPSG:31983) em WGS84
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformUTMToWGS84(coordinates: any) {
  // Definindo a projeção de origem (UTM zone 23S - EPSG:31983)
  const source =
    "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

  // Definindo a projeção de destino (WGS84)
  const destination = "+proj=longlat +datum=WGS84";
  // Realizando a transformação de projeção
  const transformedCoordinates = proj4(source, destination, coordinates);

  return transformedCoordinates;
}
// Função para converter as coordenadas do GeoJSON
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertGeoJsonCoordinates(geoJson: any): any {
  // Definindo a projeção de origem (EPSG:31983)
  const source =
    "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

  // Definindo a projeção de destino (EPSG:4326)
  const destination = "+proj=longlat +datum=WGS84";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertedFeatures = geoJson.features.map((feature: any) => {
    const convertedCoordinates = feature.geometry.coordinates.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (coordinates: any) => {
        if (feature.geometry.type === "Polygon") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return coordinates.map((ring: any) =>
            ring.map((coord: number[]) => proj4(source, destination, coord))
          );
        } else if (feature.geometry.type === "MultiPolygon") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return coordinates.map((polygon: any) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            polygon.map((ring: any) =>
              ring.map((coord: number[]) => proj4(source, destination, coord))
            )
          );
        }

        return proj4(source, destination, coordinates);
      }
    );

    return {
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: convertedCoordinates,
      },
    };
  });

  return {
    ...geoJson,
    features: convertedFeatures,
  };
}
