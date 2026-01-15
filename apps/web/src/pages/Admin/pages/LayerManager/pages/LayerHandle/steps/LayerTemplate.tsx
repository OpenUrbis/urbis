import { CodeEditor } from "@/components/CodeEditor";
import { viewTemplateSchema } from "@/components/ViewTemplateSchema";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormContext } from "react-hook-form";

interface LayerTemplateProps {
  onNext: () => void;
  onBack: () => void;
}

export const LayerTemplate = ({ onNext, onBack }: LayerTemplateProps) => {
  const form = useFormContext();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 flex flex-col h-full">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Template de Visualização</h3>
        <p className="text-sm text-muted-foreground">
          Configure o template JSON que será utilizado para exibir os detalhes
          da feature quando a ação &quot;openFeature&quot; estiver configurada como
          &quot;root&quot;.
        </p>
      </div>

      <FormField
        control={form.control}
        name="viewTemplate"
        render={({ field }) => (
          <FormItem className="flex-1 flex flex-col min-h-0">
            <FormLabel className="sr-only">Template JSON</FormLabel>
            <div className="flex-1 relative min-h-[400px]">
              <CodeEditor
                value={field.value || ""}
                onChange={field.onChange}
                language="json"
                schema={viewTemplateSchema}
                className="absolute inset-0"
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button type="button" onClick={onNext}>
          Próximo <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
