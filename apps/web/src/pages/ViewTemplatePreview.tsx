import { Button } from "@open-urbis/map-ui";
import { Laptop, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { buildSemanticTemplateColumns } from "../components/ViewTemplate";
import { ViewTemplateEngine } from "../components/ViewTemplate/ViewTemplateEngine";
import { ITemplate } from "../components/ViewTemplate/types/templates-type";

const ViewTemplatePreview = () => {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile" | "prancha">(
    "desktop",
  );
  const [data, setData] = useState<{
    template: ITemplate[];
    mockData: any;
  } | null>(null);

  const semanticColumns = buildSemanticTemplateColumns(data?.template ?? [], 3);

  useEffect(() => {
    const stored = localStorage.getItem("view-template-preview-data");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse preview data", e);
      }
    }
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Carregando preview... ou nenhum dado encontrado.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-muted/10">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-background shadow-sm shrink-0">
        <h1 className="text-lg font-bold">Preview do Template</h1>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border">
          <Button
            variant={viewMode === "desktop" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("desktop")}
            className="gap-2"
          >
            <Laptop className="h-4 w-4" />
            PC (A4)
          </Button>
          <Button
            variant={viewMode === "mobile" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("mobile")}
            className="gap-2"
          >
            <Smartphone className="h-4 w-4" />
            Mobile
          </Button>
          <Button
            variant={viewMode === "prancha" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("prancha")}
            className="gap-2"
          >
            Prancha
          </Button>
        </div>
        <div className="w-20" /> {/* Spacer for centering if needed */}
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-100">
        <div
          className={`bg-white shadow-lg transition-all duration-300 min-h-[842px] ${
            viewMode === "mobile"
              ? "w-[375px]"
              : viewMode === "prancha"
                ? "w-[1400px] max-w-full"
                : "w-[794px]"
          }`}
          style={{
            // A4 dimensions: 210mm x 297mm. At 96 DPI: ~794px x 1123px.
            // Mobile: 375px is standard iPhone width.
            minHeight: viewMode === "mobile" ? "667px" : "1123px",
          }}
        >
          <div className="p-8">
            {viewMode === "prancha" ? (
              <div className="hidden md:flex gap-6 w-full items-start">
                {semanticColumns.map((columnTemplates, columnIndex) => {
                  if (!columnTemplates.length) return null;

                  return (
                    <div
                      className="flex-1 flex flex-col gap-6"
                      key={`preview-board-col-${columnIndex + 1}`}
                    >
                      {columnTemplates.map((template, templateIndex) => (
                        <ViewTemplateEngine
                          key={
                            template.id ||
                            `preview-board-${columnIndex}-${templateIndex}`
                          }
                          template={template}
                          data={data.mockData}
                          rootTemplate={data.template}
                          viewMode="desktop"
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              data.template.map((t, i) => (
                <ViewTemplateEngine
                  key={t.id || `preview-${i}`}
                  template={t}
                  data={data.mockData}
                  rootTemplate={data.template}
                  viewMode={viewMode}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTemplatePreview;
