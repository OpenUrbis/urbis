import { IRowWrapperProperties } from "../../dto/rowWrapperDto";
import { ITemplate, ITemplatesDeclaration } from "../../dto/templatesDto";
import { ViewTemplateEngine } from "../../engine";

export const RowWrapper: ITemplatesDeclaration = {
  name: "wrapper-row",
  render: ({ template, data }) => {
    const { templates = [] } = template;

    const renderColumn = (template: ITemplate) => {
      const { columnClass = "" } = template.properties as IRowWrapperProperties;
      const className = `col ${columnClass}`;

      return (
        <div className={className}>
          <ViewTemplateEngine template={template} data={data} />
        </div>
      );
    };

    return (
      <div className="row">
        {templates.map((template) => renderColumn(template))}
      </div>
    );
  },
};
