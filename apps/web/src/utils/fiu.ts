import proj4 from "proj4";
import { ITemplate } from "../components/ViewTemplate/types/templates-type";

export const FIU_STORAGE_PREFIX = "urbis:fiu:";
export const FIU_TEST_VALIDITY_TAG = "Ferramenta em testes com validade demonstrativa";
export const FIU_DISCLAIMER_MESSAGE =
  "Esta Ficha de Informações Urbanísticas (FIU) é uma ferramenta em fase de testes com validade exclusivamente demonstrativa e de consulta preliminar, não substituindo certidões formais emitidas pelos órgãos competentes. A responsabilidade pela delimitação do imóvel, em qualquer caso, mesmo quando utilizada geometria disponibilizada pela Prefeitura, é do usuário, que tem à disposição ferramentas de importação, desenho e edição para definir este perímetro.";
const FIU_PAYLOAD_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_FIU_AREA_SQUARE_METERS = 500_000;
const MAX_CACHED_FIU_IN_WEB_STORAGE = 2;

const IDB_NAME = "urbis_fiu_db";
const IDB_VERSION = 1;
const IDB_STORE_NAME = "fiu_payloads";

const openFiuDb = (): Promise<IDBDatabase | null> => {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME, { keyPath: "key" });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
};

export const saveFiuPayloadToIndexedDB = async (
  key: string,
  payload: any,
): Promise<void> => {
  try {
    const db = await openFiuDb();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_NAME, "readwrite");
        const store = tx.objectStore(IDB_STORE_NAME);
        store.put({ key, ...payload });

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // Ignore IndexedDB write errors
  }
};

export const getFiuPayloadFromIndexedDB = async (
  key: string,
): Promise<any | null> => {
  try {
    const db = await openFiuDb();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_NAME, "readonly");
        const store = tx.objectStore(IDB_STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result ?? null);
        };
        request.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
};

