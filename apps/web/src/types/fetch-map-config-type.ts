import { ClickActionEnum } from "@open-urbis/map-shared";
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
  parentGroup?: IGetConfigLayerGroup;
  childGroups: IGetConfigLayerGroup[];
}

export type IGetConfigFillPattern =
  | "dots"
  | "hatch-1x"
  | "full"
  | "hatch-cross";

export interface IGetConfigColor {
  id: number;
  color: [number, number, number, number];
  pattern: IGetConfigFillPattern;
  label: string;
  type?: "text" | "fill" | "line";
  value: string;
  layerSchemaId: string;
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
  name: string;
  origin: string;
  isActive: boolean;
  type: IGetConfigLayerSchemaTypeEnum;
  isVisible: boolean;
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
  properties: any;
}
