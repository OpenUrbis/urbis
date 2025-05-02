import { memo } from "preact/compat";
import { ListItemSecondaryText } from "rmwc";
import { useRenderedValue } from "../../../../hooks/useRenderedValue";
import {
  ITemplateProps,
  ITemplateRender,
  ITemplatesDeclaration,
} from "../../types/templates-type";

const SecondaryItemComponent: ITemplateRender = (props: ITemplateProps) => {
  const renderedValue = useRenderedValue(props);

  return (
    <ListItemSecondaryText
      style={{ maxWidth: "100%!important" }}
      dangerouslySetInnerHTML={{ __html: renderedValue }}
    />
  );
};

export const SecondaryItemTemplate: ITemplatesDeclaration = {
  name: "secondary-item",
  render: memo(SecondaryItemComponent),
};
