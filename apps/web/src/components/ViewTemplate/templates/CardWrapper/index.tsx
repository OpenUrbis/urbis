import { ReactNode } from "react";
import { Card } from "rmwc";
import { ITemplate, ITemplatesDeclaration } from "../../dto/templatesDto";
import { ViewTemplateEngine } from "../../engine";
import "./style.scss";

export const CardWrapper: ITemplatesDeclaration = {
  name: "wrapper-card",
  render: ({ template, data }) => {
    const { templates = [], label } = template;

    const renderColumn = (template: ITemplate) => (
      <ViewTemplateEngine template={template} data={data} />
    );

    return (
      <Card className="card-details">
        {
          (
            <div className="card-container">
              {label && <h4>{label}:</h4>}
              {templates.map((template) => renderColumn(template))}
            </div>
          ) as ReactNode
        }
      </Card>
    ) as ReactNode;
  },
};
