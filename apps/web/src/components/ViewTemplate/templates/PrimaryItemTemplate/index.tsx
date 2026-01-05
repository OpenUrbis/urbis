import { memo } from "preact/compat";
import { useRenderedValue } from "../../../../hooks/useRenderedValue";
import {
  ITemplateProps,
  ITemplateRender,
  ITemplatesDeclaration,
} from "../../types/templates-type";

const PrimaryItemComponent: ITemplateRender = (props: ITemplateProps) => {
  const renderedValue = useRenderedValue(props);

  return (
    <span
      className="block text-sm font-medium text-foreground"
      dangerouslySetInnerHTML={{ __html: renderedValue }}
    />
  );
};

export const PrimaryItemTemplate: ITemplatesDeclaration = {
  name: "primary-item",
  render: memo(PrimaryItemComponent),
};
