import { ITemplatesDeclaration } from "../types/templates-type";
import { CardWrapper } from "./CardWrapper";
import { LabelValueTemplate } from "./LabelValueTemplate";
import { ProtocolActionTemplate } from "./ProtocolActionTemplate";
import { RowWrapper } from "./RowWrapper";

export const VIEW_TEMPLATE_TEMPLATES: ITemplatesDeclaration[] = [
  LabelValueTemplate,
  ProtocolActionTemplate,
  RowWrapper,
  CardWrapper,
];
