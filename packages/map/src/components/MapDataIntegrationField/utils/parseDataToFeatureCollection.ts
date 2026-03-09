// packages/map/src/components/MapDataIntegrationField/utils/parseDataToFeatureCollection.ts
import { convertGeometryToWGS84 } from './utm-converter';

export function parseDataToFeatureCollection(data: any): any {
  if (!data) return null;

  const features: any[] = [];

  // 1. Localizar a altitude do terreno (ground level) para servir como base 0 do prédio
  const rawData = data.dados?.[0]?.value || data.value || data;
  let groundAltitude = 0;

  const findGround = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    const alt = obj.altitude_do_pavimento_terreo?.valor || obj.altitude_terreo?.valor;
    if (alt !== undefined) {
      groundAltitude = alt;
      return true;
    }
    return Object.values(obj).some((v: any) => findGround(v));
  };
  findGround(rawData);

  const walker = (obj: any, parentName: string = '', altitude: number = 0, path: string = '', parentHeight: number = 0) => {
    if (!obj || typeof obj !== 'object') return;

    // Determinar Altitude
    let objAlt = obj._accumulated_altitude;
    if (objAlt === undefined) objAlt = obj.altitude_do_pavimento?.valor;
    if (objAlt === undefined) objAlt = obj.altitude_maxima?.valor;
    if (objAlt === undefined) objAlt = obj.altitude_edilicia_mais_alta?.valor;
    
    const currentAltitude = objAlt !== undefined ? objAlt : altitude;
    console.log('currentAltitude', currentAltitude)
    // Detectar Geometria
    const geo = obj.geometria || obj.geometry || 
                obj.area_ocupada_absoluta?.geometry || 
                obj.area_ocupada?.geometry ||
                obj.areas_edificadas?.geometry ||
                obj['COORDENADAS DE GEOIMPFXAPAS DENTRO DE GEOIMPCALPRO'] || 
                obj['coordenadas de GEOIMPGUINORRBX'];

                console.log('coordGEO', obj['coordenadas de GEOIMPGUINORRBX']);
                console.log('obj a', obj, path, path.includes('.calcadas[1]'));
                if(path.includes('.calcadas[0]')) {
                  return;
                }
    if (geo && geo.coordinates && Array.isArray(geo.coordinates)) {
      try {
        const rawName = obj.nome || parentName || 'Geometria';
        const name = String(rawName).toLowerCase();
        
        // Skip "imóvel de análise (espacial)" completely from rendering on the map layer
        if (name === 'imóvel de análise (espacial)' || name === 'imovel de analise (espacial)') {
          return;
        }

        let type = 'imovel';
        if (name.includes('bloco')) type = 'bloco';
        else if (name.includes('edificada')) type = 'area_edificada';
        else if (name.includes('calcada')) type = 'calcada';
        else if (name.includes('acesso')) type = 'acesso_veiculo';
        else if (name.includes('unid') || name.includes('individual')) type = 'area_individual';
        else if (name.includes('pavimento')) type = 'pavimento';

        const convertedGeo = convertGeometryToWGS84(geo);
        let finalGeometry = convertedGeo;
        if (convertedGeo.type === 'Polygon' && convertedGeo.coordinates[0].length < 4) {
           finalGeometry = { type: 'Point', coordinates: convertedGeo.coordinates[0][0] };
        }

        // CÁLCULO DE ALTURA RELATIVA
        const relativeAlt = currentAltitude > 5000 ? (currentAltitude - groundAltitude) / 100 : currentAltitude;
        
        // Só áreas edificadas e unidades têm elevação empilhada
        const hasSpecificAltitude = obj.altitude_do_pavimento?.valor !== undefined || obj._accumulated_altitude !== undefined;
        const isStackable = type === 'area_edificada' || type === 'area_individual' || type === 'pavimento' || hasSpecificAltitude;
        
        let finalBase = 0;
        let finalTop = 0;

        if (isStackable) {
          // Pavimentos e Unidades: Usam a altitude como BASE e somam a altura (espessura)
          if (obj._accumulated_base !== undefined && obj._accumulated_top !== undefined) {
             finalBase = obj._accumulated_base;
             finalTop = obj._accumulated_top;
          } else {
             finalBase = relativeAlt;
             const thickness = (obj.altura?.valor || 300) / 100;
             finalTop = finalBase + thickness;
          }
        } else {
          // Blocos e outros: Usam a altitude como TOPO (ou seja, do chão até o topo)
          finalBase = 0;
          finalTop = relativeAlt;
        }

        if (type === 'acesso_veiculo' && finalTop === 0) {
          finalTop = 1;
        }

        const { geometria, geometry, coordinates, ...metadata } = obj;

        features.push({
          type: 'Feature',
          geometry: finalGeometry,
          properties: {
            name: rawName,
            type: type,
            height: finalTop,
            base_height: finalBase,
            jsonPath: path || parentName,
            rawMetadata: JSON.stringify(metadata, null, 2)
          }
        });
      } catch (e) {}
    }

    // Processar Unidades (Se existirem dentro deste objeto, assumem a mesma altimetria do pai)
    const individuais = obj.areas_individuais?.valor || [];
    if (Array.isArray(individuais)) {
      // Recalcular base/top do pai para aplicar nas unidades filhas
      const relativeAlt = currentAltitude > 5000 ? (currentAltitude - groundAltitude) / 100 : currentAltitude;
      let parentBase = relativeAlt;
      let parentTop = parentBase + ((obj.altura?.valor || 300) / 100);

      if (obj._accumulated_base !== undefined && obj._accumulated_top !== undefined) {
         parentBase = obj._accumulated_base;
         parentTop = obj._accumulated_top;
      }

      individuais.forEach((ind: any, i: number) => {
        const unitGeo = ind.geometria || ind.geometry || ind.area_ocupada_absoluta?.geometry || ind.area_ocupada?.geometry;
        
        if (unitGeo) {
          const { geometry: g, geometria: gm, coordinates: c, ...m } = ind;
          const convertedGeo = convertGeometryToWGS84(unitGeo);
          let finalGeometry = convertedGeo;
          
          // Correção para geometrias inválidas (polígonos com < 4 pontos viram Points)
          if (convertedGeo.type === 'Polygon' && Array.isArray(convertedGeo.coordinates[0]) && convertedGeo.coordinates[0].length < 4) {
             finalGeometry = { type: 'Point', coordinates: convertedGeo.coordinates[0][0] };
          }

          features.push({
            type: 'Feature',
            geometry: finalGeometry,
            properties: {
              name: ind.identificação || ind.nome || ind.name || `Unidade ${i}`,
              type: 'area_individual',
              height: parentTop,
              base_height: parentBase,
              jsonPath: `${path}.areas_individuais[${i}]`,
              rawMetadata: JSON.stringify(m, null, 2)
            }
          });
        }
      });
    }

    // Atualiza parentHeight para o próximo nível se este objeto tiver altitude
    const nextParentHeight = currentAltitude > 5000 ? (currentAltitude - groundAltitude) / 100 : currentAltitude;

    // Recursão
    if (Array.isArray(obj)) {
      let runningBase = 0; // Empilhamento sequencial ignorando a altitude absoluta

      obj.forEach((item, i) => {
        if (parentName === 'pavimentos' && item && typeof item === 'object') {
           const thickness = (item.altura?.valor || 300) / 100;
           item._accumulated_base = runningBase;
           item._accumulated_top = runningBase + thickness;
           runningBase += thickness;
        }
        walker(item, parentName, currentAltitude, `${path}[${i}]`, parentHeight);
      });
    } else {
      Object.entries(obj).forEach(([key, val]) => {
        // Evitar recursão em 'areas_individuais' pois elas já são processadas no bloco específico acima
        if (key !== 'geometria' && key !== 'geometry' && key !== 'coordinates' && key !== 's3_metadata' && key !== 'areas_individuais' && key !== 'areas_edificadas') {
          walker(val, key, currentAltitude, path ? `${path}.${key}` : key, nextParentHeight);
        }
      });
    }
  };

  walker(rawData);

  if (features.length === 0) return null;

  return {
    type: 'FeatureCollection',
    features: features.sort((a, b) => (a.properties.height || 0) - (b.properties.height || 0))
  };
}
