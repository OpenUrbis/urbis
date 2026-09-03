import { useToast } from "../../hooks/useToast";
import { useAuth } from "@open-urbis/map-auth";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UrbisIcon,
} from "@open-urbis/map-ui";
import axios from "axios";
import { Info, Loader2, Save, Share2, Table, Library } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { List } from "react-window";
import { useMapContext } from "../../hooks/useMapContext";
import { useSearchContext } from "../../hooks/useSearchContext";
import { getAuthHeaders } from "../../utils/auth-headers";
import { fetchAttributes as fetchAttributesFromIntegration } from "../../integrations/layer-attributes-integration";
import { ConcatenatedSearchState } from "../../types/search-context-type";
import { filterNodeToCQL } from "../../utils/cql-builder-advanced";
import { getLayerNameFromConfig } from "../../utils/layer-utils";
import { AuthRequiredModal } from "../AuthRequiredModal";
import { FilterBuilder, FilterField } from "../FilterBuilder";
import { FilterGroup } from "../FilterBuilder/types";
import { ShareHistoryModal } from "../LayerController/modals/ShareHistoryModal";
import { ShareModal } from "../LayerController/modals/ShareModal";
import { PredefinedSearchSuggestions } from "./PredefinedSearchSuggestions";

const DEFAULT_TREE: FilterGroup = {
  id: "root",
  type: "group",
  operator: "AND",
  children: [],
};

const GEOMETRY_ATTRIBUTE_NAMES = new Set([
  "geom",
  "geometry",
  "the_geom",
  "wkb_geometry",
  "shape",
  "geometria",
]);

const isGeometryAttributeName = (name: string) =>
  GEOMETRY_ATTRIBUTE_NAMES.has(name.trim().toLowerCase());

const getSearchParamKey = (
  searchParams: URLSearchParams,
  targetKey: string,
) => {
  return Array.from(searchParams.keys()).find(
    (key) => key.toLowerCase() === targetKey.toLowerCase(),
  );
};

const setSearchParam = (
  searchParams: URLSearchParams,
  key: string,
  value?: string | number,
) => {
  const existingKey = getSearchParamKey(searchParams, key);

  if (existingKey) {
    searchParams.delete(existingKey);
  }

  if (value !== undefined && value !== null && value !== "") {
    searchParams.set(key, String(value));
  }
};

const ensureSearchParam = (
  searchParams: URLSearchParams,
  key: string,
  value: string | number,
) => {
  const existingKey = getSearchParamKey(searchParams, key);

  if (!existingKey) {
    searchParams.set(key, String(value));
  }
};

interface ConcatenatedSearchModalProps {
  trigger?: React.ReactNode;
}

