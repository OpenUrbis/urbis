export type PolygonGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

export type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

export type Polygon =
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

export interface ResponseData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  features: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any;
  type: string;
}
