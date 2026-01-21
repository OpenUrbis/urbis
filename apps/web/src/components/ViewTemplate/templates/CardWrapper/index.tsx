import { ReactNode } from "react";
import { Card } from "rmwc";
import { ITemplatesDeclaration } from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";
import "./style.scss";

export const CardWrapper: ITemplatesDeclaration = {
  name: "wrapper-card",
  render: ({ template, data, key }) => {
    const { templates = [], label } = template;

    return (
      <Card className="card-details">
        {
          (
            <div className="card-container">
              {label && <h4>{label}:</h4>}
              {templates.map((template, i) => (
                <ViewTemplateEngine
                  key={`${key}-engine-${i}`}
                  template={template}
                  data={data}
                />
              ))}
            </div>
          ) as ReactNode
        }
      </Card>
    ) as ReactNode;
  },
};
