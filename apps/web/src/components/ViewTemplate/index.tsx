import { buildSemanticTemplateGridItems } from "./semantic-columns";
import { ITemplate } from "./types/templates-type";
import { ViewTemplateEngine } from "./ViewTemplateEngine";

export {
  buildSemanticTemplateColumns,
  buildSemanticTemplateGridItems,
} from "./semantic-columns";

export interface IViewTemplate {
  templates: ITemplate[];
  rootTemplate?: ITemplate[];
  data: unknown;
  isPrint?: boolean;
  layoutMode?: "stack" | "semantic-grid";
  defaultSpan?: number;
}

export const ViewTemplate = ({
  templates,
  data,
  rootTemplate,
  isPrint,
  layoutMode = "stack",
  defaultSpan = 4,
}: IViewTemplate) => {
  if (layoutMode === "semantic-grid") {
    const gridItems = buildSemanticTemplateGridItems(templates, defaultSpan);

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {gridItems.map(({ template, span, sourceIndex }, i) => (
          <div
            key={`renderTemplate-${sourceIndex}-${i}`}
            style={{ gridColumn: `span ${span} / span ${span}` }}
          >
            <ViewTemplateEngine
              template={template}
              data={data}
              rootTemplate={rootTemplate}
              isPrint={isPrint}
            />
          </div>
        ))}
      </div>
    );
  }

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
          isPrint={isPrint}
        />
      ))}
    </div>
  );
};
