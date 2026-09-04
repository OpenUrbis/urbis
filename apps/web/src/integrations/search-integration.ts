import axios, { AxiosRequestConfig } from "axios";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
  IGetSearchItemError,
} from "../types/fetch-search-config-type";
import { createFn } from "../utils/createFn";
import { normalizeTerm } from "../utils/layer-utils";
import { getAuthHeaders, getOptionalAuthHeaders } from "../utils/auth-headers";

const environment = (import.meta.env.VITE_API_URL || "/api") + "/maps";

const parseCifCandidates = (term: string) => {
  const candidates: Array<{
    setor: string;
    quadra: string;
    lote?: string | null;
    condominio?: string | null;
    digito?: string | null;
    cd_tipo_lote: string;
  }> = [];

  const hasEL = term.toLowerCase().includes("el");
  const hasV = !hasEL && term.toLowerCase().includes("v");
  const cd_tipo_lote = hasEL ? "M" : hasV ? "V" : "F";

  const addCandidate = (candidate: Omit<(typeof candidates)[number], "cd_tipo_lote">) => {
    if (!candidate.setor || !candidate.quadra) return;
    const normalized = {
      setor: candidate.setor,
      quadra: candidate.quadra,
      lote: candidate.lote || null,
      condominio: candidate.condominio || null,
      digito: candidate.digito || null,
      cd_tipo_lote,
    };
    const key = JSON.stringify(normalized);
    if (!candidates.some((item) => JSON.stringify(item) === key)) {
      candidates.push(normalized);
    }
  };

  const digits = term.replace(/\D/g, "");
  if (/^\d{10}$/.test(digits) || /^\d{11}$/.test(digits)) {
    addCandidate({
      setor: digits.substring(0, 3),
      quadra: digits.substring(3, 6),
      lote: digits.substring(6, 10),
      digito: digits.length === 11 ? digits.substring(10, 11) : null,
    });
  }

  if (/^\d{12}$/.test(digits) || /^\d{13}$/.test(digits)) {
    const setor = digits.substring(0, 3);
    const quadra = digits.substring(3, 6);
    const digito = digits.length === 13 ? digits.substring(12, 13) : null;
    addCandidate({
      setor,
      quadra,
      condominio: digits.substring(6, 8),
      lote: digits.substring(8, 12),
      digito,
    });
    addCandidate({
      setor,
      quadra,
      lote: digits.substring(6, 10),
      condominio: digits.substring(10, 12),
      digito,
    });
  }

  const parts = term
    .trim()
    .split(/[^0-9]+/)
    .filter(Boolean);
  if (
    parts.length >= 3 &&
    parts.length <= 5 &&
    /^\d{3}$/.test(parts[0]) &&
    /^\d{3}$/.test(parts[1])
  ) {
    const setor = parts[0];
    const quadra = parts[1];
    const first = parts[2];
    const second = parts[3] || null;
    const third = parts[4] || null;

    if (/^\d{4}$/.test(first)) {
      addCandidate({
        setor,
        quadra,
        lote: first,
        condominio: second && /^\d{2}$/.test(second) ? second : null,
        digito:
          third && /^\d$/.test(third)
            ? third
            : second && /^\d$/.test(second)
              ? second
              : null,
      });
    }

    if (/^\d{2}$/.test(first) && second && /^\d{4}$/.test(second)) {
      addCandidate({
        setor,
        quadra,
        condominio: first,
        lote: second,
        digito: third && /^\d$/.test(third) ? third : null,
      });
    }
  }

  return candidates;
};

const buildCifCql = (term: string) => {
  const candidates = parseCifCandidates(term);
  if (!candidates.length) return null;

  return candidates
    .map((candidate) => {
      const parts = [
        `setor_fiscal = ${parseInt(candidate.setor, 10)}`,
        `quadra_fiscal = ${parseInt(candidate.quadra, 10)}`,
      ];
      if (candidate.condominio)
        parts.push(`condominio = ${parseInt(candidate.condominio, 10)}`);
      if (candidate.lote) parts.push(`lote_fiscal = ${parseInt(candidate.lote, 10)}`);
      if (candidate.digito) parts.push(`digito_verificador = ${parseInt(candidate.digito, 10)}`);
      return `(${parts.join(" AND ")})`;
    })
    .join(" OR ");
};

