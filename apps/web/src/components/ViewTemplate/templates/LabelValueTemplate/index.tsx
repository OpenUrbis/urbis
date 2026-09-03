import { memo } from "preact/compat";
import { useRenderedValue } from "../../../../hooks/useRenderedValue";
import { Helper } from "../../components/helper";
import {
  ITemplateProps,
  ITemplateRender,
  ITemplatesDeclaration,
} from "../../types/templates-type";
import "./style.scss";

const LabelValueComponent: ITemplateRender = (props: ITemplateProps) => {
  const renderedValue = useRenderedValue(props);
  const { template, isPrint } = props;
  const { properties } = template;

  if (isPrint) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-0.5 overflow-hidden px-1 py-1 text-left text-xs leading-snug sm:grid-cols-[minmax(108px,38%)_minmax(0,1fr)] sm:gap-2">
        <Helper properties={properties}>
          <span className="min-w-0 whitespace-normal break-normal font-semibold text-muted-foreground print:text-slate-500">
            {template?.label}:
          </span>
        </Helper>
        <span
          className="min-w-0 whitespace-normal break-words font-semibold text-foreground print:text-slate-900"
          dangerouslySetInnerHTML={{ __html: renderedValue }}
        />
      </div>
    );
  }

  return (
    <div className="label-value">
      <Helper properties={properties}>
        <span className="label">{template?.label}:</span>
      </Helper>
      <span
        className="value"
        dangerouslySetInnerHTML={{ __html: renderedValue }}
      ></span>
    </div>
  );
};

export const LabelValueTemplate: ITemplatesDeclaration = {
  name: "label-value",
  render: memo(LabelValueComponent),
};
