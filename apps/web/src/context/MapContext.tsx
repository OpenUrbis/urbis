import { signal } from "@preact/signals";
import { ComponentChildren, createContext } from "preact";
import { useRef } from "react";
import {
  IGetConfigLayerGroup,
  IGetConfigLayerSchema,
} from "../types/fetch-map-config-type";
import { MapBoundingBox, MapContextType } from "../types/map-context-type";

const layerSchemas = signal<IGetConfigLayerSchema[]>([]);
const layerGroups = signal<IGetConfigLayerGroup[]>([]);
const selectedFeatures = signal<any[]>([]);
const boundingBox = signal<MapBoundingBox>([
  -47.25677412109369, -23.96496625957735, -46.134795361328045,
  -23.134722829729828,
]);
const viewport = signal<any>(undefined);
const zoom = signal<number>(10);

export const MapContext = createContext<MapContextType | null>(null);

export const MapProvider = ({ children }: { children: ComponentChildren }) => {
  return (
    <MapContext.Provider
      value={{
        layerSchemas,
        layerGroups,
        selectedFeatures,
        boundingBox,
        viewport,
        zoom,
        overlayRef: useRef(null),
      }}
    >
      {children}
    </MapContext.Provider>
  );
};
