import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { SearchSchemaFormValues } from "../utils";
import { CodeEditor } from "@/components/CodeEditor";

interface TransformParamsProps {
  onBack: () => void;
  onNext: () => void;
}

export const TransformParams = ({ onBack, onNext }: TransformParamsProps) => {
  const form = useFormContext<SearchSchemaFormValues>();

  return (
    <div className="space-y-6 flex flex-col h-[500px]">
      <div className="flex flex-col flex-1 gap-2">
         <div className="space-y-1">
            <h3 className="text-lg font-medium">Transformar Parâmetros (transformParams)</h3>
            <p className="text-sm text-muted-foreground">
              Função Javascript para transformar os parâmetros de busca antes da requisição.
            </p>
         </div>
        
        <FormField
          control={form.control}
          name="transformParams"
          render={({ field }) => (
            <FormItem className="flex-1 flex flex-col">
              <FormControl>
                <CodeEditor
                  language="javascript"
                  value={field.value || ""}
                  onChange={field.onChange}
                  className="flex-1 min-h-[300px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="outline" type="button">
          Voltar
        </Button>
        <Button onClick={onNext} type="button">
          Próximo
        </Button>
      </div>
    </div>
  );
};
