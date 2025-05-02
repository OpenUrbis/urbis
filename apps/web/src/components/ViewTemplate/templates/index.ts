import { ITemplatesDeclaration } from "../types/templates-type";
import { CardWrapper } from "./CardWrapper";
import { LabelValueTemplate } from "./LabelValueTemplate";
import { ListItemsWrapper } from "./ListItemsWrapper";
import { PolygonMapTemplate } from "./PolygonMapTemplate";
import { PrimaryItemTemplate } from "./PrimaryItemTemplate";
import { ProtocolActionTemplate } from "./ProtocolActionTemplate";
import { RowWrapper } from "./RowWrapper";
import { SecondaryItemTemplate } from "./SecondaryItemTemplate";

export const VIEW_TEMPLATE_TEMPLATES: ITemplatesDeclaration[] = [
  // Templates
  LabelValueTemplate,
  ProtocolActionTemplate,
  PolygonMapTemplate,
  PrimaryItemTemplate,
  SecondaryItemTemplate,

  // Wrappers
  RowWrapper,
  CardWrapper,
  ListItemsWrapper,
];
