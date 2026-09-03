import { ClickActionEnum } from "@open-urbis/map-shared";
import { ILayerPattern } from "../lib/layer-patterns";
import { ITemplate } from "../components/ViewTemplate/types/templates-type";
import { MapBoundingBox } from "./map-context-type";

export interface IGetConfigResponse {
  latitude: number;
  longitude: number;
  boundingBox: MapBoundingBox;
  zoom: number;
  bearing: number;
  pitch: number;
  padding: IGetConfigPadding;
  layerGroups: IGetConfigLayerGroup[];
  layerSchemas: IGetConfigLayerSchema[];
  editFeatureTemplate: ITemplate[];
  layerWithRootEditTemplate: string;
}

export interface IGetConfigPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface IGetConfigLayerGroup {
  id: string;
  name: string;
  ownerGroup: string;
  index?: number;
  parentGroup?: IGetConfigLayerGroup;
  childGroups: IGetConfigLayerGroup[];
}

/**
 * Padrões de preenchimento disponíveis no atlas `/pattern.png`.
 * A lista de referência (com rótulos e coordenadas) fica em `src/lib/layer-patterns.ts`.
 */
export type IGetConfigFillPattern = ILayerPattern;

export interface IGetConfigFillPatternConfig {
  fillPatternMask?: boolean;
  fillPatternAtlas?: string;
  fillPatternMapping?: string;
  getFillPatternScale?: number;
  getFillPatternOffset?: [number, number];
}

export interface IGetConfigColor {
  id: number;
  color: [number, number, number, number];
  pattern: IGetConfigFillPattern;
  patternConfig?: IGetConfigFillPatternConfig;
  label: string;
  type?: "text" | "fill" | "line";
  value: string;
  layerSchemaId: string;
  legisUrl?: string;
}

export enum IGetConfigLayerSchemaTypeEnum {
  Stream = "Stream",
  CustomWMSLayer = "CustomWMSLayer",
  GeoJsonLayer = "GeoJsonLayer",
}

export interface IGetConfigLayerSchemaClickAction {
  action: ClickActionEnum;
  params: {
    zoom?: 17;
  };
}

export interface IGetConfigLayerSchemaGroup {
  id: string;
  name: string;
  ownerGroup?: string;
}

export interface IGetConfigLayerSchema {
  id: string;
  proxyLayerId?: string;
  name: string;
  origin: string;
  isActive: boolean;
  isSelected: boolean;
  type: IGetConfigLayerSchemaTypeEnum;
  isVisible: boolean;
  index?: number;
  minZoom?: number;
  getTextColorPropName?: string;
  getFillColorPropName?: string;
  getLineColorPropName?: string;
  clickAction: IGetConfigLayerSchemaClickAction;
  viewTemplate?: ITemplate[];
  groupId?: string;
  colors: IGetConfigColor[];
  layerGroup: IGetConfigLayerSchemaGroup;
  cqlFilter?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterTree?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any;
  attributeMapping?: Record<string, { name: string; description?: string }>;
}
