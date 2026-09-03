import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

type GeoServerLayer = {
  name: string;
  title: string;
  crs?: string[];
  bbox?: number[];
  styles?: string[];
};

interface LayerSelectionProps {
  loading: boolean;
  fetchError: string;
  layers: GeoServerLayer[];
  onFetch: () => void;
  onNext: () => void;
  onLayerSelect: (layer: GeoServerLayer) => void;
  onLoadingMethodChange?: (value: string) => void;
  readOnly?: boolean;
}

export const LayerSelection = ({
  loading,
  fetchError,
  layers,
  onFetch,
  onNext: _onNext,
  onLayerSelect,
  onLoadingMethodChange,
  readOnly = false,
}: LayerSelectionProps) => {
  const form = useFormContext();
  const loadingMethod = form.watch("loadingMethod");
  const selectedLayer = form.watch("selectedLayer");
  const [layerSearch, setLayerSearch] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const filteredLayers = useMemo(() => {
    const term = layerSearch.trim().toLowerCase();
    if (!term) return layers;

    return layers.filter(
      (layer) =>
        layer.title?.toLowerCase().includes(term) ||
        layer.name?.toLowerCase().includes(term),
    );
  }, [layers, layerSearch]);

  if (readOnly) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 rounded-xl border bg-muted/20 p-4">
        <div className="grid gap-3 text-sm md:grid-cols-[minmax(0,1fr)_minmax(220px,auto)] md:items-center">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Fonte conectada
            </div>
            <p
              className="truncate font-mono text-xs text-muted-foreground"
              title={form.watch("url")}
            >
              {form.watch("url")}
            </p>
          </div>

          <div className="min-w-0 rounded-lg bg-background px-3 py-2 text-xs">
            <span className="text-muted-foreground">Camada técnica</span>
            <p
              className="truncate font-mono font-medium"
              title={selectedLayer?.name}
            >
              {selectedLayer?.name || "-"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasSelection = Boolean(selectedLayer?.name);
  const showPicker = isPickerOpen || !hasSelection;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <FormField
          control={form.control}
          name="loadingMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de carregar os dados</FormLabel>
              <FormControl>
                <select
                  value={field.value}
                  onChange={(event) => {
                    const value = event.target.value;

                    if (onLoadingMethodChange) {
                      onLoadingMethodChange(value);
                      return;
                    }

                    field.onChange(value);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="GeoJsonLayer">WFS vetorial completo</option>
                  <option value="CustomWMSLayer">WMS imagem</option>
                  <option value="Stream">WFS recortado por área visível</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Link do GeoServer (WMS/WFS)
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 cursor-help text-muted-foreground hover:text-primary" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[400px] space-y-2 p-4 text-sm">
                      <p className="font-semibold">Formatos aceitos:</p>
                      <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                        <li>
                          URL Base:{" "}
                          <span className="font-mono text-xs">
                            https://dominio.com/geoserver/ows
                          </span>
                        </li>
                        <li>
                          URL Completa (WFS):{" "}
                          <span className="font-mono text-xs">
                            .../ows?service=WFS&typeName=camada
                          </span>
                        </li>
                        <li>
                          URL Completa (WMS):{" "}
                          <span className="font-mono text-xs">
                            .../wms?LAYERS=camada&FORMAT=image/jpeg
                          </span>
                        </li>
                      </ul>
                      <p className="border-t pt-2 text-xs">
                        Ao inserir uma URL completa, os parâmetros serão
                        identificados automaticamente.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="https://geoserver.exemplo.com/geoserver/ows"
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onFetch()}
                  disabled={
                    loading || !field.value || field.value.trim() === ""
                  }
                  className="shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Buscar"
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {loadingMethod === "Stream"
          ? "WFS recortado: use apenas para camadas grandes visíveis em zoom alto (padrão dos lotes fiscais). Não indicado para feições que precisam aparecer antes do zoom 17."
          : loadingMethod === "CustomWMSLayer"
            ? "WMS imagem: ideal quando o próprio servidor já simboliza a camada."
            : "WFS completo: indicado para camadas vetoriais pequenas ou médias, carregadas de uma vez."}
      </p>

      {fetchError && <p className="text-sm text-destructive">{fetchError}</p>}

      {layers.length > 0 && (
        <FormField
          control={form.control}
          name="selectedLayer"
          render={() => (
            <FormItem className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <FormLabel>Camada técnica</FormLabel>
                <span className="text-xs text-muted-foreground">
                  {layers.length} camadas no serviço
                </span>
              </div>

              {hasSelection && (
                <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {selectedLayer?.title || selectedLayer?.name}
                    </span>
                    <span className="block truncate font-mono text-xs text-muted-foreground">
                      {selectedLayer?.name}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setIsPickerOpen((current) => !current)}
                  >
                    {showPicker ? "Fechar" : "Trocar camada"}
                  </Button>
                </div>
              )}

              {showPicker && (
                <div className="space-y-2 rounded-md border p-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={layerSearch}
                      onChange={(event) => setLayerSearch(event.target.value)}
                      placeholder="Filtrar por nome ou identificador técnico"
                      className="h-9 pl-8"
                    />
                  </div>

                  <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                    {filteredLayers.length === 0 ? (
                      <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                        Nenhuma camada encontrada para o filtro informado.
                      </p>
                    ) : (
                      filteredLayers.map((layer) => {
                        const isSelected = selectedLayer?.name === layer.name;

                        return (
                          <button
                            type="button"
                            key={layer.name}
                            onClick={() => {
                              onLayerSelect(layer);
                              setIsPickerOpen(false);
                              setLayerSearch("");
                            }}
                            className={cn(
                              "block w-full rounded px-2 py-1.5 text-left text-sm transition-colors",
                              isSelected
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted",
                            )}
                          >
                            <span className="block truncate font-medium">
                              {layer.title}
                            </span>
                            <span className="block truncate font-mono text-xs text-muted-foreground">
                              {layer.name}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};