const buildCifSearchParams = (term: string) => {
  const iptuFilter = buildCifCql(term);
  const safeTerm = String(term).replace(/'/g, "''").trim();
  const words = safeTerm.split(/\s+/).filter(Boolean);
  const logradouroFilter = words.length > 0
    ? words.map((w) => `logradouro ILIKE '%${w}%'`).join(" AND ")
    : `logradouro ILIKE '%${safeTerm}%'`;

  const CQL_FILTER = iptuFilter || logradouroFilter;

  return {
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    typeName: "slui:lotes_fiscais",
    maxFeatures: "5",
    outputFormat: "json",
    srsName: "EPSG:4326",
    CQL_FILTER,
  };
};

const collectCoordinatePairs = (coordinates: unknown): number[][] => {
  if (!Array.isArray(coordinates)) return [];

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    return [[coordinates[0], coordinates[1]]];
  }

  return coordinates.flatMap((coordinate) =>
    collectCoordinatePairs(coordinate),
  );
};

const calculateFeatureCenter = (geometry: any) => {
  const pairs = collectCoordinatePairs(geometry?.coordinates);
  if (!pairs.length) return null;

  const bounds = pairs.reduce(
    (acc, [longitude, latitude]) => ({
      minLongitude: Math.min(acc.minLongitude, longitude),
      maxLongitude: Math.max(acc.maxLongitude, longitude),
      minLatitude: Math.min(acc.minLatitude, latitude),
      maxLatitude: Math.max(acc.maxLatitude, latitude),
    }),
    {
      minLongitude: Number.POSITIVE_INFINITY,
      maxLongitude: Number.NEGATIVE_INFINITY,
      minLatitude: Number.POSITIVE_INFINITY,
      maxLatitude: Number.NEGATIVE_INFINITY,
    },
  );

  const longitude = (bounds.minLongitude + bounds.maxLongitude) / 2;
  const latitude = (bounds.minLatitude + bounds.maxLatitude) / 2;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

  return { longitude, latitude };
};

const transformCifSearchResponse = (responseJson: any): IGetSearchItem[] => {
  return (responseJson?.features ?? []).flatMap((feature: any) => {
    const center = calculateFeatureCenter(feature?.geometry);
    if (!center) return [];

    const { properties = {}, id } = feature;
    const {
      logradouro,
      numero,
      complemento,
      endereco_completo,
      nm_logradouro_completo,
      cd_numero_porta,
      sql,
      sql_condominio,
      setor_fiscal,
      quadra_fiscal,
      lote_fiscal,
      condominio,
      digito_verificador,
      cd_setor_fiscal,
      cd_quadra_fiscal,
      cd_lote,
      cd_condominio,
      cd_digito_sql,
      tipo_lote_fiscal,
      cd_tipo_lote,
    } = properties;

    const street = logradouro ?? nm_logradouro_completo;
    const num = numero ?? cd_numero_porta;
    const comp = complemento;
    const address =
      endereco_completo ?? [street, num, comp].filter(Boolean).join(" ");

    const iptuLabel = sql ?? (setor_fiscal !== undefined
      ? `${String(setor_fiscal).padStart(3, "0")}.${String(quadra_fiscal).padStart(3, "0")}.${condominio ? "CD" + String(condominio).padStart(2, "0") + "." : ""}${String(lote_fiscal).padStart(4, "0")}-${digito_verificador ?? 0}`
      : (cd_setor_fiscal
        ? `${cd_setor_fiscal}.${cd_quadra_fiscal}.${cd_condominio && cd_condominio !== "00" ? "CD" + cd_condominio + "." : ""}${cd_lote}${cd_digito_sql ? "-" + cd_digito_sql : ""}`
        : ""));

    return [
      {
        id,
        latitude: center.latitude,
        longitude: center.longitude,
        name: iptuLabel ? `SQL ${iptuLabel} — ${address || "Sem endereço"}` : (address || "Lote fiscal"),
        rawData: feature,
      },
    ];
  });
};

// Public config fetch (probably for map usage)
export const getSearchConfig = async (): Promise<
  IGetSearchConfigResponse[]
> => {
  const headers = await getOptionalAuthHeaders().catch(() => ({}));
  let response = await fetch(`${environment}/config/search`, { headers });
  if (!response.ok && Object.keys(headers).length > 0) {
    response = await fetch(`${environment}/config/search`);
  }
  if (!response.ok) {
    throw new Error("Failed to fetch map config");
  }

  return await response.json();
};

