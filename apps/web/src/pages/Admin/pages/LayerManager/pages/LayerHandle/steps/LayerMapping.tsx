import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { fetchAttributes } from "@/integrations/layer-attributes-integration";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

interface LayerMappingProps {
  onBack: () => void;
  onNext: () => void;
}

export const LayerMapping = ({ onBack, onNext }: LayerMappingProps) => {
  const form = useFormContext();
  const [attributes, setAttributes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const formatAttributeName = (name: string) => {
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  useEffect(() => {
    const loadAttributes = async () => {
      const url = form.getValues("url");
      const layer = form.getValues("selectedLayer");

      if (!url || !layer) return;

      setLoading(true);
      try {
        const fetchedAttributes = await fetchAttributes(url, layer.name);
        setAttributes(fetchedAttributes);

        // Initialize mapping with default values if not present
        const currentMapping = form.getValues("propertyMapping") || {};
        const newMapping = { ...currentMapping };
        let hasChanges = false;

        fetchedAttributes.forEach((attr) => {
          if (!newMapping[attr]) {
            newMapping[attr] = formatAttributeName(attr);
            hasChanges = true;
          }
        });

        if (hasChanges) {
          form.setValue("propertyMapping", newMapping);
        }
      } finally {
        setLoading(false);
      }
    };

    loadAttributes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Mapeamento de Propriedades</h3>
        <p className="text-sm text-muted-foreground">
          Configure como os nomes das propriedades serão exibidos para o usuário final.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Carregando propriedades...</p>
        </div>
      ) : attributes.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground border rounded-lg bg-muted/10">
          Nenhuma propriedade encontrada para esta camada.
        </div>
      ) : (
        <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {attributes.map((attr) => (
            <FormField
              key={attr}
              control={form.control}
              name={`propertyMapping.${attr}`}
              render={({ field }) => (
                <FormItem className="grid grid-cols-12 gap-4 items-center space-y-0 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="col-span-5 md:col-span-4">
                    <FormLabel className="text-xs font-mono text-muted-foreground break-all">
                      {attr}
                    </FormLabel>
                  </div>
                  <div className="col-span-7 md:col-span-8">
                    <FormControl>
                      <Input {...field} placeholder={formatAttributeName(attr)} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      )}

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
