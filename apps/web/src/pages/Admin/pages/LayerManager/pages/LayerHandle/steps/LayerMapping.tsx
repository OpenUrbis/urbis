import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { fetchAttributes } from "@/integrations/layer-attributes-integration";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

interface LayerMappingProps {
  onBack?: () => void;
  onNext?: () => void;
  hideNavigation?: boolean;
}

export const LayerMapping = ({
  onBack,
  onNext,
  hideNavigation = false,
}: LayerMappingProps) => {
  const form = useFormContext();
  const [attributes, setAttributes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const formatAttributeName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  useEffect(() => {
    const loadAttributes = async () => {
      const url = form.getValues("url");
      const layer = form.getValues("selectedLayer");

      if (!url || !layer) return;

      setLoading(true);
      try {
        const fetchedAttributes = await fetchAttributes(url, layer.name);
        const attrNames = fetchedAttributes.map((attr) => attr.name);
        setAttributes(attrNames);

        // Initialize mapping with default values if not present
        const currentMapping = form.getValues("propertyMapping") || {};
        const newMapping = { ...currentMapping };
        let hasChanges = false;

        attrNames.forEach((attr) => {
          if (!newMapping[attr]) {
            newMapping[attr] = {
              label: formatAttributeName(attr),
              description: "",
            };
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
    <div className="animate-in fade-in slide-in-from-right-4">
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
        <div className="grid gap-2">
          {attributes.map((attr) => (
            <div
              key={attr}
              className="grid gap-2 rounded-lg border bg-background/70 p-2 transition-colors hover:bg-muted/40 md:grid-cols-[minmax(160px,220px)_minmax(0,1fr)_minmax(0,1fr)] md:items-start"
            >
              <div className="min-w-0 pt-2">
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {attr}
                </p>
              </div>
              <FormField
                control={form.control}
                name={`propertyMapping.${attr}.label`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Rótulo público"
                        className="h-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`propertyMapping.${attr}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Descrição opcional"
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
