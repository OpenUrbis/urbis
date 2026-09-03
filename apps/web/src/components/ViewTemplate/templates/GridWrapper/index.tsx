import { ITemplatesDeclaration } from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";

// Map span (1-12) to Tailwind col-span class
const getSpanClass = (span: number) => {
  if (span < 1) span = 1;
  if (span > 12) span = 12;

  const map: Record<number, string> = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
    7: "md:col-span-7",
    8: "md:col-span-8",
    9: "md:col-span-9",
    10: "md:col-span-10",
    11: "md:col-span-11",
    12: "md:col-span-12",
  };
  return map[span] || "md:col-span-12";
};

export const GridWrapper: ITemplatesDeclaration = {
  name: "wrapper-grid",
  render: ({ template, data, key, rootTemplate, isPrint, viewMode }) => {
    const { templates = [], properties = {} } = template;
    const columns: number[] = (properties as any).columns || [12];
    const cols = columns.length > 0 ? columns : [12];

    // Separate grid items (columns) from builder controls
    const gridItems = templates.filter((t) => t.type !== "builder-add-button");
    const controls = templates.filter((t) => t.type === "builder-add-button");

    // Force mobile layout if viewMode is mobile, otherwise use responsive classes
    const isMobileView = viewMode === "mobile";
    const gridClass = isMobileView
      ? "flex flex-col gap-4 w-full min-w-0"
      : isPrint
        ? "grid grid-cols-1 gap-2 w-full min-w-0"
        : "grid grid-cols-1 md:grid-cols-12 gap-4 w-full min-w-0";

    return (
      <div className="relative w-full group/grid">
        <div className={gridClass}>
          {gridItems.map((childTemplate, i) => {
            const colIndex = i % cols.length;
            const span = cols[colIndex];
            // If mobile view, force full width, otherwise use span class
            const spanClass =
              isMobileView || isPrint ? "w-full" : getSpanClass(span);

            return (
              <div
                key={`${key}-grid-cell-${i}`}
                className={`${spanClass} min-h-[50px] min-w-0`}
              >
                <div className="h-full w-full min-w-0">
                  <ViewTemplateEngine
                    template={childTemplate}
                    data={data}
                    rootTemplate={rootTemplate}
                    isPrint={isPrint}
                    viewMode={viewMode}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Render controls absolutely */}
        {controls.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {controls.map((control, i) => (
              <ViewTemplateEngine
                key={`${key}-control-${i}`}
                template={control}
                data={data}
                rootTemplate={rootTemplate}
                isPrint={isPrint}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
};
