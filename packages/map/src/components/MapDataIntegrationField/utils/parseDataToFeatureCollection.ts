function normalizeGeometry(geom: any) {
  if (!geom || !geom.coordinates) return geom;
  
  if (geom.type === 'Polygon') {
    // A proper Polygon should be [[[lon, lat], ...]]
    // If the first element's first element is a number, it means it's [[lon, lat], ...] instead of [[[lon, lat], ...]]
    if (geom.coordinates.length > 0 && typeof geom.coordinates[0][0] === 'number') {
      return {
        ...geom,
        coordinates: [geom.coordinates]
      };
    }
  }
  
  if (geom.type === 'MultiPolygon') {
    // A proper MultiPolygon should be [[[[lon, lat], ...]]]
    if (geom.coordinates.length > 0 && geom.coordinates[0].length > 0 && typeof geom.coordinates[0][0][0] === 'number') {
      // It might be formatted as a Polygon
      return {
        ...geom,
        coordinates: [geom.coordinates]
      };
    }
  }

  return geom;
}

export function parseDataToFeatureCollection(data: any): any {
  if (!data) return null;

  const features: any[] = [];

  // Fundiário
  if (data.fundiário?.['imóvel de análise (espacial)']?.geometria) {
    features.push({
      type: "Feature",
      properties: { name: "Imóvel de Análise (Espacial)", type: "imovel" },
      geometry: normalizeGeometry(data.fundiário['imóvel de análise (espacial)'].geometria)
    });
  } else if (data.fundiário?.['imóvel real']?.geometria) {
    features.push({
      type: "Feature",
      properties: { name: "Imóvel Real", type: "imovel" },
      geometry: normalizeGeometry(data.fundiário['imóvel real'].geometria)
    });
  }

  // Blocos e Áreas Individuais
  if (data.blocos && Array.isArray(data.blocos)) {
    data.blocos.forEach((bloco: any, idx: number) => {
      if (bloco.area_ocupada?.geometry) {
        features.push({
          type: "Feature",
          properties: { name: bloco.nome_do_bloco?.valor || `Bloco ${idx + 1}`, type: "bloco" },
          geometry: normalizeGeometry(bloco.area_ocupada.geometry)
        });
      }

      // Adicionar áreas individuais do térreo (se houver)
      const pavimentos = bloco.pavimentos || [];
      const terreo = pavimentos.find((p: any) => p.identificacao?.valor === 'T' || p.nome === 'pavimento');
      const areasIndividuais = terreo?.areas_individuais?.valor || [];
      
      areasIndividuais.forEach((ai: any) => {
        if (ai.geometry) {
          features.push({
            type: "Feature",
            properties: { name: ai.identificação || `Área Individual`, type: "area_individual" },
            geometry: normalizeGeometry(ai.geometry)
          });
        }
      });
    });
  }

  // Calcadas e Acessos
  // Calcadas e Acessos
  if (data.calcadas && Array.isArray(data.calcadas)) {
    data.calcadas.forEach((calcada: any, idx: number) => {
      const geo = calcada["COORDENADAS DE GEOIMPFXAPAS DENTRO DE GEOIMPCALPRO"];
      if (geo && geo.coordinates) {
        features.push({
          type: "Feature",
          properties: { name: `Calçada ${idx + 1}`, type: "calcada" },
          geometry: normalizeGeometry(geo)
        });
      }

      // Adicionar Acessos de Veículos
      if (calcada.AcessosVeiculos && Array.isArray(calcada.AcessosVeiculos)) {
        calcada.AcessosVeiculos.forEach((acesso: any) => {
          if (acesso.geometry) {
            features.push({
              type: "Feature",
              properties: { name: `Acesso Veículo ${acesso.numeracao || ''}`, type: "acesso_veiculo" },
              geometry: normalizeGeometry(acesso.geometry)
            });
          }
        });
      }
    });
  }

  if (features.length === 0) return null;

  // Return a FeatureCollection
  return {
    type: "FeatureCollection",
    features
  };
}
