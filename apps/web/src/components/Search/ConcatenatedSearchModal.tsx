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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@open-urbis/map-ui";
import { useState, useMemo } from "react";
import axios from "axios";
import { useSearchContext } from "../../hooks/useSearchContext";
import { filtersToCQL } from "../../utils/cql-builder";
import { createFn } from "../../utils/createFn";
import { getColumnType, getIcon, getLayerNameFromConfig, normalizeTerm } from "../../utils/layer-utils";

export const ConcatenatedSearchModal = () => {
  const { searchConfig } = useSearchContext();

  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [columnsConfig, setColumnsConfig] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);

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
    setSearchResults([]);
    setTotalCount(undefined);

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

    // Normalize values for contains/does not contain operators
    const normalizedFilters = filters.map(f => {
        if ((f.operator === 'contains' || f.operator === 'does not contain') && f.type === 'text') {
            return { ...f, values: f.values.map((v: any) => normalizeTerm(String(v))) };
        }
        return f;
    });

    const cql = filtersToCQL(normalizedFilters);

    setIsSearching(true);
    setSearchResults([]); // Clear previous results
    setTotalCount(undefined);

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
            maxFeatures: 1000, // Increased to 1000
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
        
        // For table display, we want flattened properties
        items = (responseJson.features || []).map((f: any) => {
            return {
                id: f.id,
                ...f.properties
            };
        });

        const totalFeatures = responseJson.totalFeatures || responseJson.numberMatched;
        if (totalFeatures !== undefined) {
            setTotalCount(totalFeatures);
        }

        setSearchResults(items);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExportCSV = () => {
      if (searchResults.length === 0) return;

      const headers = Object.keys(searchResults[0]).filter(k => k !== 'id'); // Filter internal ID if needed
      const csvContent = [
          headers.join(','),
          ...searchResults.map(row => headers.map(header => {
              const val = row[header];
              // Handle commas in value by quoting
              const strVal = String(val === null || val === undefined ? '' : val);
              return strVal.includes(',') ? `"${strVal}"` : strVal;
          }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "busca_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Busca Concatenada</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-y-auto">
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

          {searchResults.length > 0 && (
              <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                          <h3 className="font-semibold">Resultados</h3>
                          <p className="text-sm text-muted-foreground">
                              Exibindo {searchResults.length} de {totalCount !== undefined ? totalCount : '?'} itens
                          </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleExportCSV}>
                          <span className="material-symbols-outlined mr-2">download</span>
                          Exportar CSV
                      </Button>
                  </div>
                  <div className="border rounded-md overflow-auto max-h-[400px]">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  {Object.keys(searchResults[0]).map(key => (
                                      <TableHead key={key} className="whitespace-nowrap">{key}</TableHead>
                                  ))}
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {searchResults.map((row, i) => (
                                  <TableRow key={i}>
                                      {Object.values(row).map((val: any, j) => (
                                          <TableCell key={j} className="whitespace-nowrap max-w-[200px] truncate" title={String(val)}>
                                              {String(val)}
                                          </TableCell>
                                      ))}
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
              </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
