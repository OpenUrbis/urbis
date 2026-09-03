import { Card, CardContent } from "@open-urbis/map-ui";
import { ReactNode } from "react";
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
        <div
          className={
            isPrint ? "flex items-center mb-2" : "flex items-center mb-2"
          }
        >
          <Helper properties={properties}>
            <h4
              className={
                isPrint
                  ? "text-[13px] font-bold uppercase tracking-wide text-foreground print:text-slate-800"
                  : "font-semibold text-lg"
              }
            >
              {label}
            </h4>
          </Helper>
        </div>
      );
    };

    return (
      <Card
        className={
          isPrint
            ? "rounded-xl relative group overflow-visible border-border bg-card shadow-none break-inside-avoid print:border-slate-200 print:bg-white"
            : "rounded-xl relative group overflow-visible"
        }
      >
        <CardContent className={isPrint ? "p-3" : "p-4"}>
          {renderLabel()}
          <div className={isPrint ? "grid gap-2" : undefined}>
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
        </CardContent>
      </Card>
    ) as ReactNode;
  },
};
