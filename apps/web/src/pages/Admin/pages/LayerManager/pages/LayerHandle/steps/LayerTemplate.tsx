import { ViewTemplateBuilder } from "@/components/ViewTemplate/builder/ViewTemplateBuilder";
import { parseAndNormalizeViewTemplate } from "@/components/ViewTemplate/utils/normalize-template-ids";
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
  fieldName?: "viewTemplate" | "boardTemplate";
  title?: string;
  subtitle?: string;
}

export const LayerTemplate = ({
  fieldName = "viewTemplate",
  title = "Template de Visualização",
  subtitle = "Configure o template que será utilizado para exibir os detalhes da feature.",
}: LayerTemplateProps) => {
  const form = useFormContext();

  const url = form.watch("url");
  const origin = form.watch("origin");
  const selectedLayer = form.watch("selectedLayer");

  const initialTemplate = useMemo(() => {
    const value = form.getValues(fieldName);
    return parseAndNormalizeViewTemplate(value);
  }, [fieldName, form]);

  const propertyMapping = form.watch("propertyMapping");

  return (
    <div className="animate-in fade-in slide-in-from-right-4 relative flex h-full min-h-0 w-full flex-1 flex-col">
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="m-0 flex h-full w-full flex-1 min-h-0 flex-col overflow-hidden border-none p-0">
            <FormLabel className="sr-only">{title}</FormLabel>
            <div className="relative flex h-full flex-1 flex-col overflow-hidden">
              <ViewTemplateBuilder
                initialTemplate={initialTemplate}
                initialGeoUrl={url}
                initialGeoLayerFullURL={origin}
                initialGeoLayer={selectedLayer?.name}
                propertyMapping={propertyMapping}
                title={title}
                subtitle={subtitle}
                standalone={false}
                onChange={(newTemplate) => {
                  const currentValue = form.getValues(fieldName);
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