export const ConcatenatedSearchModal = ({
  trigger,
}: ConcatenatedSearchModalProps) => {
  const { concatenatedSearch } = useSearchContext();
  const { layerSchemas } = useMapContext();
  const auth = useAuth();

  const {
    selectedLayerId,
    filterTree,
    results: searchResults,
    totalCount,
    layerTotalCount,
    isOpen: open,
  } = concatenatedSearch.value;

  const searchResultColumns =
    searchResults.length > 0 ? Object.keys(searchResults[0]) : [];
  const resultsTableWidth = Math.max(searchResultColumns.length, 1) * 200;

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

  const calcPercentage = (filtered: number, total: number) => {
    if (total <= 0) return 0;
    const pct = (filtered / total) * 100;
    if (filtered > 0 && pct < 1) {
      return "<1";
    }
    return Math.round(pct);
  };

  const buildSearchRequestConfig = (
    origin: string,
    typeName: string,
    cql?: string,
    maxFeatures: number = 1000,
  ) => {
    const resolvedUrl = origin.replace("{environment}", environment);
    const [baseUrl, queryString = ""] = resolvedUrl.split("?");
    const searchParams = new URLSearchParams(queryString);

    ensureSearchParam(searchParams, "service", "WFS");
    ensureSearchParam(searchParams, "version", "1.1.0");
    ensureSearchParam(searchParams, "request", "GetFeature");
    ensureSearchParam(searchParams, "outputFormat", "application/json");
    ensureSearchParam(searchParams, "srsName", "EPSG:4326");

    setSearchParam(searchParams, "typeName", typeName);
    setSearchParam(searchParams, "CQL_FILTER", cql);
    setSearchParam(searchParams, "maxFeatures", maxFeatures);

    return {
      url: baseUrl,
      params: searchParams,
    };
  };

  const fetchLayerTotalCount = async (layerId: string) => {
    if (!layerId) return;

    const layerConfig = layerSchemas.value.find((c) => c.id === layerId);
    if (!layerConfig) return;

    const fullLayerName = getLayerNameFromConfig(layerConfig);
    if (!fullLayerName) return;

    const layerOrigin =
      layerConfig.origin ||
      (layerConfig.properties as any)?.source?.url ||
      (layerConfig.properties as any)?.wms?.url ||
      "";

    try {
      const { url, params } = buildSearchRequestConfig(
        layerOrigin,
        fullLayerName,
        undefined,
        1,
      );

      const response = await axios.get(url, {
        params,
        transformResponse: (data) => data,
      });

      const responseText = response.data;
      let responseJson: any = {};
      try {
        responseJson = JSON.parse(responseText);
      } catch (_error) {
        responseJson = {};
      }

      const total =
        responseJson.totalFeatures ??
        responseJson.numberMatched ??
        (responseJson.features ? responseJson.features.length : undefined);

      if (total !== undefined) {
        setConcatenatedSearch({
          layerTotalCount: total,
        });
      }
    } catch (error) {
      console.error("Failed to fetch layer total count", error);
    }
  };

  const fetchAttributes = async (layerId: string) => {
    if (!layerId || lastFetchedLayerId.current === layerId) return;

    // Se já atingiu o máximo de tentativas para este layer, não tenta novamente
    if (attemptsRef.current >= maxAttempts) return;

    const layerConfig = layerSchemas.value.find((c) => c.id === layerId);
    if (!layerConfig) {
      setErrorAttributes("Camada selecionada não foi encontrada.");
      return;
    }

    const fullLayerName = getLayerNameFromConfig(layerConfig);
    if (!fullLayerName) {
      setErrorAttributes(
        "Não foi possível identificar o nome técnico (typeName) desta camada para carregar os atributos de filtro.",
      );
      return;
    }

    const layerOrigin =
      layerConfig.origin ||
      (layerConfig.properties as any)?.source?.url ||
      (layerConfig.properties as any)?.wms?.url ||
      "";

    setLoadingAttributes(true);
    setErrorAttributes(null);

    while (attemptsRef.current < maxAttempts) {
      try {
        const attributes = await fetchAttributesFromIntegration(
          layerOrigin,
          fullLayerName,
        );

        if (attributes.length === 0) {
          throw new Error("Nenhum atributo retornado pelo serviço WFS DescribeFeatureType.");
        }

        const mapping =
          (layerConfig?.properties as any)?.attributeMapping || {};

        setFields(
          attributes
            .filter((attr) => !isGeometryAttributeName(attr.name))
            .map((attr) => ({
              name: attr.name,
              type: attr.type,
              label:
                mapping[attr.name]?.label || mapping[attr.name]?.name || attr.name,
            })),
        );

        lastFetchedLayerId.current = layerId;
        attemptsRef.current = 0; // Reset attempts on success
        break;
      } catch (error: any) {
        attemptsRef.current++;
        console.error(
          `Failed to fetch attributes (Attempt ${attemptsRef.current})`,
          error,
        );
        if (attemptsRef.current >= maxAttempts) {
          setLoadingAttributes(false);
          const detail = error?.message ? `: ${error.message}` : ".";
          setErrorAttributes(
            `Não foi possível carregar os atributos desta camada para realizar a busca${detail}`,
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
    console.log(selectedLayerId);
    if (!selectedLayerId) return;

    const cql = filterNodeToCQL(filterTree, fields);
    console.log("cql", cql);

    setIsSearching(true);
    setConcatenatedSearch({
      results: [],
      totalCount: undefined,
    });

    try {
      const layerConfig = layerSchemas.value.find(
        (c) => c.id === selectedLayerId,
      );
      if (layerConfig) {
        const fullLayerName = getLayerNameFromConfig(layerConfig);
        if (!fullLayerName) {
          toastError("Não foi possível identificar o nome técnico (typeName) da camada para busca.");
          return;
        }

        const layerOrigin =
          layerConfig.origin ||
          (layerConfig.properties as any)?.source?.url ||
          (layerConfig.properties as any)?.wms?.url ||
          "";

        const { url, params } = buildSearchRequestConfig(
          layerOrigin,
          fullLayerName,
          cql || undefined,
        );

        const headers = await getAuthHeaders().catch(() => ({}));

        const response = await axios.get(url, {
          params,
          headers,
          transformResponse: (data) => data,
        });

        const responseText = response.data;
        let responseJson: any = {};
        try {
          responseJson = JSON.parse(responseText);
        } catch (_error) {
          responseJson = {};
        }

        let items: any[] = [];
        items = (responseJson.features || []).map((f: any) => ({
          id: f.id,
          ...f.properties,
        }));

        const totalFeatures =
          responseJson.totalFeatures ??
          responseJson.numberMatched ??
          items.length;

        if (!cql) {
          setConcatenatedSearch({
            results: items,
            totalCount: totalFeatures,
            layerTotalCount: totalFeatures,
          });
        } else {
          setConcatenatedSearch({
            results: items,
            totalCount: totalFeatures,
          });
          if (layerTotalCount === undefined) {
            fetchLayerTotalCount(selectedLayerId);
          }
        }

        if (items.length === 0) {
          toastError("Nenhum resultado encontrado na busca.");
        } else {
          toastSuccess(`${items.length} registro(s) encontrado(s).`);
        }
      }
    } catch (error: any) {
      console.error("Search failed:", error);
      toastError(
        error?.message
          ? `Falha ao realizar a busca: ${error.message}`
          : "Falha ao realizar a busca na camada.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Effect to load attributes if a layer is pre-selected (e.g., from a shared link)
  useEffect(() => {
    if (open && selectedLayerId && fields.length === 0 && !loadingAttributes) {
      fetchAttributes(selectedLayerId);
    }
    if (open && selectedLayerId && layerTotalCount === undefined) {
      fetchLayerTotalCount(selectedLayerId);
    }
  }, [open, selectedLayerId, fields.length, loadingAttributes, layerTotalCount]);

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
      layerTotalCount: undefined,
    });

    if (layerId) {
      fetchLayerTotalCount(layerId);
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
                val === null || val === undefined ? "" : val,
              );
              return strVal.includes(",") ? `"${strVal}"` : strVal;
            })
            .join(","),
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

    const layerConfig = layerSchemas.value.find(
      (c) => c.id === selectedLayerId,
    );
    if (!layerConfig || !layerConfig) {
      toastError("Camada não encontrada ou não configurada corretamente.");
      return;
    }

    const cql = filterNodeToCQL(filterTree, fields);
    const targetLayerId = layerConfig.id;

    layerSchemas.value = layerSchemas.value.map((s) => {
      if (s.id === targetLayerId) {
        return {
          ...s,
          cqlFilter: cql || undefined,
          filterTree: filterTree,
          isActive: true,
          isSelected: true,
          isVisible: true,
        };
      }
      return s;
    });

    toastSuccess(`Filtro aplicado à camada "${layerConfig.name}"`);
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
            title="Filtros por atributos de camadas"
          >
            <UrbisIcon
              name="filter_list"
              className="text-base"
              aria-hidden="true"
            />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader className="mb-4 space-y-2">
          <DialogTitle className="text-xl font-bold">
            Filtros por atributos de camadas
          </DialogTitle>
          <p className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Escolha uma camada e combine critérios dos seus atributos para
            exibir no mapa apenas as feições correspondentes.
          </p>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto">
          {(!selectedLayerId ||
            (filterTree.children.length === 0 &&
              searchResults.length === 0)) && <PredefinedSearchSuggestions />}

          <div className="space-y-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
              Camada de busca
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={selectedLayerId}
                  onValueChange={handleLayerChange}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Selecione uma camada para pesquisar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {layerSchemas.value.map((c) => (
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
                    <UrbisIcon
                      name="more_vert"
                      className=""
                      aria-hidden="true"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      handleActionWithAuth(() => setIsShareOpen(true))
                    }
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar filtro
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleActionWithAuth(() => setIsShareOpen(true))
                    }
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar filtro salvo
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleActionWithAuth(() => setIsShareHistoryOpen(true))
                    }
                  >
                    <Library className="mr-2 h-4 w-4 text-muted-foreground" />
                    Salvos
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
              <UrbisIcon
                name="error"
                className="text-base"
                aria-hidden="true"
              />
              {errorAttributes}
            </div>
          )}

          {errorAttributes && (
            <div className="text-xs text-muted-foreground text-center px-4">
              <p>
                Algumas camadas podem não estar aptas para filtros por atributos
                devido a restrições de serviço ou configurações do servidor.
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
                  onChange={(tree) =>
                    setConcatenatedSearch({ filterTree: tree })
                  }
                  fields={fields}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <div className="flex gap-2 items-center">
              <Button
                variant="secondary"
                onClick={handleApplyToLayer}
                disabled={!selectedLayerId}
                className="h-10 px-6 rounded-full"
              >
                Aplicar na Camada
              </Button>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !selectedLayerId}
                  className="h-10 px-8 rounded-full shadow-md gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Table className="h-4 w-4" />
                      Prévia dos resultados
                    </>
                  )}
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted shrink-0">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs" side="top" align="end">
                      <div className="text-xs leading-relaxed space-y-1.5 p-1">
                        <p>Clique no botão para visualizar rapidamente uma tabela com os registros que atendem aos filtros aplicados.</p>
                        <div className="border-t pt-1.5 mt-1.5 text-[11px] text-muted-foreground space-y-1">
                          <p className="font-semibold text-foreground">Maiores informações:</p>
                          <p>A tabela é limitada aos primeiros 1000 registros, ordenados pelo ID, e sem o atributo de geometria.</p>
                          <p>Para uma visualização maior, com possibilidade de ordenar e filtrar os resultados, utilize a opção Baixar CSV e abra o arquivo em uma aplicação de planilhas (ex.: Excel, Numbers ou Sheets).</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {totalCount !== undefined && (
            <div className="space-y-3 mt-6">
              <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                  <h3 className="font-bold text-sm uppercase tracking-wider">
                    Resultados dos filtros
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Exibindo {searchResults.length} de{" "}
                    {totalCount !== undefined ? totalCount : "?"} registros
                    encontrados
                  </p>
                  {totalCount !== undefined &&
                    layerTotalCount !== undefined &&
                    layerTotalCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ({calcPercentage(totalCount, layerTotalCount)}% dos{" "}
                        {layerTotalCount} totais da camada).
                      </p>
                    )}
                </div>
                {searchResults.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      className="h-8 text-[11px] rounded-full px-4"
                    >
                      <UrbisIcon
                        name="download"
                        className="text-sm mr-2"
                        aria-hidden="true"
                      />
                      Exportar CSV
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted shrink-0">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs" side="top" align="end">
                          <div className="text-xs leading-relaxed space-y-1.5 p-1">
                            <p>Clique para exportar essa tabela em um arquivo .csv pelo botão Exportar CSV.</p>
                            <div className="border-t pt-1.5 mt-1.5 text-[11px] text-muted-foreground space-y-1">
                              <p className="font-semibold text-foreground">Maiores informações:</p>
                              <p>O arquivo possui os mesmos conteúdos da tabela, portanto, o mesmo limite de 1000 registros e sem o atributo de geometria.</p>
                              <p>Para exportar geometrias visíveis sobre uma área, utilize a ferramenta Exportar geometrias da tela, disponível no lado direito da tela.</p>
                              <p>Para fazer o download de um dado completo, é possível clicar no botão Baixar tudo, dentro da caixa Mais informações de uma camada, ou nos Metadados da camada - também acessível pela caixa Mais informações ou pela pesquisa nos Dados Abertos).</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
              {searchResults.length > 0 ? (
                <div className="border rounded-xl overflow-hidden shadow-sm bg-background">
                  <div className="relative overflow-x-auto">
                    <div style={{ width: resultsTableWidth }}>
                      <div className="sticky top-0 z-20 flex border-b bg-muted/50 backdrop-blur-md">
                        {searchResultColumns.map((key) => {
                          const layer = layerSchemas.value.find(
                            (c) => c.id === selectedLayerId,
                          );
                          const mapping = (layer?.properties as any)
                            ?.attributeMapping?.[key];
                          const displayName =
                            mapping?.label || mapping?.name || key;
                          const description = mapping?.description;

                          return (
                            <div
                              key={key}
                              className="flex h-10 min-w-[200px] items-center px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
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
                            </div>
                          );
                        })}
                      </div>
                      <List
                        style={{
                          height: 400,
                          width: resultsTableWidth,
                          overflowX: "hidden",
                          overflowY: "auto",
                        }}
                        rowCount={searchResults.length}
                        rowHeight={40}
                        rowProps={{}}
                        rowComponent={({ index, style }) => {
                          const row = searchResults[index];
                          return (
                            <div
                              style={style}
                              className="flex border-b hover:bg-muted/30 transition-colors items-center"
                            >
                              {searchResultColumns.map((key) => {
                                const val = row[key] ?? "-";

                                return (
                                  <div
                                    key={key}
                                    className="whitespace-nowrap w-[200px] min-w-[200px] truncate text-[11px] py-2 px-4 shrink-0"
                                    title={String(val)}
                                  >
                                    {String(val)}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-xl shadow-sm bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 p-6">
                  <div className="flex items-center justify-center gap-3 text-amber-900 dark:text-amber-100">
                    <UrbisIcon name="info" className="" aria-hidden="true" />
                    <div className="text-center">
                      <p className="font-medium">
                        Nenhum resultado encontrado para os filtros informados.
                      </p>
                      <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                        Revise os critérios da busca ou tente uma combinação
                        diferente.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
