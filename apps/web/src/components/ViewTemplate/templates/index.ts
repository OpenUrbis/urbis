import { ITemplatesDeclaration } from "../types/templates-type";
import { ButtonTemplate } from "./ButtonTemplate";
import { CardWrapper } from "./CardWrapper";
import { EditPolygonTemplate } from "./EditPolygonTemplate";
import { GridColumn } from "./GridColumn";
import { GridWrapper } from "./GridWrapper";
import { LabelValueTemplate } from "./LabelValueTemplate";
import { ListItemsWrapper } from "./ListItemsWrapper";
import { PolygonMapTemplate } from "./PolygonMapTemplate";
import { PrimaryItemTemplate } from "./PrimaryItemTemplate";
import { RequestWrapper } from "./RequestWrapper";
import { SecondaryItemTemplate } from "./SecondaryItemTemplate";

export const VIEW_TEMPLATE_TEMPLATES: ITemplatesDeclaration[] = [
  // Templates
  LabelValueTemplate,
  EditPolygonTemplate,
  PolygonMapTemplate,
  PrimaryItemTemplate,
  SecondaryItemTemplate,
  ButtonTemplate,

  // Wrappers
  CardWrapper,
  ListItemsWrapper,
  RequestWrapper,
  GridWrapper,
  GridColumn,
];
