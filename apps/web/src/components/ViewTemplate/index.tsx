import { ITemplate } from "./types/templates-type";
import { ViewTemplateEngine } from "./ViewTemplateEngine";

export interface IViewTemplate {
  templates: ITemplate[];
  data: unknown;
}

export const ViewTemplate = ({ templates, data }: IViewTemplate) => {
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
        />
      ))}
    </div>
  );
};
