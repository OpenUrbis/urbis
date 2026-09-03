import { ReadonlySignal, Signal } from "@preact/signals";
import { ITemplate } from "../components/ViewTemplate/types/templates-type";

type PolygonGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

type Polygon =
  | PolygonGeometry
  | MultiPolygonGeometry
  | {
      type: "Feature";
      geometry: PolygonGeometry | MultiPolygonGeometry;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties?: Record<string, any>;
    }
  | {
      type: "FeatureCollection";
      features: Array<{
        type: "Feature";
        geometry: PolygonGeometry | MultiPolygonGeometry;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        properties?: Record<string, any>;
      }>;
    };

export interface PolygonEditContextType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feature: Signal<any>;
  isEditing: Signal<boolean>;
  drawRef: React.RefObject<MapboxDraw | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
  fetchData: (
    polygon: Polygon,
    activeLayers?: string[],
    options?: { isFiu?: boolean; context?: string },
  ) => Promise<void>;
  editFeatureTemplate: ReadonlySignal<ITemplate[] | null>;
  layerWithRootEditTemplate: ReadonlySignal<string | null>;
}

export interface IPolygonEditContextActions extends Omit<
  PolygonEditContextType,
  "feature" | "isEditing"
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feature: ReadonlySignal<any>;
  isEditing: ReadonlySignal<boolean>;
  fetchData: (
    polygon: Polygon,
    activeLayers?: string[],
    options?: { isFiu?: boolean; context?: string },
  ) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFeature: (newFeature: any) => void;
  setIsEditing: (newIsEditing: boolean) => void;
  reset: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editFeature: (data: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDrawRef: (newDrawRef: any) => void;
}
