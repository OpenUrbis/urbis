/* eslint-disable @typescript-eslint/no-explicit-any */

import { IListItemsProperties } from "./list-items-type";
import { IPolygonMapProperties } from "./polygon-map-type";
import { IRowWrapperProperties } from "./row-wrapper-type";

export type ITemplateRender = (props: ITemplateProps) => any;

export interface ITemplatesDeclaration {
  name: string;
  render: ITemplateRender;
}

export interface ITemplatesMap {
  [key: string]: ITemplateRender;
}

export interface ITemplate {
  type: string;
  templates?: ITemplate[];
  label?: string;
  value?: string;
  polygonTemplate?: ITemplate[];
  properties?:
    | IRowWrapperProperties
    | IPolygonMapProperties
    | IListItemsProperties
    | unknown;
}

export interface ITemplateProps {
  template: ITemplate;
  data: unknown;
  key?: string;
}
