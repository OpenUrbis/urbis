import { useState } from "react";
import { ViewTemplateBuilder } from "../../components/ViewTemplate/builder/ViewTemplateBuilder";
import { ITemplate } from "../../components/ViewTemplate/types/templates-type";
import { useToast } from "@/hooks/use-toast";

export const ViewTemplateEditorPage = () => {
  const { toast } = useToast()
  const [currentTemplate, setCurrentTemplate] = useState<ITemplate[] | undefined>(
    undefined,
  );

  const handleSave = (template: ITemplate[]) => {
    const jsonString = JSON.stringify(template, null, 2);
    console.log("Saved:", template);
    // Copy to clipboard
    navigator.clipboard.writeText(jsonString).then(() => {
      toast({ description: "JSON copiado para a área de transferência e exportado no console" });
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ViewTemplateBuilder
          initialGeoLayerFullURL={"https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Aareas_de_protecao_e_recuperacao_dos_mananciais&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326"}
          initialTemplate={currentTemplate}
          onSave={handleSave}
          onLoad={(template) => {
            setCurrentTemplate(template);
          }}
        />
      </div>
    </div>
  );
};

export default ViewTemplateEditorPage;
