import { ReactNode } from "react";
import { Card } from "rmwc";
import { Helper } from "../../components/helper";
import { ITemplatesDeclaration } from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";
import "./style.scss";

export const CardWrapper: ITemplatesDeclaration = {
  name: "wrapper-card",
  render: ({ template, data, key, rootTemplate, isPrint }) => {
    const { templates = [], label, properties = {} } = template;

    const renderLabel = () => {
      if (!label) return null;

      return (
        <div className="d-flex align-items-center helper-container">
          <Helper properties={properties}>
            <h4>{label}</h4>
          </Helper>
        </div>
      );
    };

    return (
      <Card className="card-details">
        {
          (
            <div className="card-container">
              {renderLabel()}
              {templates.map((template, i) => (
                <ViewTemplateEngine
                  key={`${key}-engine-${i}`}
                  template={template}
                  data={data}
                  rootTemplate={rootTemplate}
                  isPrint={isPrint}
                />
              ))}
            </div>
          ) as ReactNode
        }
      </Card>
    ) as ReactNode;
  },
};
