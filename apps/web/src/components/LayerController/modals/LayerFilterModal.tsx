import {
  Button,
  createColumnConfigHelper,
  DataTableFilter,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  useDataTableFilters,
} from "@open-urbis/map-ui";
import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { IGetConfigLayerSchema } from "../../../types/fetch-map-config-type";
import { filtersToCQL } from "../../../utils/cql-builder";
import { getColumnType, getIcon, getLayerNameFromConfig } from "../../../utils/layer-utils";
import { useMapContext } from "../../../hooks/useMapContext";

interface LayerFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layer: IGetConfigLayerSchema;
}

export const LayerFilterModal = ({ open, onOpenChange, layer }: LayerFilterModalProps) => {
  const { layerSchemas } = useMapContext();
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [columnsConfig, setColumnsConfig] = useState<any[]>([]);
  const [filters, setFilters] = useState<any[]>([]);

  const helper = useMemo(() => createColumnConfigHelper<any>(), []);

  const { columns, actions, strategy } = useDataTableFilters({
    data: [],
    columnsConfig,
    filters,
    onFiltersChange: setFilters,
    strategy: "server",
  });

  const environment =
    (import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br") +
    "/maps";

  useEffect(() => {
    if (open && layer) {
        fetchAttributes();
        if (layer.filters) {
            setFilters(layer.filters);
        } else {
            setFilters([]);
        }
    }
  }, [open]); // Removed layer from deps to avoid resetting on update

  const fetchAttributes = async () => {
    const fullLayerName = getLayerNameFromConfig(layer);

    if (!fullLayerName || !fullLayerName.includes(":")) {
      console.error("Layer name must be in format workspace:layer. Config:", layer);
      return;
    }

    const [workspace, layerName] = fullLayerName.split(":");

    setLoadingAttributes(true);
    try {
      const response = await axios.get(
        `${environment}/geoserver-proxy/layers/${workspace}/${layerName}/attributes`
      );
      const attributes = response.data;

      const newColumns = attributes
        .map((attr: any) => {
          const type = getColumnType(attr.binding);
          if (!type) return null;

          let builder;
          if (type === 'text') builder = helper.text();
          else if (type === 'number') builder = helper.number();
          else if (type === 'date') builder = helper.date();
          else builder = helper.text();

          return builder
            .accessor((row) => row[attr.name])
            .id(attr.name)
            .displayName(attr.name)
            .icon(getIcon(type))
            .build();
        })
        .filter(Boolean);

      setColumnsConfig(newColumns);
    } catch (error) {
      console.error("Failed to fetch attributes", error);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const handleApply = () => {
    const cql = filtersToCQL(filters);
    
    // Update layer schema with new filter
    layerSchemas.value = layerSchemas.value.map(s => {
        if (s.id === layer.id) {
            return { ...s, cqlFilter: cql || undefined, filters };
        }
        return s;
    });

    onOpenChange(false);
  };

  const handleClear = () => {
      setFilters([]);
      layerSchemas.value = layerSchemas.value.map(s => {
        if (s.id === layer.id) {
            return { ...s, cqlFilter: undefined, filters: [] };
        }
        return s;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtrar Camada: {layer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loadingAttributes && <div className="text-sm text-muted-foreground">Carregando atributos...</div>}

          {columnsConfig.length > 0 && (
            <div className="border rounded-md p-4 bg-background">
              <DataTableFilter
                columns={columns}
                filters={filters}
                actions={actions}
                strategy={strategy}
                inline
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
