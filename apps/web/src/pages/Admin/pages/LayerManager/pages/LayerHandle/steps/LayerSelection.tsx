import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChevronRight, Layers, Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";

interface LayerSelectionProps {
  loading: boolean;
  fetchError: string;
  layers: { name: string; title: string }[];
  onFetch: () => void;
  onNext: () => void;
  onLayerSelect: (layer: { name: string; title: string }) => void;
  readOnly?: boolean;
}

export const LayerSelection = ({
  loading,
  fetchError,
  layers,
  onFetch,
  onNext,
  onLayerSelect,
  readOnly = false,
}: LayerSelectionProps) => {
  const form = useFormContext();

  if (readOnly) {
    const selectedLayer = form.watch("selectedLayer");

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
        <div className="bg-muted/30 border rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-lg leading-none">
                Camada Selecionada
              </h3>
              <p className="text-sm text-muted-foreground">
                Os dados técnicos da camada de origem não podem ser alterados
                nesta etapa.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Título Original
              </span>
              <p className="text-sm font-semibold">
                {selectedLayer?.title || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Identificador Técnico
              </span>
              <p className="text-sm font-mono">{selectedLayer?.name || "-"}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Fonte de Dados (WMS/WFS)
              </span>
              <p className="text-sm truncate" title={form.watch("url")}>
                {form.watch("url")}
              </p>
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Conexão ativa com o provedor de dados
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="button" onClick={onNext}>
            Configurações <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
      <FormField
        control={form.control}
        name="url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link do GeoServer (WMS)</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input
                  placeholder="https://geoserver.exemplo.com/geoserver/wms"
                  disabled={readOnly}
                  {...field}
                />
              </FormControl>
              {!readOnly && (
                <Button
                  type="button"
                  onClick={onFetch}
                  disabled={
                    loading || !field.value || field.value.trim() === ""
                  }
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Buscar"
                  )}
                </Button>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {fetchError && <p className="text-destructive text-sm">{fetchError}</p>}

      {layers.length > 0 && (
        <FormField
          control={form.control}
          name="selectedLayer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Selecionar Camada</FormLabel>
              <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                {layers.map((l) => (
                  <div
                    key={l.name}
                    className={`p-2 rounded text-sm ${field.value?.name === l.name ? "bg-primary/10 text-primary border border-primary/20" : readOnly ? "opacity-50" : "hover:bg-muted cursor-pointer"}`}
                    onClick={() => !readOnly && onLayerSelect(l)}
                  >
                    <div className="font-medium">{l.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.name}
                    </div>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="flex justify-end pt-4">
        <Button
          type="button"
          onClick={onNext}
          disabled={!form.getValues("selectedLayer")}
        >
          Próximo <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
