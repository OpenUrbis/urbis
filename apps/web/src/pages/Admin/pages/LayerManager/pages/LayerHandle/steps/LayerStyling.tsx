import LayerColorManager from "@/components/LayerColorManager";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fetchAttributes as fetchLayerAttributes } from "@/integrations/layer-attributes-integration";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

interface LayerStylingProps {
  onBack?: () => void;
  onNext?: () => void;
  onDynamicChange: (checked: boolean) => void;
  hideNavigation?: boolean;
}

export const LayerStyling = ({
  onBack,
  onNext,
  onDynamicChange,
  hideNavigation = false,
}: LayerStylingProps) => {
  const form = useFormContext();
  const [attributes, setAttributes] = useState<string[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  useEffect(() => {
    const fetchAttributes = async () => {
      const url = form.getValues("url");
      const layer = form.getValues("selectedLayer");
      const isDynamic = form.watch("isDynamic");

      if (!url || !layer || !isDynamic) return;

      setLoadingAttributes(true);
      try {
        const attributes = await fetchLayerAttributes(url, layer.name);
        setAttributes(attributes);
      } catch (e) {
        console.error("Failed to fetch attributes", e);
      } finally {
        setLoadingAttributes(false);
      }
    };

    fetchAttributes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("isDynamic")]); // Depend only on toggle, or manually check values inside

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
      <FormField
        control={form.control}
        name="isDynamic"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                Utilizar Cores Dinâmicas
              </FormLabel>
              <FormDescription>
                Habilite para permitir múltiplas configurações de cores baseadas
                em valores de dados.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={onDynamicChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {form.watch("isDynamic") && (
        <FormField
          control={form.control}
          name="layerProperty"
          render={({ field }) => (
            <FormItem className="animate-in fade-in slide-in-from-top-2">
              <FormLabel>Atributo para classificação</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger disabled={loadingAttributes}>
                    <SelectValue
                      placeholder={
                        loadingAttributes
                          ? "Carregando..."
                          : "Selecione o atributo"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {attributes.map((attr) => (
                    <SelectItem key={attr} value={attr}>
                      {attr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="colors"
        render={({ field }) => (
          <FormItem className="border p-4 rounded-lg">
            <FormLabel className="mb-4 block">Configuração de Cores</FormLabel>
            <FormControl>
              <LayerColorManager
                colors={field.value}
                onChange={field.onChange}
                dynamic={form.watch("isDynamic")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
