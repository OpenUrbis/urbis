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
      className={
        props.isPrint
          ? "mt-0.5 block w-full text-[11px] leading-snug text-muted-foreground print:text-slate-500"
          : "block text-xs text-muted-foreground w-full"
      }
      dangerouslySetInnerHTML={{ __html: renderedValue }}
    />
  );
};

export const SecondaryItemTemplate: ITemplatesDeclaration = {
  name: "secondary-item",
  render: memo(SecondaryItemComponent),
};