export const cleanupOldIndexedDbPayloads = async (): Promise<void> => {
  try {
    const db = await openFiuDb();
    if (!db) return;

    const now = Date.now();
    const tx = db.transaction(IDB_STORE_NAME, "readwrite");
    const store = tx.objectStore(IDB_STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (event: any) => {
      const cursor: IDBCursorWithValue = event.target.result;
      if (cursor) {
        const item = cursor.value;
        const createdAt = Number(item?.createdAt ?? 0);
        if (!createdAt || now - createdAt > FIU_PAYLOAD_TTL_MS) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch {
    // Ignore cleanup error
  }
};

export const cleanupOldFiuPayloads = () => {
  if (typeof window === "undefined") return;

  const now = Date.now();

  cleanupOldIndexedDbPayloads().catch(() => {});

  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const fiuEntries: { key: string; createdAt: number }[] = [];

      Object.keys(storage).forEach((key) => {
        if (!key.startsWith(FIU_STORAGE_PREFIX)) return;

        try {
          const payload = JSON.parse(storage.getItem(key) ?? "{}");
          const createdAt = Number(payload.createdAt ?? 0);

          if (!createdAt || now - createdAt > FIU_PAYLOAD_TTL_MS) {
            storage.removeItem(key);
          } else {
            fiuEntries.push({ key, createdAt });
          }
        } catch {
          storage.removeItem(key);
        }
      });

      // Keep only the most recent payloads in web storage to save quota
      if (fiuEntries.length > MAX_CACHED_FIU_IN_WEB_STORAGE) {
        fiuEntries.sort((a, b) => a.createdAt - b.createdAt);
        const toRemove = fiuEntries.slice(
          0,
          fiuEntries.length - MAX_CACHED_FIU_IN_WEB_STORAGE,
        );
        toRemove.forEach((entry) => storage.removeItem(entry.key));
      }
    } catch {
      // Ignore storage errors during cleanup
    }
  }
};

const ringAreaSquareMeters = (coordinates: number[][]): number => {
  if (!coordinates?.length) return 0;

  let area = 0;
  for (let index = 0; index < coordinates.length; index += 1) {
    const [lon1, lat1] = coordinates[index];
    const [lon2, lat2] = coordinates[(index + 1) % coordinates.length];
    area +=
      (lon2 - lon1) *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }

  return Math.abs((area * 6378137 * 6378137) / 2);
};

const polygonAreaSquareMeters = (coordinates: number[][][]): number => {
  if (!coordinates?.length) return 0;

  const [outerRing, ...holes] = coordinates;
  const outerArea = ringAreaSquareMeters(outerRing);
  const holesArea = holes.reduce(
    (total, ring) => total + ringAreaSquareMeters(ring),
    0,
  );

  return Math.max(outerArea - holesArea, 0);
};

export const normalizeGeoJsonToWgs84 = (geojsonFeature: any): any => {
  if (!geojsonFeature) return null;
  const geom = geojsonFeature.geometry || geojsonFeature;
  if (!geom?.coordinates || !geom?.type) return geojsonFeature;

  const isUtm = (coords: any): boolean => {
    if (!Array.isArray(coords) || coords.length < 2) return false;
    return Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90;
  };

  const transformPoint = (pt: number[]): number[] => {
    if (!Array.isArray(pt) || pt.length < 2) return pt;
    if (isUtm(pt)) {
      try {
        const [lon, lat] = proj4("EPSG:31983", "EPSG:4326", [pt[0], pt[1]]);
        return [lon, lat];
      } catch {
        return pt;
      }
    }
    return pt;
  };

  const transformCoords = (coords: any, depth: number): any => {
    if (!Array.isArray(coords)) return coords;
    if (depth === 0) return transformPoint(coords);
    return coords.map((c) => transformCoords(c, depth - 1));
  };

  let depth = 0;
  if (geom.type === "Point") depth = 0;
  else if (geom.type === "MultiPoint" || geom.type === "LineString") depth = 1;
  else if (geom.type === "Polygon" || geom.type === "MultiLineString") depth = 2;
  else if (geom.type === "MultiPolygon") depth = 3;

  const transformedCoordinates = transformCoords(geom.coordinates, depth);

  const transformedGeom = {
    ...geom,
    coordinates: transformedCoordinates,
  };

  if (geojsonFeature.geometry) {
    return {
      ...geojsonFeature,
      geometry: transformedGeom,
    };
  }

  return transformedGeom;
};

export const getFeatureAreaSquareMeters = (geojsonFeature: any): number => {
  const normalized = normalizeGeoJsonToWgs84(geojsonFeature);
  const geometry = normalized?.geometry ?? normalized;

  if (geometry?.type === "Polygon")
    return polygonAreaSquareMeters(geometry.coordinates);

  if (geometry?.type === "MultiPolygon") {
    return geometry.coordinates.reduce(
      (total: number, polygon: number[][][]) =>
        total + polygonAreaSquareMeters(polygon),
      0,
    );
  }

  return 0;
};

export const canOpenFiuFromGeometry = (feature: any) => {
  const geometry = feature?.geometry ?? feature;
  const hasSupportedGeometry =
    geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";

  if (!hasSupportedGeometry) {
    if (hasTaxLotFiuParams(feature)) {
      return { ok: true, reason: "" };
    }
    return {
      ok: false,
      reason: "A FIU pode ser gerada a partir de polígonos ou lotes fiscais.",
    };
  }

  const areaSquareMeters = getFeatureAreaSquareMeters(feature);

  if (areaSquareMeters > MAX_FIU_AREA_SQUARE_METERS) {
    return {
      ok: false,
      reason: `A FIU está limitada a áreas de até ${(MAX_FIU_AREA_SQUARE_METERS / 1_000).toLocaleString("pt-BR")} mil m². Reduza o polígono para continuar.`,
    };
  }

  return { ok: true, reason: "" };
};

export const hasTaxLotFiuParams = (feature: any): boolean => {
  const props = feature?.properties ?? {};

  return Boolean(
    props.sql_condominio ||
      props.sql ||
      (props.setor_fiscal !== undefined &&
        props.quadra_fiscal !== undefined &&
        props.lote_fiscal !== undefined) ||
      (props.cd_setor_fiscal && props.cd_quadra_fiscal && props.cd_lote),
  );
};

export const buildTaxLotFiuUrl = (feature: any): string | null => {
  if (!hasTaxLotFiuParams(feature)) return null;

  const props = feature.properties ?? {};

  let cqlFilter = "";
  if (props.sql_condominio) {
    cqlFilter = `sql_condominio = '${props.sql_condominio}'`;
  } else if (props.sql && String(props.sql).replace(/\D/g, "").length >= 10) {
    const rawSql = String(props.sql).replace(/\D/g, "");
    const sqlCondo = rawSql.padEnd(12, "0");
    cqlFilter = `sql_condominio = '${sqlCondo}'`;
  } else {
    const setor = String(
      props.setor_fiscal ?? props.cd_setor_fiscal ?? "",
    ).padStart(3, "0");
    const quadra = String(
      props.quadra_fiscal ?? props.cd_quadra_fiscal ?? "",
    ).padStart(3, "0");
    const lote = String(
      props.lote_fiscal ?? props.cd_lote ?? "",
    ).padStart(4, "0");
    const condo = String(
      props.condominio ?? props.cd_condominio ?? "00",
    ).padStart(2, "0");

    cqlFilter = `sql_condominio = '${setor}${quadra}${lote}${condo}'`;
  }

  const params = new URLSearchParams({
    interactive: "true",
    layerSchema: "lotes_fiscais",
    CQL_FILTER: cqlFilter,
  });

  return `/print?${params.toString()}`;
};

export const saveFiuPayload = ({
  feature,
  response,
  template,
  selectedUse,
  key,
}: {
  feature: any;
  response: any;
  template: ITemplate[];
  selectedUse?: any;
  key?: string;
}): string => {
  const payloadKey =
    key ||
    `${FIU_STORAGE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const cleanFeature = feature ? { ...feature } : {};
  if (cleanFeature.response && cleanFeature.response !== response) {
    delete cleanFeature.response;
  }

  const payloadFeature = {
    ...cleanFeature,
    properties: {
      ...(cleanFeature.properties ?? {}),
      origem_fiu:
        cleanFeature.properties?.origem_fiu ??
        "Área desenhada ou editada no mapa",
    },
    response,
  };

  const payloadObject = {
    createdAt: Date.now(),
    feature: payloadFeature,
    template,
    selectedUse,
  };

  cleanupOldFiuPayloads();

  // 1. Asynchronously save full payload to IndexedDB (virtually unlimited quota)
  saveFiuPayloadToIndexedDB(payloadKey, payloadObject).catch(() => {});

  // 2. Synchronously save to web storage as fast-path cache (wrapped safely to prevent QuotaExceededError)
  if (typeof window !== "undefined") {
    try {
      const serializedPayload = JSON.stringify(payloadObject);

      // SessionStorage
      try {
        sessionStorage.setItem(payloadKey, serializedPayload);
      } catch {
        try {
          Object.keys(sessionStorage).forEach((k) => {
            if (k.startsWith(FIU_STORAGE_PREFIX) && k !== payloadKey) {
              sessionStorage.removeItem(k);
            }
          });
          sessionStorage.setItem(payloadKey, serializedPayload);
        } catch {
          // Ignore if payload exceeds sessionStorage quota
        }
      }

      // LocalStorage
      try {
        localStorage.setItem(payloadKey, serializedPayload);
      } catch {
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith(FIU_STORAGE_PREFIX) && k !== payloadKey) {
              localStorage.removeItem(k);
            }
          });
          localStorage.setItem(payloadKey, serializedPayload);
        } catch {
          // Ignore if payload exceeds localStorage quota - IndexedDB will serve it
        }
      }
    } catch {
      // Ignore stringify/storage errors
    }
  }

  return payloadKey;
};

export const getFiuPayload = async (
  key: string,
  maxWaitMs: number = 2500,
): Promise<any | null> => {
  if (!key || typeof window === "undefined") return null;

  const tryReadWebStorage = (): any | null => {
    for (const storage of [window.sessionStorage, window.localStorage]) {
      try {
        const raw = storage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            return parsed;
          }
        }
      } catch {
        // continue
      }
    }
    return null;
  };

  const immediateStorage = tryReadWebStorage();
  if (immediateStorage) return immediateStorage;

  const immediateIdb = await getFiuPayloadFromIndexedDB(key);
  if (immediateIdb) return immediateIdb;

  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, 60));

    const polledStorage = tryReadWebStorage();
    if (polledStorage) return polledStorage;

    const polledIdb = await getFiuPayloadFromIndexedDB(key);
    if (polledIdb) return polledIdb;
  }

  return null;
};

export const buildGeometryFiuUrl = ({
  feature,
  response,
  template,
  selectedUse,
}: {
  feature: any;
  response: any;
  template: ITemplate[];
  selectedUse?: any;
}): string => {
  const payloadKey = saveFiuPayload({
    feature,
    response,
    template,
    selectedUse,
  });

  const params = new URLSearchParams({
    interactive: "true",
    payloadKey,
  });

  if (selectedUse) {
    const code =
      selectedUse?.item?.["Código"] ||
      selectedUse?.item?.["Codigo"] ||
      selectedUse?.item?.codigo ||
      selectedUse?.codigo ||
      "";
    if (code) {
      params.set("uso", String(code));
    }
  }

  return `/print?${params.toString()}`;
};

const sanitizeDxfLayerName = (name?: string): string => {
  if (!name) return "CAMADA";
  const cleaned = name
    .replace(/^slui:/i, "")
    .replace(/[/\\:;?*|="<>'\s]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  return cleaned || "CAMADA";
};

export const getFeatureDxfLayerName = (feature: any, index: number): string => {
  const props = feature?.properties ?? {};
  if (props._layerId) {
    return sanitizeDxfLayerName(props._layerId);
  }
  if (props.layer) {
    return sanitizeDxfLayerName(props.layer);
  }
  if (feature?.id && typeof feature.id === "string") {
    const idPrefix = feature.id.split(".")[0];
    if (idPrefix && idPrefix !== feature.id) {
      return sanitizeDxfLayerName(idPrefix);
    }
  }
  if (index === 0 || props.origem_fiu || props.cd_lote) {
    return "IMOVEL_CONSULTADO";
  }
  return `CAMADA_${index + 1}`;
};

export const convertGeoJsonToDxf = (fc: any): string => {
  let dxf = "0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n";

  const rawFeatures: any[] = Array.isArray(fc?.features)
    ? fc.features
    : Array.isArray(fc)
      ? fc
      : fc?.response?.features
        ? [fc, ...(fc.response.features || [])]
        : fc?.geometry
          ? [fc]
          : [];

  const features = rawFeatures.filter((f) => Boolean(f?.geometry));

  const projWGS84 = "+proj=longlat +datum=WGS84";
  const projEPSG31983 =
    "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

  const proj4Fn = (proj4 as any).default || proj4;
  const project = (coord: number[]): [number, number] => {
    if (!Array.isArray(coord) || coord.length < 2) return [0, 0];
    const [lon, lat] = coord;
    if (
      typeof lon !== "number" ||
      typeof lat !== "number" ||
      isNaN(lon) ||
      isNaN(lat)
    ) {
      return [0, 0];
    }
    if (Math.abs(lon) <= 180 && Math.abs(lat) <= 90) {
      try {
        const res = proj4Fn(projWGS84, projEPSG31983, [lon, lat]);
        if (
          Array.isArray(res) &&
          res.length >= 2 &&
          !isNaN(res[0]) &&
          !isNaN(res[1])
        ) {
          return [res[0], res[1]];
        }
      } catch {
        // fallback
      }
    }
    return [lon, lat];
  };

  const layerColorMap = new Map<string, number>();
  let nextColorIndex = 2;

  const getLayerColor = (layerName: string): number => {
    if (layerName === "IMOVEL_CONSULTADO") {
      return 1; // Red for the main queried feature
    }
    if (!layerColorMap.has(layerName)) {
      const color = ((nextColorIndex - 1) % 6) + 1;
      nextColorIndex += 1;
      layerColorMap.set(layerName, color === 1 ? 2 : color);
    }
    return layerColorMap.get(layerName)!;
  };

  const writeEntity = (geometry: any, layerName: string, color: number) => {
    if (!geometry?.type || !geometry?.coordinates) return;

    if (geometry.type === "Point") {
      const c = project(geometry.coordinates as number[]);
      dxf += `0\nPOINT\n8\n${layerName}\n62\n${color}\n10\n${c[0]}\n20\n${c[1]}\n`;
    } else if (geometry.type === "MultiPoint") {
      const pts = geometry.coordinates as number[][];
      pts.forEach((pt) => {
        const c = project(pt);
        dxf += `0\nPOINT\n8\n${layerName}\n62\n${color}\n10\n${c[0]}\n20\n${c[1]}\n`;
      });
    } else if (geometry.type === "LineString") {
      const coords = geometry.coordinates as number[][];
      if (coords.length > 0) {
        dxf += `0\nLWPOLYLINE\n8\n${layerName}\n62\n${color}\n90\n${coords.length}\n70\n0\n`;
        coords.forEach((pt) => {
          const c = project(pt);
          dxf += `10\n${c[0]}\n20\n${c[1]}\n`;
        });
      }
    } else if (geometry.type === "MultiLineString") {
      const lines = geometry.coordinates as number[][][];
      lines.forEach((line) => {
        if (line.length > 0) {
          dxf += `0\nLWPOLYLINE\n8\n${layerName}\n62\n${color}\n90\n${line.length}\n70\n0\n`;
          line.forEach((pt) => {
            const c = project(pt);
            dxf += `10\n${c[0]}\n20\n${c[1]}\n`;
          });
        }
      });
    } else if (geometry.type === "Polygon") {
      const rings = geometry.coordinates as number[][][];
      rings.forEach((ring) => {
        if (ring.length > 0) {
          dxf += `0\nLWPOLYLINE\n8\n${layerName}\n62\n${color}\n90\n${ring.length}\n70\n1\n`;
          ring.forEach((pt) => {
            const c = project(pt);
            dxf += `10\n${c[0]}\n20\n${c[1]}\n`;
          });
        }
      });
    } else if (geometry.type === "MultiPolygon") {
      const polygons = geometry.coordinates as number[][][][];
      polygons.forEach((poly) => {
        poly.forEach((ring) => {
          if (ring.length > 0) {
            dxf += `0\nLWPOLYLINE\n8\n${layerName}\n62\n${color}\n90\n${ring.length}\n70\n1\n`;
            ring.forEach((pt) => {
              const c = project(pt);
              dxf += `10\n${c[0]}\n20\n${c[1]}\n`;
            });
          }
        });
      });
    } else if (
      geometry.type === "GeometryCollection" &&
      Array.isArray(geometry.geometries)
    ) {
      geometry.geometries.forEach((g: any) =>
        writeEntity(g, layerName, color),
      );
    }
  };

  features.forEach((feature, index) => {
    const layerName = getFeatureDxfLayerName(feature, index);
    const color = getLayerColor(layerName);
    writeEntity(feature.geometry, layerName, color);
  });

  dxf += "0\nENDSEC\n0\nEOF\n";
  return dxf;
};
