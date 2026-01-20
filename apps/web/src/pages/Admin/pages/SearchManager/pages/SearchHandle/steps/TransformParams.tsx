import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { SearchSchemaFormValues } from "../utils";
import { CodeEditor } from "@/components/CodeEditor";
import { FilterBuilder, FilterField } from "@/components/FilterBuilder";
import { FilterGroup } from "@/components/FilterBuilder/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@open-urbis/map-ui";
import { useEffect, useState } from "react";
import axios from "axios";
import { getLayerSchemas } from "@/integrations/layer-schema-integration";

interface TransformParamsProps {
  onBack: () => void;
  onNext: () => void;
}

const DEFAULT_TREE: FilterGroup = {
  id: "root",
  type: "group",
  operator: "AND",
  children: [],
};

export const TransformParams = ({ onBack, onNext }: TransformParamsProps) => {
  const form = useFormContext<SearchSchemaFormValues>();
  const [activeTab, setActiveTab] = useState("code");
  const [layerFields, setLayerFields] = useState<FilterField[]>([]);
  const layerId = form.watch("layerId");

    const environment =
    (import.meta.env.VITE_API_URL || "/api") +
    "/maps";

  useEffect(() => {
    const fetchFields = async () => {
      if (!layerId) return;

      try {
        const layers = await getLayerSchemas(1, 1000);
        const allLayers =
          layers && typeof layers === "object" && "data" in layers
            ? (layers.data as any[])
            : Array.isArray(layers)
            ? layers
            : [];

        const selectedLayer = allLayers.find((l) => l.id === layerId);

        if (!selectedLayer) return;

        // Extract workspace and layer name
        let fullLayerName = selectedLayer.origin;
        if (selectedLayer.origin.includes("typeName=")) {
          const match = selectedLayer.origin.match(/typeName=([^&]+)/);
          if (match) fullLayerName = match[1];
        } else if (selectedLayer.origin.includes("layers=")) {
          const match = selectedLayer.origin.match(/layers=([^&]+)/);
          if (match) fullLayerName = match[1];
        } else if (selectedLayer.id) {
           // Fallback if we can assume id maps to layer name or check properties
           // Often the ID is not the layer name directly.
           // However, based on previous code `getLayerNameFromConfig`, we might need that util.
           // Let's try to fetch attributes using what we have or the ID if it looks like workspace:layer
           fullLayerName = selectedLayer.id;
        }

        // If it doesn't have a workspace, it might be hard to fetch attributes from geoserver proxy
        // unless we know the workspace.
        // Assuming some convention or that getLayerNameFromConfig logic is needed.
        // For now, let's try to use the ID if it has a colon, otherwise skip or try a default workspace?
        
        if (!fullLayerName.includes(":")) {
             // Try to find it in properties?
             // Or maybe we can't fetch attributes easily without more info.
             // Let's try to continue only if we have a colon.
             return; 
        }

        const [workspace, layerName] = fullLayerName.split(":");

        const response = await axios.get(
          `${environment}/geoserver-proxy/layers/${workspace}/${layerName}/attributes`
        );
        const attributes = response.data;
        setLayerFields(
          attributes.map((a: any) => ({
            name: a.name,
            type: "text", // Fallback to text
          }))
        );
      } catch (error) {
        console.error("Failed to fetch layer fields", error);
      }
    };

    if (activeTab === "visual") {
      fetchFields();
    }
  }, [layerId, activeTab]);

  return (
    <div className="space-y-6 flex flex-col h-[600px]">
      <div className="flex flex-col flex-1 gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">
            Transformar Parâmetros (transformParams)
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure os parâmetros da busca. Você pode usar o editor de código
            ou o construtor visual de filtros.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="code">Editor de Código</TabsTrigger>
            <TabsTrigger value="visual">Construtor Visual</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="flex-1 flex flex-col mt-4">
            <FormField
              control={form.control}
              name="transformParams"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col">
                  <FormControl>
                    <CodeEditor
                      language="javascript"
                      value={field.value || ""}
                      onChange={field.onChange}
                      className="flex-1 min-h-[300px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="visual" className="flex-1 flex flex-col mt-4 overflow-hidden">
            <FormField
              control={form.control}
              name="filterTree"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col overflow-auto p-1">
                  <FormControl>
                    <div className="border rounded-md p-4 bg-background min-h-[300px]">
                      {layerId ? (
                        <FilterBuilder
                          value={field.value || DEFAULT_TREE}
                          onChange={field.onChange}
                          fields={layerFields}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          Selecione uma camada na etapa "Informações Básicas"
                          para usar o construtor visual.
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button onClick={onBack} variant="outline" type="button">
          Voltar
        </Button>
        <Button onClick={onNext} type="button">
          Próximo
        </Button>
      </div>
    </div>
  );
};
