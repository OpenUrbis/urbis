import {
  Button,
  createColumnConfigHelper,
  DataTableFilter,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { Info } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { useSearchContext } from "../../hooks/useSearchContext";
import { useToast } from "@/hooks/useToast";
import { getColumnType, getLayerNameFromConfig } from "../../utils/layer-utils";
import { FilterBuilder, FilterField } from "../FilterBuilder";
import { FilterGroup } from "../FilterBuilder/types";
import { filterNodeToCQL } from "../../utils/cql-builder-advanced";
import { ShareModal } from "../LayerController/modals/ShareModal";
import { ShareHistoryModal } from "../LayerController/modals/ShareHistoryModal";
import { useMapContext } from "../../hooks/useMapContext";

const DEFAULT_TREE: FilterGroup = {
  id: "root",
  type: "group",
  operator: "AND",
  children: [],
};

export const ConcatenatedSearchModal = () => {
  const { searchConfig } = useSearchContext();
  const { layerSchemas } = useMapContext();

  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [fields, setFields] = useState<FilterField[]>([]);
  const [filterTree, setFilterTree] = useState<FilterGroup>(DEFAULT_TREE);
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShareHistoryOpen, setIsShareHistoryOpen] = useState(false);
  const { toastSuccess, toastError } = useToast();

  const environment =
    (import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br") +
    "/maps";

  const handleLayerChange = async (layerId: string) => {
    setSelectedLayerId(layerId);
    setFields([]);
    setFilterTree(DEFAULT_TREE);
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
      const layerConfig = searchConfig.value.find((c) => c.id === layerId);
      const mapping = layerConfig?.layerSchema?.attributeMapping || {};

      setFields(
        attributes.map((a: any) => ({
          name: a.name,
          type: getColumnType(a.binding) || "text",
          label: mapping[a.name]?.name || a.name,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch attributes", error);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedLayerId) return;

    const cql = filterNodeToCQL(filterTree);

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

    try {
      const headers = Object.keys(searchResults[0]).filter((k) => k !== "id");
      const csvContent = [
        headers.join(","),
        ...searchResults.map((row) =>
          headers
            .map((header) => {
              const val = row[header];
              const strVal = String(val === null || val === undefined ? "" : val);
              return strVal.includes(",") ? `"${strVal}"` : strVal;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "busca_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastSuccess("Exportação concluída com sucesso! (Limite: 1000 itens)");
    } catch (error) {
      console.error("Export failed", error);
      toastError("Falha ao exportar CSV.");
    }
  };

  const handleApplyToLayer = () => {
    if (!selectedLayerId) return;

    const layerConfig = searchConfig.value.find((c) => c.id === selectedLayerId);
    if (!layerConfig || !layerConfig.layerSchema) {
      toastError("Camada não encontrada ou não configurada corretamente.");
      return;
    }

    const cql = filterNodeToCQL(filterTree);
    const targetLayerId = layerConfig.layerSchema.id;

    layerSchemas.value = layerSchemas.value.map((s) => {
      if (s.id === targetLayerId) {
        return {
          ...s,
          cqlFilter: cql || undefined,
          filterTree: filterTree,
          isVisible: true,
        };
      }
      return s;
    });

    toastSuccess(`Filtro aplicado à camada "${layerConfig.layerSchema.name}"`);
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
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select value={selectedLayerId} onValueChange={handleLayerChange}>
                <SelectTrigger className="w-full">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <span className="material-symbols-outlined">more_vert</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsShareOpen(true)}>
                  <span className="material-symbols-outlined mr-2">share</span>
                  Compartilhar Busca
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsShareHistoryOpen(true)}>
                  <span className="material-symbols-outlined mr-2">history</span>
                  Histórico de Buscas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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

          <div className="flex justify-between pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-mono bg-muted px-1 rounded">
                DEBUG: {filterNodeToCQL(filterTree)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleApplyToLayer}
                disabled={!selectedLayerId}
              >
                Aplicar na Camada
              </Button>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !selectedLayerId}
              >
                {isSearching ? (
                  <>
                    <span className="material-symbols-outlined animate-spin mr-2">
                      progress_activity
                    </span>
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
                          {Object.keys(searchResults[0]).map((key) => {
                            const layer = searchConfig.value.find(
                              (c) => c.id === selectedLayerId
                            );
                            const mapping = layer?.layerSchema?.attributeMapping?.[key];
                            const displayName = mapping?.name || key;
                            const description = mapping?.description;

                            return (
                              <TableHead key={key} className="whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {displayName}
                                  {description && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Info className="h-3 w-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{description}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((val: any, j) => (
                              <TableCell
                                key={j}
                                className="whitespace-nowrap max-w-[200px] truncate"
                                title={String(val)}
                              >
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
      <ShareModal
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        type="search"
      />
      <ShareHistoryModal
        isOpen={isShareHistoryOpen}
        onOpenChange={setIsShareHistoryOpen}
        type="search"
      />
    </Dialog>
  );
};
