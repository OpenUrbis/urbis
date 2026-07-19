import { memo } from "preact/compat";
import { useRenderedValue } from "../../../../hooks/useRenderedValue";
import {
  ITemplateProps,
  ITemplateRender,
  ITemplatesDeclaration,
} from "../../types/templates-type";

const SecondaryItemComponent: ITemplateRender = (props: ITemplateProps) => {
  const renderedValue = useRenderedValue(props);

  return (
    <span
      className="block text-xs text-muted-foreground w-full"
      dangerouslySetInnerHTML={{ __html: renderedValue }}
    />
  );
};

export const SecondaryItemTemplate: ITemplatesDeclaration = {
  name: "secondary-item",
  render: memo(SecondaryItemComponent),
};
