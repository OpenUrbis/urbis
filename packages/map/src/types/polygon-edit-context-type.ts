import { ReadonlySignal, Signal } from "@preact/signals-react";
import { ITemplate } from "../components/ViewTemplate/types/templates-type";

interface Polygon {
  type: string;
  coordinates: number[][][];
}

export interface PolygonEditContextType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feature: Signal<any>;
  isEditing: Signal<boolean>;
  drawRef: React.RefObject<MapboxDraw | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Signal<any | null>;
  loading: Signal<boolean>;
  error: Signal<string | null>;
  reset: () => void;
  fetchData: (polygon: Polygon) => Promise<void>;
  editFeatureTemplate: ReadonlySignal<ITemplate[] | null>;
  layerWithRootEditTemplate: ReadonlySignal<string | null>;
}

export interface IPolygonEditContextActions
  extends Omit<PolygonEditContextType, "feature" | "isEditing"> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feature: ReadonlySignal<any>;
  isEditing: ReadonlySignal<boolean>;
  fetchData: (polygon: Polygon) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFeature: (newFeature: any) => void;
  setIsEditing: (newIsEditing: boolean) => void;
  reset: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editFeature: (data: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDrawRef: (newDrawRef: any) => void;
}
