export interface Polygon {
  type: string;
  coordinates: number[][][];
}

export interface ResponseData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  features: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any;
  type: string;
}
