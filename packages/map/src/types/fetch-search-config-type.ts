import { IGetConfigLayerSchema } from "./fetch-map-config-type";

export interface IGetSearchConfigResponse {
  id: string;
  name: string;
  origin: string;
  method?: string;
  index?: number;
  isActive?: boolean;
  transformParams?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterTree?: any;
  transformRequest?: string;
  transformResponse?: string;
  layerSchemaId?: string;
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

export interface IGetSearchItemError {
  type: string;
  message: string;
}

export interface ISearchResponse {
  [key: string]: IGetSearchItem[] | IGetSearchItemError[];
}
