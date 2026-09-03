import { ITemplatesDeclaration } from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";

export const GridColumn: ITemplatesDeclaration = {
  name: "wrapper-grid-column",
  render: ({ template, data, key, rootTemplate, isPrint }) => {
    const { templates = [] } = template;

    return (
      <div className={isPrint ? "grid h-full min-w-0 gap-2" : "h-full min-w-0"}>
        {templates.map((childTemplate, i) => (
          <ViewTemplateEngine
            key={`${key}-col-child-${i}`}
            template={childTemplate}
            data={data}
            rootTemplate={rootTemplate}
            isPrint={isPrint}
          />
        ))}
      </div>
    );
  },
};
