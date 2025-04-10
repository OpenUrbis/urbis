export type MapBoundingBox = [number, number, number, number];

export type MapLayerSchemaColor = [number, number, number, number];

export type MapLayerSchemaLegend = {
  label: string;
  color: MapLayerSchemaColor;
  pattern?: MapLayerSchemaFillPattern;
};

export type MapLayerSchemaFillPattern =
  | "dots"
  | "hatch-1x"
  | "full"
  | "hatch-cross";

export type MapLayerSchema = {
  id: string;
  name: string;
  "@@type": any;
  labelColor?: MapLayerSchemaColor | MapLayerSchemaColor[];
  urlTemplate?: string;
  data?: string;
  visible: boolean;
  groupId?: string; // Referência ao id do grupo
  minZoom?: number;
  getFillPattern?:
    | MapLayerSchemaFillPattern
    | ((info: any) => MapLayerSchemaFillPattern);
  getFillColor?: MapLayerSchemaColor | ((info: any) => MapLayerSchemaColor);
  getElevation?: number;
  getText?: string | ((info: any) => string);
  isPointLayer?: boolean;
  getTextColor?: MapLayerSchemaColor;
  getLineColor?: MapLayerSchemaColor | ((info: any) => MapLayerSchemaColor);
  getTextSize?: number;
  autoHighlight?: boolean;
  highlightColor?: MapLayerSchemaColor | ((info: any) => MapLayerSchemaColor);
  mapLegend?: MapLayerSchemaLegend[];
};

export type MapLayerGroup = {
  id: string;
  name: string;
  subGroups?: MapLayerGroup[];
}