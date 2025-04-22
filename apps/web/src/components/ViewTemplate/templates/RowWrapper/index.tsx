import { IRowWrapperProperties } from "../../types/row-wrapper-type";
import { ITemplatesDeclaration } from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";

export const RowWrapper: ITemplatesDeclaration = {
  name: "wrapper-row",
  render: ({ template, data, key }) => {
    const { templates = [] } = template;

    return (
      <div className="row">
        {templates.map((template, i) => (
          <div
            className={`col ${(template.properties as IRowWrapperProperties)?.columnClass ?? ""}`}
            key={`${key}-row-${i}`}
          >
            <ViewTemplateEngine template={template} data={data} />
          </div>
        ))}
      </div>
    );
  },
};