// CRUD Methods
export const getSearchConfigs = async (
  page = 1,
  limit = 10,
  orderBy?: string,
  orderType?: "ASC" | "DESC",
): Promise<
  | { data: IGetSearchConfigResponse[]; total: number }
  | IGetSearchConfigResponse[]
> => {
  const headers = await getOptionalAuthHeaders();
  const response = await axios.get(`${environment}/search`, {
    params: { page, limit, pageSize: limit, orderBy, orderType },
    headers,
  });
  return response.data;
};

export const getSearchConfigById = async (
  id: string,
): Promise<IGetSearchConfigResponse> => {
  const headers = await getOptionalAuthHeaders();
  const response = await axios.get(`${environment}/search/${id}`, { headers });
  return response.data;
};

export const createSearchConfig = async (
  data: Partial<IGetSearchConfigResponse>,
): Promise<IGetSearchConfigResponse> => {
  const headers = await getAuthHeaders();
  const response = await axios.post(`${environment}/search`, data, { headers });
  return response.data;
};

export const updateSearchConfig = async (
  id: string,
  data: Partial<IGetSearchConfigResponse>,
): Promise<IGetSearchConfigResponse> => {
  const headers = await getAuthHeaders();
  const response = await axios.put(`${environment}/search/${id}`, data, {
    headers,
  });
  return response.data;
};

export const deleteSearchConfig = async (id: string): Promise<void> => {
  const headers = await getAuthHeaders();
  await axios.delete(`${environment}/search/${id}`, { headers });
};

export const fetchSearchItem = async (
  item: IGetSearchConfigResponse,
  term: string,
): Promise<IGetSearchItem[] | IGetSearchItemError[]> => {
  try {
    if (!term) return [];

    const {
      origin,
      method,
      transformParams,
      transformRequest,
      transformResponse,
    } = item;

    let targetUrl = origin;
    if (
      targetUrl.includes("geoserver.slui.dev/geoserver/slui/ows") ||
      targetUrl.includes("geoserver.slui.dev/geoserver/slui/wms")
    ) {
      targetUrl = `${environment}/proxy/wfs`;
    } else if (
      targetUrl.startsWith("http") &&
      !targetUrl.includes(window.location.host) &&
      !targetUrl.includes("/maps/proxy")
    ) {
      targetUrl = `${environment}/proxy?url=${encodeURIComponent(targetUrl)}`;
    } else {
      targetUrl = targetUrl.replace("{environment}", environment);
    }

    const headers = await getAuthHeaders().catch(() => ({}));

    const config: AxiosRequestConfig = {
      url: targetUrl,
      method: method || "GET",
      headers,
    };

    const cifParams = item.id === "lots" ? buildCifSearchParams(term) : null;
    if (cifParams) {
      config.params = cifParams;
    } else if (transformParams) {
      const transformParamsFn = createFn(transformParams);
      const normalizedTerm = term ? normalizeTerm(term) : term;
      config.params = transformParamsFn
        ? transformParamsFn({ term: normalizedTerm })
        : {};
    }

    if (transformRequest)
      config.transformRequest = [createFn(transformRequest)];

    // Force text response to allow manual parsing and count extraction
    config.transformResponse = [(data) => data];

    const response = await axios(config);
    const responseText = response.data;
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response JSON", e);
      responseJson = {};
    }

    let items: any[] = [];

    if (cifParams) {
      items = transformCifSearchResponse(responseJson);
    } else if (transformResponse) {
      const fn = createFn(transformResponse);
      try {
        items = fn(responseText);
      } catch (e) {
        console.error("Error transforming response", e);
        items = [];
      }
    } else {
      items = Array.isArray(responseJson) ? responseJson : [];
    }

    if (item.id === "lots" && Array.isArray(items)) {
      items = items.map((res: any) => {
        if (res && typeof res.name === "string") {
          res.name = res.name.replace(/^IPTU\b/, "CIF");
        }
        return res;
      });
    }

    const totalCount =
      responseJson.totalFeatures ||
      responseJson.numberMatched ||
      responseJson.count;

    if (Array.isArray(items) && totalCount !== undefined) {
      (items as any).totalCount = totalCount;
    }

    return items ?? [];
  } catch (error: any) {
    console.error("Error fetching search item:", error);
    return [
      {
        type: "error",
        message:
          error?.response?.data?.message ??
          "Houve um erro ao buscar os dados de pesquisa.",
      },
    ];
  }
};
