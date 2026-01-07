import LayerColorManager from "@/components/LayerColorManager";
import { Button } from "@/components/ui/button";
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
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

interface LayerStylingProps {
  onBack: () => void;
  onNext: () => void;
  onDynamicChange: (checked: boolean) => void;
}

export const LayerStyling = ({
  onBack,
  onNext,
  onDynamicChange,
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
        const getBaseUrl = (inputUrl: string) => {
          try {
            const urlObj = new URL(inputUrl);
            return `${urlObj.origin}${urlObj.pathname}`;
          } catch {
            return inputUrl;
          }
        };

        const baseUrl = getBaseUrl(url);
        const environment =
          import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br";

        // Try WFS 2.0.0 first, usually gives clean XSD
        const response = await axios.get(`${environment}/maps/proxy`, {
          params: {
            url: `${baseUrl}?service=WFS&version=2.0.0&request=DescribeFeatureType&typeName=${layer.name}`,
          },
        });

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "text/xml");

        const foundAttributes: string[] = [];

        // Search strategies for XSD
        const sequences = xmlDoc.getElementsByTagNameNS("*", "sequence");
        if (sequences.length > 0) {
          const seqElements = sequences[0].children;
          for (let i = 0; i < seqElements.length; i++) {
            // Check if it is an element
            if (seqElements[i].localName === "element") {
              const name = seqElements[i].getAttribute("name");
              if (name) foundAttributes.push(name);
            }
          }
        }

        if (foundAttributes.length === 0) {
          // Fallback: search all elements
          const elements = xmlDoc.getElementsByTagNameNS("*", "element");
          for (let i = 0; i < elements.length; i++) {
            const name = elements[i].getAttribute("name");
            if (name && name !== layer.name) {
              foundAttributes.push(name);
            }
          }
        }

        setAttributes([...new Set(foundAttributes)]);
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
                Habilite para permitir múltiplas configurações de cores
                baseadas em valores de dados.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={onDynamicChange}
              />
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
