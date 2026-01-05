import {
  Button,
  createColumnConfigHelper,
  DataTableFilter,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useDataTableFilters,
} from "@open-urbis/map-ui";
import { useState, useMemo } from "react";
import axios from "axios";
import { useSearchContext } from "../../hooks/useSearchContext";
import { filtersToCQL } from "../../utils/cql-builder";
import { createFn } from "../../utils/createFn";
import { Calendar, Hash, Type } from "lucide-react";

const getColumnType = (binding: string): "text" | "number" | "date" | null => {
  if (binding.includes("String")) return "text";
  if (
    binding.includes("Long") ||
    binding.includes("Integer") ||
    binding.includes("Double") ||
    binding.includes("BigDecimal") ||
    binding.includes("Float")
  )
    return "number";
  if (binding.includes("Date") || binding.includes("Timestamp")) return "date";
  return "text";
};

const getIcon = (type: string) => {
    switch (type) {
        case 'number': return Hash;
        case 'date': return Calendar;
        default: return Type;
    }
}

const getLayerNameFromConfig = (config: any): string | null => {
    // Try to get from origin
    const origin = config.layerSchema?.origin;
    if (origin) {
        const match = origin.match(/[?&](typeName|LAYERS)=([^&]+)/);
        if (match) {
            return decodeURIComponent(match[2]);
        }
    }
    // If it was available directly:
    // return config.layerSchema?.layer;
    return null;
}

export const ConcatenatedSearchModal = () => {
  const { searchConfig, searchQuery } = useSearchContext();
  const { setResults, clearResults } = searchQuery;

  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [columnsConfig, setColumnsConfig] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);

  // Filter state managed by the hook
  const [filters, setFilters] = useState<any[]>([]);

  const helper = useMemo(() => createColumnConfigHelper<any>(), []);

  const { columns, actions, strategy } = useDataTableFilters({
    data: [], // No data needed for server strategy attribute-based filtering
    columnsConfig,
    filters,
    onFiltersChange: setFilters,
    strategy: "server",
  });

  const environment =
    (import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br") +
    "/maps";

  const handleLayerChange = async (layerId: string) => {
    setSelectedLayerId(layerId);
    setColumnsConfig([]);
    setFilters([]);

    // Find layer config
    const layerConfig = searchConfig.value.find((c) => c.id === layerId);
    if (!layerConfig) return;

    const fullLayerName = getLayerNameFromConfig(layerConfig);

    if (!fullLayerName || !fullLayerName.includes(":")) {
      console.error("Layer name must be in format workspace:layer. Config:", layerConfig);
      // Could show toast error
      return;
    }

    const [workspace, layerName] = fullLayerName.split(":");

    setLoadingAttributes(true);
    try {
      const response = await axios.get(
        `${environment}/geoserver-proxy/layers/${workspace}/${layerName}/attributes`
      );
      const attributes = response.data; // Array of { name, binding, ... }

      const newColumns = attributes
        .map((attr: any) => {
          const type = getColumnType(attr.binding);
          if (!type) return null;

          // helper.text(), helper.number() etc builders
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

  const handleSearch = async () => {
    if (!selectedLayerId) return;
    const cql = filtersToCQL(filters);

    setIsSearching(true);
    clearResults(); // Clear previous results

    try {
      const layerConfig = searchConfig.value.find(
        (c) => c.id === selectedLayerId
      );
      if (layerConfig) {
        const fullLayerName = getLayerNameFromConfig(layerConfig);
        if (!fullLayerName) {
            console.error("Could not determine layer name");
            return;
        }

        const url = layerConfig.origin.replace("{environment}", environment);

        const response = await axios.get(url, {
          params: {
            service: "WFS",
            version: "1.1.0",
            request: "GetFeature",
            typeName: fullLayerName,
            outputFormat: "application/json",
            CQL_FILTER: cql || undefined,
            srsName: "EPSG:4326", // Ensure lat/lon
            maxFeatures: 100,
          },
          transformResponse: (data) => data, // Keep as text to allow manual parsing/transform
        });

        const responseText = response.data;
        let responseJson;
        try {
          responseJson = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse response JSON", e);
          responseJson = {};
        }

        let items: any[] = [];
        const totalFeatures = responseJson.totalFeatures || responseJson.numberMatched;

        if (layerConfig.transformResponse) {
          try {
            const fn = createFn(layerConfig.transformResponse);
            // Pass text as transformResponse usually expects raw string (contains JSON.parse)
            items = fn(responseText);

            // Try to attach rawData if missing and counts match
            if (
              responseJson.features &&
              Array.isArray(items) &&
              items.length === responseJson.features.length
            ) {
              items = items.map((item, index) => {
                if (!item.rawData) {
                  return { ...item, rawData: responseJson.features[index] };
                }
                return item;
              });
            }
          } catch (e) {
            console.error("Error transforming response", e);
            // Try passing object if text failed? No, error was about "[object Object]" not valid JSON
            items = [];
          }
        } else {
          items = (responseJson.features || []).map((f: any) => ({
            id: f.id,
            name: f.properties.nome || f.id, // Fallback
            latitude: f.geometry?.coordinates[1],
            longitude: f.geometry?.coordinates[0],
            rawData: f,
          }));
        }

        if (totalFeatures !== undefined) {
          (items as any).totalCount = totalFeatures;
        }

        setResults({ [selectedLayerId]: items });
        setOpen(false);

        // Enable only the searched layer
        if (searchConfig.value) {
          searchConfig.value = searchConfig.value.map((c) => ({
            ...c,
            isActive: c.id === selectedLayerId,
          }));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-full"
          title="Busca Concatenada"
        >
          <span className="material-symbols-outlined">filter_list</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Busca Concatenada</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <Select value={selectedLayerId} onValueChange={handleLayerChange}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Selecione uma camada" />
              </SelectTrigger>
              <SelectContent>
                {searchConfig.value
                  .filter((c) => getLayerNameFromConfig(c) !== null)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSearch}
              disabled={isSearching || !selectedLayerId}
            >
              {isSearching ? (
                <>
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  Buscando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">search</span>
                  Buscar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
