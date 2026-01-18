import { signal } from "@preact/signals";
import { ComponentChildren, createContext } from "preact";
import { useContext } from "preact/hooks";
import {
  MapBoundingBox,
  MapContextType,
  MapLayerGroup,
} from "../../dto/mapContextDto";
import { IGetConfigLayerSchema } from "../../services/mapService";
import { getMapHandlers } from "./handlesMapContext";

const layersSchema = signal<IGetConfigLayerSchema[]>([]);
const layerGroups = signal<MapLayerGroup[]>([]);

const selectedFeatures = signal<any[]>([]);
const boundingBox = signal<MapBoundingBox>([
  -47.25677412109369, -23.96496625957735, -46.134795361328045,
  -23.134722829729828,
]);
const viewport = signal<any>(undefined);
const zoom = signal<number>(10);
const editionFeatures = signal<any[]>([]);

const mapState: MapContextType = {
  layersSchema,
  layerGroups,
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

  return { ...context, ...getMapHandlers(context) };
};

export const MapProvider = ({ children }: { children: ComponentChildren }) => {
  return <MapContext.Provider value={mapState}>{children}</MapContext.Provider>;
};
