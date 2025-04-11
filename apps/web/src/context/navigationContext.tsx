import { signal } from "@preact/signals";
import { ComponentChildren, createContext } from "preact";
import { useContext } from "preact/hooks";
import {
  MapBoundingBox,
  MapContextType,
  MapLayerGroup,
  MapLayerSchema,
} from "../dto/mapContextDto";

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

  // Logica

  if (!context)
    throw new Error("useMapContext must be used within a MapProvider");

  return context;
};

export const MapProvider = ({ children }: { children: ComponentChildren }) => {

  return <MapContext.Provider value={mapState}>{children}</MapContext.Provider>;
};
