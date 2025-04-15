/* eslint-disable @typescript-eslint/no-explicit-any */
import { TileLayer } from "@deck.gl/geo-layers";
import { GeoJsonLayer } from "@deck.gl/layers";
import { Signal } from "@preact/signals";
import { CustomWMSLayer } from "../components/MapView/CustomWMSLayer";
import {
  IGetConfigLayerSchema,
  IGetConfigLayerSchemaTypeEnum,
} from "../services/mapService";

export type MapBoundingBox = [number, number, number, number];

export type MapLayerSchemaColor = [number, number, number, number];

/* export type MapLayerSchema = {
  id: string;
  name: string;
  "@@type": MapContextLayerSchemaType;
  labelColor?: MapLayerSchemaColor | MapLayerSchemaColor[];
  urlTemplate?: string;
  data?: string;
  visible: boolean;
  groupId?: string; // Referência ao id do grupo
  minZoom?: number;
  getFillPattern?:
    | MapLayerSchemaFillPattern
    | ((info: any) => MapLayerSchemaFillPattern);
  getFillColor?: MapLayerSchemaColor | ((info: any) => MapLayerSchemaColor);
  getElevation?: number;
  getText?: string | ((info: any) => string);
  isPointLayer?: boolean;
  getTextColor?: MapLayerSchemaColor;
  getLineColor?: MapLayerSchemaColor | ((info: any) => MapLayerSchemaColor);
  getTextSize?: number;
  autoHighlight?: boolean;
  highlightColor?: MapLayerSchemaColor | ((info: any) => MapLayerSchemaColor);
  mapLegend?: MapLayerSchemaLegend[];
}; */

export type MapLayerGroup = {
  id: string;
  name: string;
  subGroups?: MapLayerGroup[];
};

export interface MapContextType {
  layersSchema: Signal<IGetConfigLayerSchema[]>;
  layerGroups: Signal<MapLayerGroup[]>;
  features: Signal<any[]>;
  selectedFeatures: Signal<any[]>;
  boundingBox: Signal<MapBoundingBox>;
  viewport: Signal<any>;
  zoom: Signal<number>;
  editionFeatures: Signal<any[]>;
}

export type MapContextLayerSchemaType =
  | "TileLayer"
  | "GeoJsonLayer"
  | "CustomWMSLayer"
  | "Custom";

export type MapContextRenderedLayer =
  | TileLayer
  | GeoJsonLayer
  | CustomWMSLayer
  | null;

export type MapContextLayerSchemaTypeMap = {
  [K in IGetConfigLayerSchemaTypeEnum]?: (
    layer: IGetConfigLayerSchema
  ) => MapContextRenderedLayer;
};
