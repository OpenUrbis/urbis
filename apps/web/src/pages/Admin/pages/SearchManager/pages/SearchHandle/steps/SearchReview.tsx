import { Button } from "@/components/ui/button";
import { ChevronLeft, Save } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { buildSearchSchema, SearchSchemaFormValues } from "../utils";

interface SearchReviewProps {
  onBack: () => void;
}

export const SearchReview = ({ onBack }: SearchReviewProps) => {
  const { getValues } = useFormContext<SearchSchemaFormValues>();
  const values = getValues();

  const finalJson = buildSearchSchema(values);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Revisão das Configurações</h3>
        <p className="text-sm text-muted-foreground">
          Confira os dados da pesquisa antes de confirmar a criação/edição.
        </p>
      </div>

      <div className="relative">
        <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono">
          {JSON.stringify(finalJson, null, 2)}
        </pre>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" /> Confirmar e Salvar
        </Button>
      </div>
    </div>
  );
};
