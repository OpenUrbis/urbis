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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { generateOriginUrl, fetchCapabilities } from "../utils";
import { useEffect, useState } from "react";

interface LayerConfigurationProps {
  onNext?: () => void;
  onBack?: () => void;
  hideNavigation?: boolean;
  simpleMode?: boolean;
}

export const LayerConfiguration = ({
  onNext,
  onBack,
  hideNavigation = false,
  simpleMode = false,
}: LayerConfigurationProps) => {
  const form = useFormContext();
  const loadingMethod = form.watch("loadingMethod");
  const url = form.watch("url");
  const selectedLayer = form.watch("selectedLayer");
  const origin = form.watch("origin");
  const version = form.watch("version");
  const srs = form.watch("srs");

  const [forceCustomSrs, setForceCustomSrs] = useState(false);

  useEffect(() => {
    const fetchCrs = async () => {
      if (url && selectedLayer?.name && (!selectedLayer.crs || selectedLayer.crs.length === 0)) {
        try {
          const { layers } = await fetchCapabilities(url);
          const found = layers.find(l => l.name === selectedLayer.name || l.title === selectedLayer.name);
          if (found && found.crs && found.crs.length > 0) {
            const updatedLayer = {
               ...selectedLayer,
               crs: found.crs,
               bbox: found.bbox || selectedLayer.bbox
            };
            form.setValue("selectedLayer", updatedLayer);
          }
        } catch (error) {
          console.error("Failed to fetch CRS options", error);
        }
      }
    };
    
    fetchCrs();
  }, [url, selectedLayer?.name]);

  useEffect(() => {
    setForceCustomSrs(false);
  }, [selectedLayer?.name]);

  useEffect(() => {
    if (url && loadingMethod) {
      const suggested = generateOriginUrl(
        url,
        selectedLayer,
        loadingMethod,
        version,
        srs
      );
      
      if (origin !== suggested) {
        form.setValue("origin", suggested);
      }
    }
  }, [url, selectedLayer, loadingMethod, version, srs]);

  const hasCrsOptions = selectedLayer?.crs && selectedLayer.crs.length > 0;
  const isKnownSrs = selectedLayer?.crs?.includes(srs);
  const showCustomSrsInput = forceCustomSrs || !isKnownSrs || !hasCrsOptions;
  const srsSelectValue = showCustomSrsInput ? "custom" : srs;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
      {!simpleMode && (
        <>
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

          <div className={`grid ${loadingMethod === "CustomWMSLayer" ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versão (Service Version)</FormLabel>
                  <FormControl>
                    <Input placeholder="1.0.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {loadingMethod !== "CustomWMSLayer" && (
              <FormField
                control={form.control}
                name="srs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SRS / CRS</FormLabel>
                    <div className="flex flex-col gap-2">
                      <Select
                        value={srsSelectValue}
                        onValueChange={(val) => {
                          if (val === "custom") {
                            setForceCustomSrs(true);
                          } else {
                            setForceCustomSrs(false);
                            field.onChange(val);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedLayer?.crs?.map((crs: string) => (
                            <SelectItem key={crs} value={crs}>
                              {crs}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Personalizada</SelectItem>
                        </SelectContent>
                      </Select>

                      {(showCustomSrsInput || !hasCrsOptions) && (
                        <FormControl>
                          <Input
                            placeholder="EPSG:4326"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // If user types something that matches list, we could auto-switch back to select mode?
                              // But maybe keep custom mode to avoid jumping UI.
                            }}
                          />
                        </FormControl>
                      )}
                    </div>
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
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

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

      <FormField
        control={form.control}
        name="index"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Index (Ordenação)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Ex: 10" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {!simpleMode && loadingMethod !== "CustomWMSLayer" && <ClickActionConfiguration />}

      {loadingMethod !== "CustomWMSLayer" && (
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
      )}

      {!simpleMode && (
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
      )}

      {!hideNavigation && (
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button type="button" onClick={onNext}>
            Próximo <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
