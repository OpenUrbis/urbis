import axios, { AxiosRequestConfig } from "axios";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
  IGetSearchItemError,
} from "../types/fetch-search-config-type";
import { createFn } from "../utils/createFn";
import { normalizeTerm } from "../utils/layer-utils";

const environment =
  (import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br") + "/maps";

// Public config fetch (probably for map usage)
export const getSearchConfig = async (): Promise<
  IGetSearchConfigResponse[]
> => {
  const response = await fetch(`${environment}/config/search`);
  if (!response.ok) {
    throw new Error("Failed to fetch map config");
  }

  return await response.json();
};

// CRUD Methods
export const getSearchConfigs = async (page = 1, limit = 10): Promise<{ data: IGetSearchConfigResponse[], total: number } | IGetSearchConfigResponse[]> => {
  const response = await axios.get(`${environment}/search`, {
    params: { page, limit }
  });
  return response.data;
};

export const getSearchConfigById = async (id: string): Promise<IGetSearchConfigResponse> => {
  const response = await axios.get(`${environment}/search/${id}`);
  return response.data;
};

export const createSearchConfig = async (data: Partial<IGetSearchConfigResponse>): Promise<IGetSearchConfigResponse> => {
  const response = await axios.post(`${environment}/search`, data);
  return response.data;
};

export const updateSearchConfig = async (id: string, data: Partial<IGetSearchConfigResponse>): Promise<IGetSearchConfigResponse> => {
  const response = await axios.put(`${environment}/search/${id}`, data);
  return response.data;
};

export const deleteSearchConfig = async (id: string): Promise<void> => {
  await axios.delete(`${environment}/search/${id}`);
};

export const fetchSearchItem = async (
  item: IGetSearchConfigResponse,
  term: string
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
    const config: AxiosRequestConfig = {
      url: origin.replace("{environment}", environment),
      method: method || "GET",
    };

    if (transformParams) {
      const transformParamsFn = createFn(transformParams);
      const normalizedTerm = term ? normalizeTerm(term) : term;
      config.params = transformParamsFn ? transformParamsFn({ term: normalizedTerm }) : {};
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

    if (transformResponse) {
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
