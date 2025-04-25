import { TileLayer } from "@deck.gl/geo-layers";
import { GeoJsonLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { Signal } from "@preact/signals";
import { CustomWMSLayer } from "../components/MapView/CustomWMSLayer";
import { ITemplate } from "../components/ViewTemplate/types/templates-type";
import {
  IGetConfigLayerGroup,
  IGetConfigLayerSchema,
  IGetConfigLayerSchemaTypeEnum,
} from "./fetch-map-config-type";

export type MapBoundingBox = [number, number, number, number];

export type MapLayerSchemaColor = MapBoundingBox;

export interface MapContextType {
  layerSchemas: Signal<IGetConfigLayerSchema[]>;
  layerGroups: Signal<IGetConfigLayerGroup[]>;
  selectedFeatures: Signal<MapContextSelectedFeature[]>;
  boundingBox: Signal<MapBoundingBox>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewport: Signal<any>;
  zoom: Signal<number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editionFeatures: Signal<any[]>;
  overlayRef?: React.RefObject<MapboxOverlay | null>;
}

export type MapContextLayerSchemaType =
  | "TileLayer"
  | "GeoJsonLayer"
  | "CustomWMSLayer"
  | "Stream";

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
  feature: unknown;
  template: ITemplate[];
}

export interface IMapContextActions extends MapContextType {
  handleVisibleLayer: (layerId: string) => void;
  populateMapContext: () => Promise<void>;
  selectFeature: (feature: MapContextSelectedFeature) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleViewportChange: (viewport: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flyTo: (destination: any) => void;
}

export interface IMapActionProps extends Partial<MapContextSelectedFeature> {
  latitude: number;
  longitude: number;
}
