import {
  Button,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { Info, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import * as ReactWindow from "react-window";

// @ts-ignore
const List = (ReactWindow.FixedSizeList ||
  (ReactWindow as any).default?.FixedSizeList ||
  (ReactWindow as any).default ||
  ReactWindow) as any;
import axios from "axios";
import { useSearchContext } from "../../hooks/useSearchContext";
import { ConcatenatedSearchState } from "../../types/search-context-type";
import { useToast } from "@/hooks/useToast";
import { getLayerNameFromConfig } from "../../utils/layer-utils";
import { FilterBuilder, FilterField } from "../FilterBuilder";
import { FilterGroup } from "../FilterBuilder/types";
import { filterNodeToCQL } from "../../utils/cql-builder-advanced";
import { ShareModal } from "../LayerController/modals/ShareModal";
import { ShareHistoryModal } from "../LayerController/modals/ShareHistoryModal";
import { useMapContext } from "../../hooks/useMapContext";
import { useAuth } from "@open-urbis/map-auth";
import { AuthRequiredModal } from "../AuthRequiredModal";
import { PredefinedSearchSuggestions } from "./PredefinedSearchSuggestions";
import { fetchAttributes as fetchAttributesFromIntegration } from "../../integrations/layer-attributes-integration";

const DEFAULT_TREE: FilterGroup = {
  id: "root",
  type: "group",
  operator: "AND",
  children: [],
};

interface ConcatenatedSearchModalProps {
  trigger?: React.ReactNode;
}

export const ConcatenatedSearchModal = ({ trigger }: ConcatenatedSearchModalProps) => {
  const { searchConfig, concatenatedSearch } = useSearchContext();
  const { layerSchemas } = useMapContext();
  const auth = useAuth();

  const {
    selectedLayerId,
    filterTree,
    results: searchResults,
    totalCount,
    isOpen: open,
  } = concatenatedSearch.value;

  const setConcatenatedSearch = (newVal: Partial<ConcatenatedSearchState>) => {
    concatenatedSearch.value = { ...concatenatedSearch.value, ...newVal };
  };

  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [fields, setFields] = useState<FilterField[]>([]);
  const [errorAttributes, setErrorAttributes] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShareHistoryOpen, setIsShareHistoryOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { toastSuccess, toastError } = useToast();

  const lastFetchedLayerId = useRef<string | null>(null);
  const attemptsRef = useRef(0);
  const maxAttempts = 3;

  const environment = (import.meta.env.VITE_API_URL || "/api") + "/maps";

  const fetchAttributes = async (layerId: string) => {
    if (!layerId || lastFetchedLayerId.current === layerId) return;

    // Se já atingiu o máximo de tentativas para este layer, não tenta novamente
    if (attemptsRef.current >= maxAttempts) return;

    const layerConfig = layerSchemas.value.find((c) => c.id === layerId);
    if (!layerConfig) return;

    const fullLayerName = getLayerNameFromConfig(layerConfig);
    if (!fullLayerName) return;

    setLoadingAttributes(true);

    // O loop aqui tenta até maxAttempts vezes dentro desta chamada
    // Mas o attemptsRef garante que se falhar 3x, próximas chamadas (do useEffect) não tentam de novo
    while (attemptsRef.current < maxAttempts) {
      try {
        const attributes = await fetchAttributesFromIntegration(
          layerConfig.origin,
          fullLayerName
        );

        if (attributes.length === 0) {
          throw new Error("No attributes found");
        }

        const mapping =
          (layerConfig?.properties as any)?.attributeMapping || {};

        setFields(
          attributes.map((attrName) => ({
            name: attrName,
            type: "text", // Integration helper returns only names, defaulting to text
            label:
              mapping[attrName]?.label || mapping[attrName]?.name || attrName,
          }))
        );

        lastFetchedLayerId.current = layerId;
        attemptsRef.current = 0; // Reset attempts on success
        break;
      } catch (error) {
        attemptsRef.current++;
        console.error(
          `Failed to fetch attributes (Attempt ${attemptsRef.current})`,
          error
        );
        if (attemptsRef.current >= maxAttempts) {
          setLoadingAttributes(false);
          setErrorAttributes(
            "Não foi possível carregar os atributos desta camada para realizar a busca."
          );
          break;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    setLoadingAttributes(false);
  };

  const handleSearch = async () => {
    if (!selectedLayerId) return;

    const cql = filterNodeToCQL(filterTree);

    setIsSearching(true);
    setConcatenatedSearch({
      results: [],
      totalCount: undefined,
    });

    try {
      const layerConfig = searchConfig.value.find(
        (c) => c.id === selectedLayerId
      );
      if (layerConfig) {
        const fullLayerName = getLayerNameFromConfig(layerConfig);
        if (!fullLayerName) return;

        const url = layerConfig.origin.replace("{environment}", environment);

        const response = await axios.get(url, {
          params: {
            service: "WFS",
            version: "1.1.0",
            request: "GetFeature",
            typeName: fullLayerName,
            outputFormat: "application/json",
            CQL_FILTER: cql || undefined,
            srsName: "EPSG:4326",
            maxFeatures: 1000,
          },
          transformResponse: (data) => data,
        });

        const responseText = response.data;
        let responseJson;
        try {
          responseJson = JSON.parse(responseText);
        } catch (e) {
          responseJson = {};
        }

        let items: any[] = [];
        items = (responseJson.features || []).map((f: any) => ({
          id: f.id,
          ...f.properties,
        }));

        const totalFeatures =
          responseJson.totalFeatures || responseJson.numberMatched;

        setConcatenatedSearch({
          results: items,
          totalCount: totalFeatures,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  // Effect to load attributes if a layer is pre-selected (e.g., from a shared link)
  useEffect(() => {
    if (open && selectedLayerId && fields.length === 0 && !loadingAttributes) {
      fetchAttributes(selectedLayerId);
    }
  }, [open, selectedLayerId, fields.length, loadingAttributes]);

  const handleLayerChange = async (layerId: string) => {
    setFields([]);
    setErrorAttributes(null);
    lastFetchedLayerId.current = null;
    attemptsRef.current = 0; // Reset attempts when changing layer manually

    setConcatenatedSearch({
      selectedLayerId: layerId,
      filterTree: DEFAULT_TREE,
      results: [],
      totalCount: undefined,
    });

    if (layerId) {
      await fetchAttributes(layerId);
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
              const strVal = String(
                val === null || val === undefined ? "" : val
              );
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

  const handleActionWithAuth = (action: () => void) => {
    if (!auth.isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    action();
  };

  const handleApplyToLayer = () => {
    if (!selectedLayerId) return;

    const layerConfig = searchConfig.value.find(
      (c) => c.id === selectedLayerId
    );
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
    <Dialog
      open={open}
      onOpenChange={(v) => setConcatenatedSearch({ isOpen: v })}
    >
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 rounded-full h-9 w-9 shadow-sm border-input"
            title="Busca Concatenada"
          >
            <span className="material-symbols-outlined text-base">filter_list</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold">Busca Concatenada</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto">
          {(!selectedLayerId || (filterTree.children.length === 0 && searchResults.length === 0)) && (
            <PredefinedSearchSuggestions />
          )}

          <div className="space-y-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
              Camada de busca
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select value={selectedLayerId} onValueChange={handleLayerChange}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Selecione uma camada para pesquisar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {layerSchemas.value
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
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <span className="material-symbols-outlined">more_vert</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleActionWithAuth(() => setIsShareOpen(true))}
                  >
                    <span className="material-symbols-outlined mr-2">share</span>
                    Compartilhar Busca
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleActionWithAuth(() => setIsShareHistoryOpen(true))
                    }
                  >
                    <span className="material-symbols-outlined mr-2">
                      history
                    </span>
                    Histórico de Buscas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {loadingAttributes && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 py-4 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando atributos da camada...
            </div>
          )}

          {errorAttributes && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4 flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined text-base">
                error
              </span>
          {errorAttributes}
        </div>
      )}

      {errorAttributes && (
        <div className="text-xs text-muted-foreground text-center px-4">
          <p>
            Algumas camadas podem não estar aptas para a busca concatenada devido a
            restrições de serviço ou configurações do servidor.
          </p>
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
                  onChange={(tree) => setConcatenatedSearch({ filterTree: tree })}
                  fields={fields}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleApplyToLayer}
                disabled={!selectedLayerId}
                className="h-10 px-6 rounded-full"
              >
                Aplicar na Camada
              </Button>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !selectedLayerId}
                className="h-10 px-8 rounded-full shadow-md"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2">
                      search
                    </span>
                    Buscar agora
                  </>
                )}
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3 mt-6">
              <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                  <h3 className="font-bold text-sm uppercase tracking-wider">Resultados da busca</h3>
                  <p className="text-xs text-muted-foreground">
                    Exibindo {searchResults.length} de{" "}
                    {totalCount !== undefined ? totalCount : "?"} registros encontrados
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="h-8 text-[11px] rounded-full px-4"
                >
                  <span className="material-symbols-outlined text-sm mr-2">
                    download
                  </span>
                  Exportar CSV
                </Button>
              </div>
              <div className="border rounded-xl overflow-hidden shadow-sm bg-background">
                <div className="relative overflow-x-auto">
                  <div className="min-w-max">
                    <Table className="w-full table-fixed border-separate border-spacing-0">
                      <TableHeader className="sticky top-0 bg-muted/50 z-20 backdrop-blur-md">
                        <TableRow>
                          {Object.keys(searchResults[0]).map((key) => {
                            const layer = searchConfig.value.find(
                              (c) => c.id === selectedLayerId
                            );
                            const mapping =
                              (layer?.layerSchema?.properties as any)?.attributeMapping?.[key];
                            const displayName = mapping?.label || mapping?.name || key;
                            const description = mapping?.description;

                            return (
                              <TableHead
                                key={key}
                                className="whitespace-nowrap h-10 text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-4 border-b w-[200px] min-w-[200px]"
                              >
                                {description ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                        {displayName}
                                        <Info className="h-3 w-3" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs">{description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  displayName
                                )}
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                    </Table>
                    <List
                      height={400}
                      itemCount={searchResults.length}
                      itemSize={40}
                      width={Object.keys(searchResults[0]).length * 200}
                    >
                      {({ index, style }: { index: number; style: any }) => {
                        const row = searchResults[index];
                        return (
                          <div
                            style={style}
                            className="flex border-b hover:bg-muted/30 transition-colors items-center"
                          >
                            {Object.values(row).map((val: any, j) => (
                              <div
                                key={j}
                                className="whitespace-nowrap w-[200px] min-w-[200px] truncate text-[11px] py-2 px-4 shrink-0"
                                title={String(val)}
                              >
                                {String(val)}
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    </List>
                  </div>
                </div>
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
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />
    </Dialog>
  );
};
