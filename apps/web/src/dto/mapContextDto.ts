/* eslint-disable @typescript-eslint/no-explicit-any */
import { TileLayer } from "@deck.gl/geo-layers";
import { GeoJsonLayer } from "@deck.gl/layers";
import { Signal } from "@preact/signals";
import { CustomWMSLayer } from "../components/MapView/CustomWMSLayer";
import { ITemplate } from "../components/ViewTemplate/dto/templatesDto";
import {
  IGetConfigLayerGroup,
  IGetConfigLayerSchema,
  IGetConfigLayerSchemaTypeEnum,
} from "../services/mapService";

export type MapBoundingBox = [number, number, number, number];

export type MapLayerSchemaColor = MapBoundingBox;

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

export interface MapContextType {
  layersSchema: Signal<IGetConfigLayerSchema[]>;
  layerGroups: Signal<IGetConfigLayerGroup[]>;
  selectedFeatures: Signal<MapContextSelectedFeature[]>;
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

export type MapContextLayerSchemaTypeMapProps = {
  zoom: number;
  boundingBox: MapBoundingBox;
};

export type MapContextLayerSchemaTypeMap = {
  [K in IGetConfigLayerSchemaTypeEnum]?: (
    layer: IGetConfigLayerSchema,
    props: MapContextLayerSchemaTypeMapProps
  ) => MapContextRenderedLayer[];
};

export interface MapContextSelectedFeature {
  feature: any;
  template: ITemplate | any;
}
