/* eslint-disable @typescript-eslint/no-explicit-any */

import { IListItemsProperties } from "./list-items-type";
import { IPolygonMapProperties } from "./polygon-map-type";

export type ITemplateRender = (props: ITemplateProps) => any;

export interface ITemplatesDeclaration {
  name: string;
  render: ITemplateRender;
  hiddenOnPrint?: boolean;
}

export interface ITemplatesMap {
  [key: string]: ITemplateRender;
}

export interface ITemplate {
  id?: string;
  type: string;
  templates?: ITemplate[];
  label?: string;
  value?: string;
  polygonTemplate?: ITemplate[];
  properties?: IPolygonMapProperties | IListItemsProperties | unknown;
}

export interface ITemplateProps {
  template: ITemplate;
  data: unknown;
  key?: string;
  rootTemplate?: ITemplate[];
  isPrint?: boolean;
  viewMode?: "desktop" | "mobile";
}
