import { memo } from "preact/compat";
import { useRenderedValue } from "../../../../hooks/useRenderedValue";
import {
  ITemplateProps,
  ITemplateRender,
  ITemplatesDeclaration,
} from "../../types/templates-type";
import "./style.scss";

const LabelValueComponent: ITemplateRender = (props: ITemplateProps) => {
  const renderedValue = useRenderedValue(props);
  const { template } = props;

  return (
    <div className="label-value">
      <span className="label">{template?.label}:</span>
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
