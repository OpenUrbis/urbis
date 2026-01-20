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
    (import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br") +
    "/maps";

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtrar Camada: {layer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loadingAttributes && (
            <div className="text-sm text-muted-foreground">
              Carregando atributos...
            </div>
          )}

          {fields.length > 0 && (
            <div className="border rounded-md p-4 bg-background">
              <FilterBuilder
                value={filterTree}
                onChange={setFilterTree}
                fields={fields}
              />
            </div>
          )}
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={handleClear}>
                Limpar Filtros
            </Button>
            <Button onClick={handleApply}>
                Aplicar Filtros
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
