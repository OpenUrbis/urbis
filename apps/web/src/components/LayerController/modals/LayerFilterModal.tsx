import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@open-urbis/map-ui";
import { useState, useEffect } from "react";
import axios from "axios";
import { IGetConfigLayerSchema } from "../../../types/fetch-map-config-type";
import { filterNodeToCQL } from "../../../utils/cql-builder-advanced";
import { getLayerNameFromConfig } from "../../../utils/layer-utils";
import { useMapContext } from "../../../hooks/useMapContext";
import { FilterBuilder, FilterField } from "../../FilterBuilder";
import { FilterGroup } from "../../FilterBuilder/types";
import { PredefinedSearchSuggestions } from "../../Search/PredefinedSearchSuggestions";
import { Loader2 } from "lucide-react";

interface LayerFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layer: IGetConfigLayerSchema;
}

const DEFAULT_TREE: FilterGroup = {
  id: "root",
  type: "group",
  operator: "AND",
  children: [],
};

export const LayerFilterModal = ({
  open,
  onOpenChange,
  layer,
}: LayerFilterModalProps) => {
  const { layerSchemas } = useMapContext();
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [fields, setFields] = useState<FilterField[]>([]);
  const [filterTree, setFilterTree] = useState<FilterGroup>(DEFAULT_TREE);

  const environment =
    (import.meta.env.VITE_API_URL || "/api") + "/maps";

  useEffect(() => {
    if (open && layer) {
      fetchAttributes();
      if (layer.filterTree) {
        setFilterTree(layer.filterTree);
      } else {
        setFilterTree(DEFAULT_TREE);
      }
    }
  }, [open]);

  const fetchAttributes = async () => {
    const fullLayerName = getLayerNameFromConfig(layer);

    if (!fullLayerName || !fullLayerName.includes(":")) {
      console.error(
        "Layer name must be in format workspace:layer. Config:",
        layer
      );
      return;
    }

    const [workspace, layerName] = fullLayerName.split(":");

    setLoadingAttributes(true);
    try {
      const response = await axios.get(
        `${environment}/geoserver-proxy/layers/${workspace}/${layerName}/attributes`
      );
      const attributes = response.data;
      setFields(
        attributes.map((a: any) => ({
          name: a.name,
          type: "text", // Fallback to text
        }))
      );
    } catch (error) {
      console.error("Failed to fetch attributes", error);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const handleApply = () => {
    const cql = filterNodeToCQL(filterTree);

    // Update layer schema with new filter
    layerSchemas.value = layerSchemas.value.map((s) => {
      if (s.id === layer.id) {
        return { ...s, cqlFilter: cql || undefined, filterTree };
      }
      return s;
    });

    onOpenChange(false);
  };

  const handleClear = () => {
    setFilterTree(DEFAULT_TREE);
    layerSchemas.value = layerSchemas.value.map((s) => {
      if (s.id === layer.id) {
        return { ...s, cqlFilter: undefined, filterTree: DEFAULT_TREE };
      }
      return s;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 flex flex-col">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-primary">Filtrar Camada: {layer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto">
          <PredefinedSearchSuggestions 
            currentLayerId={layer.id} 
            onSelect={(tree) => setFilterTree(tree)}
          />

          {loadingAttributes && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 py-4 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando atributos da camada...
            </div>
          )}

          {fields.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                Critérios de filtro
              </div>
              <div className="border rounded-xl p-4 bg-background/50 shadow-sm backdrop-blur-sm">
                <FilterBuilder
                  value={filterTree}
                  onChange={setFilterTree}
                  fields={fields}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 pt-4 border-t gap-2">
            <Button variant="outline" onClick={handleClear} className="rounded-full h-10 px-6">
                Limpar Filtros
            </Button>
            <Button onClick={handleApply} className="rounded-full h-10 px-8 shadow-md">
                Aplicar Filtros
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
