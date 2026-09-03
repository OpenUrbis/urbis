import { ClickActionEnum } from "@open-urbis/map-shared";
import { ITemplate } from "./templates-type";

export interface IListItemsProperties {
  data?: string;
  onItemClick?: {
    action: ClickActionEnum;
    params: { template: string | ITemplate };
  };
  twoLine?: boolean;
  printColumns?: 1 | 2 | 3 | 4;
}
