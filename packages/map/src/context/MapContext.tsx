import { signal } from "@preact/signals";
import { createContext, ReactNode, useRef } from "react";
import { ITemplate } from "../components/ViewTemplate/types/templates-type";
import {
  IGetConfigLayerGroup,
  IGetConfigLayerSchema,
} from "../types/fetch-map-config-type";
import { MapBoundingBox, MapContextType } from "../types/map-context-type";

const layerSchemas = signal<IGetConfigLayerSchema[]>([]);
const layerGroups = signal<IGetConfigLayerGroup[]>([]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectedFeatures = signal<any[]>([]);
const boundingBox = signal<MapBoundingBox>([
  -47.25677412109369, -23.96496625957735, -46.134795361328045,
  -23.134722829729828,
]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const viewport = signal<any>(undefined);
const zoom = signal<number>(10);
const is3DActive = signal<boolean>(true);
const selectedBaseMap = signal<
  "standard" | "light" | "dark" | "outdoors" | "satellite" | "satellite-streets"
>("standard");
const selectedBaseMaps = signal<any[]>(["standard"]);
const baseMapOpacity = signal<number>(100);
const baseMapOpacities = signal<Record<string, number>>({});
const baseMapSaturation = signal<number>(100);
const baseMap3DOpacity = signal<number>(45);
const editFeatureTemplate = signal<ITemplate[]>([]);
const layerWithRootEditTemplate = signal<string>("");
const cursorPosition = signal<{ latitude: number; longitude: number } | null>(
  null,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const digitalAddressFeature = signal<any | null>(null);
const isPickingLocation = signal<boolean>(false);
const onLocationPick = signal<((lat: number, lon: number) => void) | null>(
  null,
);
const disablePadding = signal<boolean>(false);

export const MapContext = createContext<MapContextType | null>(null);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  return (
    <MapContext.Provider
      value={{
        layerSchemas,
        layerGroups,
        selectedFeatures,
        boundingBox,
        viewport,
        zoom,
        is3DActive,
        selectedBaseMap,
        selectedBaseMaps,
        baseMapOpacity,
        baseMapOpacities,
        baseMapSaturation,
        baseMap3DOpacity,
        editFeatureTemplate,
        layerWithRootEditTemplate,
        cursorPosition,
        digitalAddressFeature,
        isPickingLocation,
        onLocationPick,
        disablePadding,
        overlayRef: useRef(null),
      }}
    >
      {children}
    </MapContext.Provider>
  );
};
