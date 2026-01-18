import { Data as ejsData, render as ejsRender } from "ejs";
import { memo, useMemo } from "preact/compat";
import {
  ITemplateProps,
  ITemplateRender,
  ITemplatesDeclaration,
} from "../../dto/templatesDto";
import "./style.scss";

const LabelValueComponent: ITemplateRender = ({
  template,
  data,
}: ITemplateProps) => {
  const renderedValue = useMemo(() => {
    const templateValue = template?.value;
    if (!templateValue) return "-";
    return ejsRender(templateValue, data as ejsData);
  }, [template?.value, data]);

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
