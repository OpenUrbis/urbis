import { useState } from "react";
import { ViewTemplateBuilder } from "../../../../components/ViewTemplate/builder/ViewTemplateBuilder";
import { ITemplate } from "../../../../components/ViewTemplate/types/templates-type";

export const ViewTemplateEditorPage = () => {
  const [currentTemplate, setCurrentTemplate] = useState<ITemplate | undefined>(
    undefined,
  );

  const handleSave = (template: ITemplate) => {
    const jsonString = JSON.stringify(template, null, 2);
    console.log("Saved:", template);
    // Copy to clipboard
    navigator.clipboard.writeText(jsonString).then(() => {
      alert("JSON copiado para a área de transferência e exportado no console");
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ViewTemplateBuilder
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
