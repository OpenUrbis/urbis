import { ITemplatesDeclaration } from "../dto/templatesDto";
import { CardWrapper } from "./CardWrapper";
import { LabelValueTemplate } from "./LabelValueTemplate";
import { RowWrapper } from "./RowWrapper";

export const VIEW_TEMPLATE_TEMPLATES: ITemplatesDeclaration[] = [
  LabelValueTemplate,
  RowWrapper,
  CardWrapper,
];
