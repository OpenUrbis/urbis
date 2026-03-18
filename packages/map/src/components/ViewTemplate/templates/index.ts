import { ITemplatesDeclaration } from "../types/templates-type";
import { ButtonTemplate } from "./ButtonTemplate";
import { CardWrapper } from "./CardWrapper";
import { EditPolygonTemplate } from "./EditPolygonTemplate";
import { LabelValueTemplate } from "./LabelValueTemplate";
import { ListItemsWrapper } from "./ListItemsWrapper";
import { PolygonMapTemplate } from "./PolygonMapTemplate";
import { PrimaryItemTemplate } from "./PrimaryItemTemplate";
import { RequestWrapper } from "./RequestWrapper";
import { RowWrapper } from "./RowWrapper";
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
  RowWrapper,
  CardWrapper,
  ListItemsWrapper,
  RequestWrapper,
];
