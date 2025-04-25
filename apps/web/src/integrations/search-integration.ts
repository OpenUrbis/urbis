import axios, { AxiosRequestConfig } from "axios";
import { calculateCenterId } from "../hooks/useMapContext";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
} from "../types/fetch-search-config-type";

const environment = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const getSearchConfig = async (): Promise<
  IGetSearchConfigResponse[]
> => {
  const response = await fetch(`${environment}/search-config`);
  if (!response.ok) {
    throw new Error("Failed to fetch map config");
  }

  return await response.json();
};

const createFn = (strFn: string) => {
  try {
    const fn = new Function("utils", `return ${strFn}`);
    return fn({ calculateCenterId });
  } catch (error) {
    console.error("Error creating function from string:", strFn, error);
    return () => {};
  }
};

export const fetchSearchItem = async (
  item: IGetSearchConfigResponse,
  term: string
): Promise<IGetSearchItem[]> => {
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
    config.params = transformParamsFn ? transformParamsFn({ term }) : {};
  }

  if (transformRequest) config.transformRequest = [createFn(transformRequest)];

  if (transformResponse)
    config.transformResponse = [createFn(transformResponse)];

  const response = await axios(config);

  return response.data ?? [];
};
