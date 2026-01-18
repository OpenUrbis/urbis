import { ITemplate } from "./dto/templatesDto";
import { ViewTemplateEngine } from "./engine";

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
