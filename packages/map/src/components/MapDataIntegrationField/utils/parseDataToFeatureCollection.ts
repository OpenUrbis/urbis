// packages/map/src/components/MapDataIntegrationField/utils/parseDataToFeatureCollection.ts
import { convertGeometryToWGS84 } from "./utm-converter";

export function parseDataToFeatureCollection(data: any): any {
  if (!data) return null;

  const features: any[] = [];

  const toNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  };

  const METERS_TO_CENTIMETERS = 100;
  const LEGACY_ALTITUDE_THRESHOLD_IN_CENTIMETERS = 5000;

  const toLegacyCentimeters = (valueInMeters: number): number =>
    valueInMeters * METERS_TO_CENTIMETERS;

  const fromLegacyCentimeters = (valueInCentimeters: number): number =>
    valueInCentimeters / METERS_TO_CENTIMETERS;

  const getRelativeAltitudeInMeters = (
    altitudeInMeters: number,
    groundInMeters: number,
  ): number => {
    const altitudeInCentimeters = toLegacyCentimeters(altitudeInMeters);

    if (altitudeInCentimeters > LEGACY_ALTITUDE_THRESHOLD_IN_CENTIMETERS) {
      return fromLegacyCentimeters(
        altitudeInCentimeters - toLegacyCentimeters(groundInMeters),
      );
    }

    return altitudeInMeters;
  };

  const getThicknessInMeters = (
    value: unknown,
    fallbackInMeters = 3,
  ): number => {
    const rawVal = toNumber(value);
    if (rawVal === undefined || !Number.isFinite(rawVal) || rawVal <= 0) {
      return fallbackInMeters;
    }

    // Se o valor for > 50 (ex: 300cm, 400cm), converte de centímetros legados para metros
    if (rawVal > 50) {
      return fromLegacyCentimeters(rawVal);
    }

    return rawVal;
  };

  // 1. Localizar a altitude do terreno (ground level) para servir como base 0 do prédio
  const rawData = data.dados?.[0]?.value || data.value || data;
  let groundAltitude = 0;

  const findGround = (obj: any): boolean => {
    if (!obj || typeof obj !== "object") return false;
    const alt =
      obj.altitude_do_pavimento_terreo?.valor ??
      obj.altitude_do_pavimento_terreo?.value ??
      obj.altitude_terreo?.valor ??
      obj.altitude_terreo?.value;
    const parsedAltitude = toNumber(alt);
    if (parsedAltitude !== undefined) {
      groundAltitude = parsedAltitude;
      return true;
    }
    return Object.values(obj).some((v: any) => findGround(v));
  };
  findGround(rawData);

  const walker = (
    obj: any,
    parentName: string = "",
    altitude: number = 0,
    path: string = "",
    parentHeight: number = 0,
  ) => {
    if (!obj || typeof obj !== "object") return;

    // Determinar Altitude
    let objAlt = obj._accumulated_altitude;
    if (objAlt === undefined)
      objAlt =
        obj.altitude_do_pavimento?.valor ?? obj.altitude_do_pavimento?.value;
    if (objAlt === undefined)
      objAlt = obj.altitude_maxima?.valor ?? obj.altitude_maxima?.value;
    if (objAlt === undefined)
      objAlt =
        obj.altitude_edilicia_mais_alta?.valor ??
        obj.altitude_edilicia_mais_alta?.value;

    const currentAltitude =
      toNumber(objAlt !== undefined ? objAlt : altitude) ?? 0;
    // Detectar Geometria
    const geo =
      obj.geometria ||
      obj.geometry ||
      obj.area_ocupada_absoluta?.geometry ||
      obj.area_ocupada?.geometry ||
      obj.areas_edificadas?.geometry ||
      obj["COORDENADAS DE GEOIMPFXAPAS DENTRO DE GEOIMPCALPRO"] ||
      obj["coordenadas_de_geoimpfxapas_dentro_de_geoimpcalpro"] ||
      obj["coordenadas de GEOIMPGUINORRBX"];

    if (geo && geo.coordinates && Array.isArray(geo.coordinates)) {
      try {
        const rawIdent =
          obj.identificação?.valor ??
          obj.identificação?.value ??
          obj.identificação ??
          obj.identificacao?.valor ??
          obj.identificacao?.value ??
          obj.identificacao;
        let rawName = obj.nome || parentName || "Geometria";
        if (typeof rawIdent === "string" && rawIdent.trim()) {
          const trimmedIdent = rawIdent.trim();
          if (!String(rawName).toLowerCase().includes(trimmedIdent.toLowerCase())) {
            rawName = `${rawName} (${trimmedIdent})`;
          }
        }
        const name = String(rawName).toLowerCase();

        // Skip "imóvel de análise (espacial)" completely from rendering on the map layer
        if (
          name === "imóvel de análise (espacial)" ||
          name === "imovel de analise (espacial)"
        ) {
          return;
        }

        let type = "imovel";
        if (name.includes("bloco")) type = "bloco";
        else if (name.includes("edificada")) type = "area_edificada";
        else if (name.includes("calcada")) type = "calcada";
        else if (name.includes("acesso")) type = "acesso_veiculo";
        else if (
          name.includes("unid") ||
          name.includes("individual") ||
          name.includes("unificada")
        )
          type = "area_individual";
        else if (name.includes("pavimento")) type = "pavimento";
        else if (name.includes("estacionamento")) type = "estacionamento";

        const convertedGeo = convertGeometryToWGS84(geo);
        let finalGeometry = convertedGeo;
        if (
          convertedGeo.type === "Polygon" &&
          convertedGeo.coordinates[0].length < 4
        ) {
          finalGeometry = {
            type: "Point",
            coordinates: convertedGeo.coordinates[0][0],
          };
        }

        // CÁLCULO DE ALTURA RELATIVA
        const relativeAlt = getRelativeAltitudeInMeters(
          currentAltitude,
          groundAltitude,
        );

        // Só áreas edificadas e unidades têm elevação empilhada
        const hasSpecificAltitude =
          obj.altitude_do_pavimento?.valor !== undefined ||
          obj.altitude_do_pavimento?.value !== undefined ||
          obj._accumulated_altitude !== undefined;
        const isStackable =
          type === "area_edificada" ||
          type === "area_individual" ||
          type === "pavimento" ||
          type === "estacionamento" ||
          hasSpecificAltitude;

        let finalBase = 0;
        let finalTop = 0;

        if (isStackable) {
          // Pavimentos e Unidades: Usam a altitude como BASE e somam a altura (espessura)
          if (
            obj._accumulated_base !== undefined &&
            obj._accumulated_top !== undefined
          ) {
            finalBase = toNumber(obj._accumulated_base) ?? 0;
            finalTop = toNumber(obj._accumulated_top) ?? finalBase;
          } else {
            finalBase = relativeAlt;
            const thickness = getThicknessInMeters(
              obj.altura?.valor ?? obj.altura?.value,
            );
            finalTop = finalBase + thickness;
          }
        } else {
          // Blocos e outros: Usam a altitude como TOPO (ou seja, do chão até o topo)
          finalBase = 0;
          finalTop = relativeAlt;
        }

        if (type === "acesso_veiculo" && finalTop === 0) {
          finalTop = 1;
        }

        const { geometria, geometry, coordinates, ...metadata } = obj;

        features.push({
          type: "Feature",
          geometry: finalGeometry,
          properties: {
            name: rawName,
            type: type,
            height: finalTop,
            base_height: finalBase,
            jsonPath: path || parentName,
            rawMetadata: JSON.stringify(metadata, null, 2),
          },
        });
      } catch (e) {}
    }

    // Processar Unidades (Se existirem dentro deste objeto, assumem a mesma altimetria do pai)
    let individuais: any[] = [];
    if (Array.isArray(obj.areas_individuais)) {
      individuais = obj.areas_individuais;
    } else if (
      obj.areas_individuais?.valor &&
      Array.isArray(obj.areas_individuais.valor)
    ) {
      individuais = obj.areas_individuais.valor;
    } else if (
      obj.areas_individuais?.value &&
      Array.isArray(obj.areas_individuais.value)
    ) {
      individuais = obj.areas_individuais.value;
    }

    if (Array.isArray(individuais) && individuais.length > 0) {
      // Recalcular base/top do pai para aplicar nas unidades filhas
      const relativeAlt = getRelativeAltitudeInMeters(
        currentAltitude,
        groundAltitude,
      );
      let parentBase = relativeAlt;
      let parentTop =
        parentBase +
        getThicknessInMeters(obj.altura?.valor ?? obj.altura?.value);

      if (
        obj._accumulated_base !== undefined &&
        obj._accumulated_top !== undefined
      ) {
        parentBase = toNumber(obj._accumulated_base) ?? parentBase;
        parentTop = toNumber(obj._accumulated_top) ?? parentTop;
      }

      individuais.forEach((ind: any, i: number) => {
        const unitGeo =
          ind.geometria ||
          ind.geometry ||
          ind.area_ocupada_absoluta?.geometry ||
          ind.area_ocupada?.geometry;

        if (unitGeo) {
          const { geometry: g, geometria: gm, coordinates: c, ...m } = ind;
          const convertedGeo = convertGeometryToWGS84(unitGeo);
          let finalGeometry = convertedGeo;

          // Correção para geometrias inválidas (polígonos com < 4 pontos viram Points)
          if (
            convertedGeo.type === "Polygon" &&
            Array.isArray(convertedGeo.coordinates[0]) &&
            convertedGeo.coordinates[0].length < 4
          ) {
            finalGeometry = {
              type: "Point",
              coordinates: convertedGeo.coordinates[0][0],
            };
          }

          let unitName =
            ind.identificação?.valor ??
            ind.identificação?.value ??
            ind.identificação ??
            ind.identificacao?.valor ??
            ind.identificacao?.value ??
            ind.identificacao ??
            ind.nome?.valor ??
            ind.nome?.value ??
            ind.nome ??
            ind.name;
          if (!unitName || typeof unitName !== "string") {
            unitName = `Unidade ${i + 1}`;
          }

          const UNIT_COLORS = [
            "#60a5fa", // blue-400
            "#a78bfa", // violet-400
            "#f472b6", // pink-400
            "#34d399", // emerald-400
            "#fbbf24", // amber-400
            "#38bdf8", // sky-400
            "#818cf8", // indigo-400
            "#2dd4bf", // teal-400
            "#fb923c", // orange-400
            "#a3e635", // lime-400
            "#c084fc", // purple-400
            "#fb7185", // rose-400
          ];

          features.push({
            type: "Feature",
            geometry: finalGeometry,
            properties: {
              name: unitName,
              type: "area_individual",
              height: parentTop,
              base_height: parentBase,
              unitIndex: i,
              unitColor: UNIT_COLORS[i % UNIT_COLORS.length],
              jsonPath: `${path}.areas_individuais[${i}]`,
              rawMetadata: JSON.stringify(m, null, 2),
            },
          });
        }
      });
    }

    // Atualiza parentHeight para o próximo nível se este objeto tiver altitude
    const nextParentHeight = getRelativeAltitudeInMeters(
      currentAltitude,
      groundAltitude,
    );

    // Recursão
    if (Array.isArray(obj)) {
      let runningBase = 0; // Empilhamento sequencial ignorando a altitude absoluta

      obj.forEach((item, i) => {
        if (parentName === "pavimentos" && item && typeof item === "object") {
          const thickness = getThicknessInMeters(
            item.altura?.valor ?? item.altura?.value,
          );
          item._accumulated_base = runningBase;
          item._accumulated_top = runningBase + thickness;
          runningBase += thickness;
        }
        walker(
          item,
          parentName,
          currentAltitude,
          `${path}[${i}]`,
          parentHeight,
        );
      });
    } else {
      Object.entries(obj).forEach(([key, val]) => {
        // Evitar recursão em 'areas_individuais' pois elas já são processadas no bloco específico acima
        if (
          key !== "geometria" &&
          key !== "geometry" &&
          key !== "coordinates" &&
          key !== "s3_metadata" &&
          key !== "areas_individuais" &&
          key !== "areas_edificadas"
        ) {
          walker(
            val,
            key,
            currentAltitude,
            path ? `${path}.${key}` : key,
            nextParentHeight,
          );
        }
      });
    }
  };

  walker(rawData);

  if (features.length === 0) return null;

  return {
    type: "FeatureCollection",
    features: features.sort(
      (a, b) => (a.properties.height || 0) - (b.properties.height || 0),
    ),
  };
}
