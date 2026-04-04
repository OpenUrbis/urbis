import { ClickActionConfiguration } from "@/pages/Admin/components/ClickActionConfiguration";
import { GroupSelect } from "@/components/GroupSelect";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { generateOriginUrl } from "../utils";
import { useEffect, useState } from "react";

interface LayerConfigurationProps {
  onNext: () => void;
  onBack: () => void;
}

export const LayerConfiguration = ({
  onNext,
  onBack,
}: LayerConfigurationProps) => {
  const form = useFormContext();
  const loadingMethod = form.watch("loadingMethod");
  const urlParameterType = form.watch("urlParameterType");
  const url = form.watch("url");
  const selectedLayer = form.watch("selectedLayer");
  const origin = form.watch("origin");

  const [suggestedOrigin, setSuggestedOrigin] = useState("");

  // Auto-select parameter type based on loading method
  useEffect(() => {
    if (loadingMethod) {
      if (loadingMethod === "CustomWMSLayer") {
        // For WMS, default to WMS if not set
        if (!urlParameterType) {
          form.setValue("urlParameterType", "WMS");
        }
      } else {
        // For GeoJson/Stream, ALWAYS force WFS
        if (urlParameterType !== "WFS") {
          form.setValue("urlParameterType", "WFS");
        }
      }
    }
  }, [loadingMethod, urlParameterType, form]);

  const isWMSLayer = loadingMethod === "CustomWMSLayer";

  useEffect(() => {
    if (url && urlParameterType) {
      const suggested = generateOriginUrl(url, selectedLayer, urlParameterType);
      setSuggestedOrigin(suggested);

      // Auto-set on first load if empty
      if (!origin) {
        form.setValue("origin", suggested);
      }
    }
  }, [url, selectedLayer, urlParameterType]);

  const handleApplySuggestion = () => {
    form.setValue("origin", suggestedOrigin);
  };

  const isDifferent = origin !== suggestedOrigin && suggestedOrigin !== "";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="loadingMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de carregar os dados</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CustomWMSLayer">WMS (Imagem)</SelectItem>
                  <SelectItem value="GeoJsonLayer">WFS (Vetorial)</SelectItem>
                  <SelectItem value="Stream">Vector Tile (PBF)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isWMSLayer && (
          <FormField
            control={form.control}
            name="urlParameterType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Padrão de Parâmetros</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="WFS">
                      WFS (service, request...)
                    </SelectItem>
                    <SelectItem value="WMS">
                      WMS (LAYERS, FORMAT...)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <FormField
        control={form.control}
        name="origin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL Final da Camada (Origin)</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input placeholder="URL completa..." {...field} />
              </FormControl>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Regerar URL padrão"
                onClick={handleApplySuggestion}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <FormMessage />
            {isDifferent && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <h5 className="font-medium text-blue-900 leading-none">
                    Sugestão de Ajuste
                  </h5>
                  <div className="text-sm text-blue-700 flex flex-col gap-2">
                    <span>
                      A URL atual difere do padrão recomendado para o tipo
                      selecionado ({loadingMethod}).
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-fit bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200"
                      onClick={handleApplySuggestion}
                    >
                      Aplicar URL Recomendada
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="groupId"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Grupo</FormLabel>
            <GroupSelect value={field.value} onChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="layerName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da Camada</FormLabel>
            <FormControl>
              <Input placeholder="Nome da camada" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <ClickActionConfiguration />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="minZoom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Zoom (Opcional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxZoom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Zoom (Opcional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 18" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Ativa</FormLabel>
                <div className="text-[0.8rem] text-muted-foreground">
                  Se a camada está disponível para uso
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isVisible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Visível por padrão</FormLabel>
                <div className="text-[0.8rem] text-muted-foreground">
                  Se a camada inicia visível no mapa
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

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
