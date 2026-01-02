import { ReactNode } from "react";
import { Card, CardContent } from "@open-urbis/map-ui";
import { Helper } from "../../components/helper";
import { ITemplatesDeclaration } from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";

export const CardWrapper: ITemplatesDeclaration = {
  name: "wrapper-card",
  render: ({ template, data, key, rootTemplate, isPrint }) => {
    const { templates = [], label, properties = {} } = template;

    const renderLabel = () => {
      if (!label) return null;

      return (
        <div className="flex items-center mb-2">
          <Helper properties={properties}>
            <h4 className="font-semibold text-lg">{label}</h4>
          </Helper>
        </div>
      );
    };

    return (
      <Card className="rounded-xl">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>
    ) as ReactNode;
  },
};
