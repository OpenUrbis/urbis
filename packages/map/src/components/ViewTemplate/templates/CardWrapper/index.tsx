import { ReactNode } from "react";
import { Button, Card, CardContent } from "@open-urbis/map-ui";
import { Helper } from "../../components/helper";
import { ITemplatesDeclaration } from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";
import { FileJson } from "lucide-react";
import { useToast } from "../../../../hooks/useToast";

export const CardWrapper: ITemplatesDeclaration = {
  name: "wrapper-card",
  render: ({ template, data, key, rootTemplate, isPrint }) => {
    const { templates = [], label, properties = {} } = template;
    const { toastSuccess, toastError } = useToast();

    const handleCopyGeoJSON = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        const geojson = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(geojson);
        toastSuccess("GeoJSON copiado com sucesso!");
      } catch (error) {
        console.error("Failed to copy GeoJSON", error);
        toastError("Falha ao copiar GeoJSON.");
      }
    };

    const renderLabel = () => {
      if (!label) return null;

      return (
        <div className="flex items-center mb-2">
          <Helper properties={properties}>
            <h4 className="font-semibold text-lg">{label}</h4>
          </Helper>
        </div>
      );
    };

    return (
      <Card className="rounded-xl relative group overflow-visible">
        {!isPrint && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur shadow-sm hover:bg-accent"
              onClick={handleCopyGeoJSON}
              title="Copiar GeoJSON"
            >
              <FileJson className="h-4 w-4" />
            </Button>
          </div>
        )}
        <CardContent className="p-4">
          {renderLabel()}
          {templates.map((template, i) => (
            <ViewTemplateEngine
              key={`${key}-engine-${i}`}
              template={template}
              data={data}
              rootTemplate={rootTemplate}
              isPrint={isPrint}
            />
          ))}
        </CardContent>
      </Card>
    ) as ReactNode;
  },
};
