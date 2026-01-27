import { ITemplate } from "./types/templates-type";
import { ViewTemplateEngine } from "./ViewTemplateEngine";

export interface IViewTemplate {
  templates: ITemplate[];
  rootTemplate?: ITemplate[];
  data: unknown;
}

export const ViewTemplate = ({
  templates,
  data,
  rootTemplate,
}: IViewTemplate) => {

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
      }}
    >
      {templates.map((template, i) => (
        <ViewTemplateEngine
          key={`renderTemplate-${i}`}
          template={template}
          data={data}
          rootTemplate={rootTemplate}
        />
      ))}
    </div>
  );
};
