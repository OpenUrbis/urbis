import { ReadonlySignal, Signal } from "@preact/signals-react";

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
  data: any | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
  fetchData: (polygon: Polygon) => Promise<void>;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDrawRef: (newDrawRef: any) => void;
}
