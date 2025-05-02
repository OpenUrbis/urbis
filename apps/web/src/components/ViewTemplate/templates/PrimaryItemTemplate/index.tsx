import { memo } from "preact/compat";
import { ListItemPrimaryText } from "rmwc";
import { useRenderedValue } from "../../../../hooks/useRenderedValue";
import {
  ITemplateProps,
  ITemplateRender,
  ITemplatesDeclaration,
} from "../../types/templates-type";

const PrimaryItemComponent: ITemplateRender = (props: ITemplateProps) => {
  const renderedValue = useRenderedValue(props);

  return (
    <ListItemPrimaryText
      style={{ maxWidth: "350px!important" }}
      dangerouslySetInnerHTML={{ __html: renderedValue }}
    />
  );
};

export const PrimaryItemTemplate: ITemplatesDeclaration = {
  name: "primary-item",
  render: memo(PrimaryItemComponent),
};
