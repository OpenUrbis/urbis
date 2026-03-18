import { ViewTemplateBuilder } from "@/components/ViewTemplate/builder/ViewTemplateBuilder";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { useMemo } from "react";

interface LayerTemplateProps {
  onNext?: () => void;
  onBack?: () => void;
}

export const LayerTemplate = ({}: LayerTemplateProps) => {
  const form = useFormContext();

  const url = form.watch("url");
  const origin = form.watch("origin")
  const selectedLayer = form.watch("selectedLayer");

  const initialTemplate = useMemo(() => {
    const value = form.getValues("viewTemplate");
    if (!value) return [];
    try {
      if (typeof value === "string") {
        return JSON.parse(value);
      }
      return value;
    } catch {
      return [];
    }
  }, []); // Only parse on initial mount

  return (
    <div className="animate-in fade-in slide-in-from-right-4 flex flex-col h-full w-full relative flex-1 min-h-0">
      <FormField
        control={form.control}
        name="viewTemplate"
        render={({ field }) => (
          <FormItem className="flex-1 flex flex-col min-h-0 overflow-hidden m-0 p-0 border-none w-full h-full">
            <FormLabel className="sr-only">Template</FormLabel>
            <div className="flex-1 relative flex flex-col h-full overflow-hidden">
              <ViewTemplateBuilder
                initialTemplate={initialTemplate}
                initialGeoUrl={url}
                initialGeoLayerFullURL={origin}
                initialGeoLayer={selectedLayer?.name}
                title="Template de Visualização"
                subtitle="Configure o template que será utilizado para exibir os detalhes da feature."
                standalone={false}
                onChange={(newTemplate) => {
                  const currentValue = form.getValues("viewTemplate");
                  const newValue = JSON.stringify(newTemplate, null, 2);
                  // Somente atualize se o valor for realmente diferente, para evitar loops infinitos
                  if (currentValue !== newValue) {
                    field.onChange(newValue);
                  }
                }}
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

    </div>
  );
};
