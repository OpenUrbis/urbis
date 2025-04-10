import { signal, Signal } from "@preact/signals";
import { ComponentChildren, createContext } from "preact";
import { useContext } from "preact/hooks";
import {
  MapBoundingBox,
  MapLayerGroup,
  MapLayerSchema,
} from "../dto/mapContext.dto";

const layersSchema = signal<MapLayerSchema[]>([]);
const layerGroups = signal<MapLayerGroup[]>([]);
const features = signal<any[]>([]);
const selectedFeatures = signal<any[]>([]);
const boundingBox = signal<MapBoundingBox>([
  -47.25677412109369, -23.96496625957735, -46.134795361328045,
  -23.134722829729828,
]);
const viewport = signal<any>({});
const zoom = signal<number>(10);
const editionFeatures = signal<any[]>([]);

interface MapContextType {
  layersSchema: Signal<MapLayerSchema[]>;
  layerGroups: Signal<MapLayerGroup[]>;
  features: Signal<any[]>;
  selectedFeatures: Signal<any[]>;
  boundingBox: Signal<MapBoundingBox>;
  viewport: Signal<any>;
  zoom: Signal<number>;
  editionFeatures: Signal<any[]>;
}

const mapState: MapContextType = {
  layersSchema,
  layerGroups,
  features,
  selectedFeatures,
  boundingBox,
  viewport,
  zoom,
  editionFeatures,
};

export const MapContext = createContext<MapContextType>(mapState);

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context)
    throw new Error("useMapContext must be used within a MapProvider");

  return context;
};

export const MapProvider = ({ children }: { children: ComponentChildren }) => {
  return <MapContext.Provider value={mapState}>{children}</MapContext.Provider>;
};
