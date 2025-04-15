/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapBoundingBox } from "../dto/mapContextDto";

const environment = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface IGetConfigResponse {
  boundingBox: MapBoundingBox;
  zoom: number;
  bearing: number;
  pitch: number;
  padding: IGetConfigPadding;
  layerGroups: IGetConfigLayerGroup[];
  layerSchemas: IGetConfigLayerSchema[];
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

export interface IGetConfigLayerSchema {
  id: string;
  name: string;
  origin: string;
  isActive: boolean;
  type: IGetConfigLayerSchemaTypeEnum;
  isVisible: boolean;
  canEditFeature: boolean;
  minZoom?: number;
  getTextColorPropName?: string;
  getFillColorPropName?: string;
  getLineColorPropName?: string;
  clickAction: any;
  viewTemplate: any;
  groupId?: string;
  colors: IGetConfigColor[];
  properties: any;
}

export const getMapConfig = async (): Promise<IGetConfigResponse> => {
  const response = await fetch(`${environment}/map-config`);
  if (!response.ok) {
    throw new Error("Failed to fetch map config");
  }

  return await response.json();
};
