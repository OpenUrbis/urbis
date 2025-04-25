import { IGetConfigLayerSchema } from "./fetch-map-config-type";

export interface IGetSearchConfigResponse {
  id: string;
  name: string;
  origin: string;
  method?: string;
  isActive?: boolean;
  transformParams?: string;
  transformRequest?: string;
  transformResponse?: string;
  clickAction?: {
    action: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: Record<string, any>;
  };
  layerSchema?: IGetConfigLayerSchema;
}

export interface IGetSearchItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawData?: any;
}

export interface ISearchResponse {
  [key: string]: IGetSearchItem[];
}
