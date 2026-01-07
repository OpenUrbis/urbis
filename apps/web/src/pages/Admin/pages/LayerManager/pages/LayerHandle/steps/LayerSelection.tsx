import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { ChevronRight, Loader2 } from "lucide-react";

interface LayerSelectionProps {
  loading: boolean;
  fetchError: string;
  layers: { name: string; title: string }[];
  onFetch: () => void;
  onNext: () => void;
  onLayerSelect: (layer: { name: string; title: string }) => void;
}

export const LayerSelection = ({
  loading,
  fetchError,
  layers,
  onFetch,
  onNext,
  onLayerSelect,
}: LayerSelectionProps) => {
  const form = useFormContext();

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
                  {...field}
                />
              </FormControl>
              <Button
                type="button"
                onClick={onFetch}
                disabled={loading || !field.value}
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
                    className={`p-2 rounded cursor-pointer text-sm ${field.value?.name === l.name ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted"}`}
                    onClick={() => onLayerSelect(l)}
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
