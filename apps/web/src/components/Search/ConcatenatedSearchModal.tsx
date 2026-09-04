import { useToast } from "@/hooks/useToast";
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
  Input,
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
  cn,
} from "@open-urbis/map-ui";
import axios from "axios";
import {
  Info,
  Loader2,
  Save,
  Share2,
  TableProperties,
  FileSpreadsheet,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Search,
  X,
  Map,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Library,
  Database,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { List } from "react-window";
import { useMapContext } from "../../hooks/useMapContext";
import { useSearchContext } from "../../hooks/useSearchContext";
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
import { getOptionalAuthHeaders } from "../../utils/auth-headers";
import { normalizeEnvironmentUrl } from "../MapView/map-layer-transform";

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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState(480);
  const [containerWidth, setContainerWidth] = useState(1000);

  const { toastSuccess, toastError } = useToast();

  const lastFetchedLayerId = useRef<string | null>(null);
  const attemptsRef = useRef(0);
  const maxAttempts = 3;

  const environment = (import.meta.env.VITE_API_URL || "/api") + "/maps";

  const selectedLayerConfig = useMemo(() => {
    return layerSchemas.value.find((c) => c.id === selectedLayerId);
  }, [layerSchemas.value, selectedLayerId]);

  const activeFiltersCount = useMemo(() => {
    const countNodes = (group: FilterGroup): number => {
      let count = 0;
      for (const child of group.children) {
        if (child.type === "condition") count++;
        else if (child.type === "group") count += countNodes(child);
      }
      return count;
    };
    return filterTree ? countNodes(filterTree) : 0;
  }, [filterTree]);

  // Column definitions & mappings
  const searchResultColumns = useMemo(() => {
    if (searchResults.length === 0) return [];
    return Object.keys(searchResults[0]).filter(
      (k) => !isGeometryAttributeName(k),
    );
  }, [searchResults]);

  const COLUMN_WIDTH = 190;
  const ROW_INDEX_WIDTH = 56;
  const ROW_HEIGHT = 34;
  const HEADER_HEIGHT = 38;

  const resultsTableWidth = Math.max(
    ROW_INDEX_WIDTH + searchResultColumns.length * COLUMN_WIDTH,
    containerWidth,
  );

  // Client-side instant filter & sort
  const displayedResults = useMemo(() => {
    let list = searchResults;

    if (clientSearchTerm.trim()) {
      const term = clientSearchTerm.toLowerCase().trim();
      list = list.filter((row) =>
        Object.entries(row).some(([key, val]) => {
          if (isGeometryAttributeName(key)) return false;
          return String(val ?? "")
            .toLowerCase()
            .includes(term);
        }),
      );
    }

    if (sortColumn) {
      list = [...list].sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === "asc" ? numA - numB : numB - numA;
        }

        return sortDirection === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return list;
  }, [searchResults, clientSearchTerm, sortColumn, sortDirection]);

  const hasMoreRecords = useMemo(() => {
    if (searchResults.length === 0) return false;
    if (totalCount !== undefined && totalCount > 0) {
      return searchResults.length < totalCount;
    }
    return searchResults.length % 1000 === 0;
  }, [searchResults.length, totalCount]);

  const handleLoadMore = async () => {
    if (!selectedLayerId || isLoadingMore || isSearching) return;

    const layerConfig = layerSchemas.value.find(
      (c) => c.id === selectedLayerId,
    );
    if (!layerConfig) return;

    const fullLayerName = getLayerNameFromConfig(layerConfig);
    if (!fullLayerName) return;

    const layerOrigin =
      layerConfig.origin ||
      (layerConfig.properties as any)?.source?.url ||
      (layerConfig.properties as any)?.wms?.url ||
      "";

    const cql = filterNodeToCQL(filterTree, fields);
    const startIndex = searchResults.length;

    setIsLoadingMore(true);
    try {
      const { url, params } = buildSearchRequestConfig(
        layerOrigin,
        fullLayerName,
        cql,
        1000,
        startIndex,
      );

      const headers = await getOptionalAuthHeaders();

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

      const newItems = (responseJson.features || []).map((f: any) => ({
        id: f.id,
        ...f.properties,
      }));

      if (newItems.length === 0) {
        toastSuccess("Todos os registros disponíveis já foram carregados.");
      } else {
        const combined = [...searchResults, ...newItems];
        setConcatenatedSearch({
          results: combined,
        });
        toastSuccess(
          `+${newItems.length} registros adicionados. Total em memória: ${combined.length.toLocaleString("pt-BR")}.`,
        );
      }
    } catch (error: any) {
      console.error("Load more failed:", error);
      toastError(
        error?.message
          ? `Falha ao carregar mais registros: ${error.message}`
          : "Falha ao carregar mais registros da camada.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ResizeObserver for Excel-like 100% responsive height
  useEffect(() => {
    if (!tableContainerRef.current) return;
    const updateSize = () => {
      if (tableContainerRef.current) {
        setContainerHeight(Math.max(tableContainerRef.current.clientHeight, 260));
        setContainerWidth(Math.max(tableContainerRef.current.clientWidth, 600));
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(tableContainerRef.current);
    return () => observer.disconnect();
  }, [open, isFiltersExpanded, isFullScreen, searchResults.length]);

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
    startIndex?: number,
  ) => {
    let resolvedUrl = normalizeEnvironmentUrl(origin);
    if (
      resolvedUrl.includes("geoserver.slui.dev/geoserver/slui/ows") ||
      resolvedUrl.includes("geoserver.slui.dev/geoserver/slui/wms")
    ) {
      resolvedUrl = `${environment}/proxy/wfs`;
    } else if (
      resolvedUrl.startsWith("http") &&
      !resolvedUrl.includes(window.location.host) &&
      !resolvedUrl.includes("/maps/proxy")
    ) {
      resolvedUrl = `${environment}/proxy?url=${encodeURIComponent(resolvedUrl)}`;
    } else {
      resolvedUrl = resolvedUrl.replace("{environment}", environment);
    }

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
    if (startIndex !== undefined && startIndex > 0) {
      setSearchParam(searchParams, "startIndex", startIndex);
    }

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

      const headers = await getOptionalAuthHeaders();

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

    if (attemptsRef.current >= maxAttempts) return;

    const layerConfig = layerSchemas.value.find((c) => c.id === layerId);
    if (!layerConfig) {
      setErrorAttributes("Camada selecionada não foi encontrada.");
      return;
    }

    const fullLayerName = getLayerNameFromConfig(layerConfig);
    if (!fullLayerName) {
      setErrorAttributes(
        "Não foi possível identificar o nome técnico (typeName) desta camada para carregar os atributos.",
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
          throw new Error("Nenhum atributo retornado pelo serviço WFS.");
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
        attemptsRef.current = 0;
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
            `Não foi possível carregar os atributos desta camada${detail}`,
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

    const cql = filterNodeToCQL(filterTree, fields);

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
          toastError("Nome técnico da camada não identificado para busca.");
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
          cql,
          1000,
        );

        const headers = await getOptionalAuthHeaders();

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

        const items = (responseJson.features || []).map((f: any) => ({
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
          toastError("Nenhum resultado encontrado para os critérios.");
        } else {
          toastSuccess(`${items.length} registro(s) carregado(s) na tabela.`);
          // Automatically collapse filter panel once results arrive so table gets full screen
          setIsFiltersExpanded(false);
        }
      }
    } catch (error: any) {
      console.error("Search failed:", error);
      toastError(
        error?.message
          ? `Falha ao realizar a busca: ${error.message}`
          : "Falha ao consultar dados da camada.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Effect to load attributes and counts when selectedLayerId changes or modal opens
  useEffect(() => {
    if (open && selectedLayerId) {
      if (lastFetchedLayerId.current !== selectedLayerId && !loadingAttributes) {
        setFields([]);
        setErrorAttributes(null);
        attemptsRef.current = 0;
        fetchLayerTotalCount(selectedLayerId);
        fetchAttributes(selectedLayerId);
      }
    }
  }, [open, selectedLayerId, loadingAttributes]);

  const handleLayerChange = async (layerId: string) => {
    setFields([]);
    setErrorAttributes(null);
    lastFetchedLayerId.current = null;
    attemptsRef.current = 0;
    setClientSearchTerm("");
    setSortColumn(null);

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
      const headers = Object.keys(searchResults[0]).filter(
        (k) => k !== "id" && !isGeometryAttributeName(k),
      );
      const csvContent = [
        headers.join(","),
        ...searchResults.map((row) =>
          headers
            .map((header) => {
              const val = row[header];
              const strVal = String(
                val === null || val === undefined ? "" : val,
              );
              return strVal.includes(",") || strVal.includes('"')
                ? `"${strVal.replace(/"/g, '""')}"`
                : strVal;
            })
            .join(","),
        ),
      ].join("\n");

      const layerName = selectedLayerConfig?.name
        ? selectedLayerConfig.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
        : "registros";
      const filename = `urbis_${layerName}_export.csv`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastSuccess(`Arquivo "${filename}" baixado com sucesso!`);
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
    if (!layerConfig) {
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

    toastSuccess(`Filtro aplicado às geometrias de "${layerConfig.name}" no mapa.`);
  };

  const handleSortToggle = (colKey: string) => {
    if (sortColumn === colKey) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(colKey);
      setSortDirection("asc");
    }
  };

  const handleCopyCell = async (value: any, cellId: string) => {
    if (value === undefined || value === null || value === "-") return;
    const str = String(value);
    await navigator.clipboard.writeText(str);
    setCopiedCell(cellId);
    toastSuccess(`Copiado: "${str.slice(0, 32)}${str.length > 32 ? "..." : ""}"`);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  const getColumnTypeIcon = (fieldName: string, fieldType?: string) => {
    const type = fieldType?.toLowerCase() || "";
    const name = fieldName.toLowerCase();
    if (
      type.includes("int") ||
      type.includes("double") ||
      type.includes("float") ||
      type.includes("num") ||
      name.startsWith("nr_") ||
      name.startsWith("cd_") ||
      name.includes("area") ||
      name.includes("valor")
    ) {
      return (
        <span
          className="text-[9px] font-mono text-blue-500 font-bold px-1 py-0.5 rounded bg-blue-500/10"
          title="Número / Código"
        >
          #
        </span>
      );
    }
    if (
      type.includes("date") ||
      type.includes("time") ||
      name.includes("data") ||
      name.includes("dt_")
    ) {
      return (
        <span
          className="text-[9px] text-amber-500 px-1 py-0.5 rounded bg-amber-500/10"
          title="Data / Hora"
        >
          📅
        </span>
      );
    }
    return (
      <span
        className="text-[9px] font-serif text-emerald-500 font-bold px-1 py-0.5 rounded bg-emerald-500/10"
        title="Texto"
      >
        Aa
      </span>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => setConcatenatedSearch({ isOpen: v })}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          "p-0 flex flex-col gap-0 overflow-hidden bg-background shadow-2xl transition-all duration-200 [&>button:last-child]:hidden",
          isFullScreen
            ? "max-w-full w-screen h-screen max-h-screen rounded-none border-none inset-0"
            : "max-w-[98vw] w-[98vw] h-[94vh] max-h-[94vh] rounded-2xl border border-border/80",
        )}
      >
        {/* ========================================================= */}
        {/* 1. HEADER (Excel-style Title Bar)                        */}
        {/* ========================================================= */}
        <DialogHeader className="h-12 shrink-0 px-4 border-b bg-muted/40 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <DialogTitle className="text-sm font-bold truncate flex items-center gap-2">
              <span>Explorar registros filtrados</span>
              {selectedLayerConfig && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 max-w-[260px] truncate">
                  <Database className="h-3 w-3 shrink-0" />
                  <span className="truncate">{selectedLayerConfig.name}</span>
                </span>
              )}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Mais opções"
                >
                  <UrbisIcon name="more_vert" className="text-base" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => handleActionWithAuth(() => setIsShareOpen(true))}
                >
                  <Share2 className="mr-2 h-4 w-4 text-primary" />
                  Salvar e gerar link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleActionWithAuth(() => setIsShareHistoryOpen(true))
                  }
                >
                  <Library className="mr-2 h-4 w-4 text-muted-foreground" />
                  Minhas consultas salvas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Restaurar janela" : "Tela cheia"}
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setConcatenatedSearch({ isOpen: false })}
              title="Fechar janela"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* ========================================================= */}
        {/* 2. COMPACT TOOLBAR (Excel-like single line actions)       */}
        {/* ========================================================= */}
        <div className="shrink-0 px-4 py-2 border-b bg-background/95 backdrop-blur flex flex-wrap items-center justify-between gap-2">
          {/* Left: Layer Selector + Filter Drawer Button + Client Search */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Layer Selector */}
            <div className="w-[240px] sm:w-[280px]">
              <Select
                value={selectedLayerId}
                onValueChange={handleLayerChange}
              >
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue placeholder="Selecione uma camada..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {layerSchemas.value.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Collapsible Filter Toggle Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isFiltersExpanded ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 text-xs gap-1.5 rounded-lg font-medium",
                      activeFiltersCount > 0 &&
                        "border-primary/50 text-primary bg-primary/5",
                    )}
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    disabled={!selectedLayerId}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span>Critérios de filtro</span>
                    {activeFiltersCount > 0 && (
                      <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.2 text-[10px] font-bold text-primary-foreground">
                        {activeFiltersCount}
                      </span>
                    )}
                    {isFiltersExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  <p className="font-semibold">Regras de filtro da camada</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Adicione condições para filtrar atributos (ex: setor, quadra, uso ou área) antes de carregar a planilha.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Instant In-Table Filter */}
            {searchResults.length > 0 && (
              <div className="relative w-[200px] sm:w-[260px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm((e.target as HTMLInputElement).value)}
                  placeholder="Buscar nestas linhas..."
                  className="h-8 pl-8 pr-7 text-xs bg-muted/30 border-muted"
                />
                {clientSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setClientSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {searchResults.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      className="h-8 text-xs gap-1.5 rounded-lg border-muted hover:bg-muted/60"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Exportar CSV</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p className="font-semibold">Baixar planilha (.csv)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Exporta todos os registros e colunas carregados na grade para um arquivo CSV pronto para Excel ou Planilhas.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {selectedLayerId && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyToLayer}
                      className="h-8 text-xs gap-1.5 rounded-lg border-muted hover:bg-muted/60"
                    >
                      <Map className="h-3.5 w-3.5 text-blue-500" />
                      <span className="hidden md:inline">Filtrar no mapa</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p className="font-semibold">Filtrar geometrias no mapa</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Aplica as mesmas regras de filtro na visualização espacial do mapa, exibindo apenas as feições correspondentes.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={handleSearch}
                    disabled={isSearching || !selectedLayerId}
                    className="h-8 text-xs px-4 rounded-lg shadow-sm gap-1.5 font-semibold bg-primary hover:bg-primary/90"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Consultando...</span>
                      </>
                    ) : (
                      <>
                        <TableProperties className="h-3.5 w-3.5" />
                        <span>Consultar dados</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs" side="bottom" align="end">
                  <p className="font-semibold">Consultar registros da camada</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Carrega na grade abaixo os registros que atendem aos critérios de filtro (limite de 1.000 itens por consulta).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. COLLAPSIBLE FILTER ACCORDION (Tucks away neatly)       */}
        {/* ========================================================= */}
        {isFiltersExpanded && (
          <div className="shrink-0 border-b bg-muted/20 p-4 max-h-[42vh] overflow-y-auto space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Construtor de Regras de Filtro
                </span>
                <span className="text-[11px] text-muted-foreground">
                  (Combine condições para filtrar a consulta)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFiltersExpanded(false)}
                className="h-7 text-xs text-muted-foreground"
              >
                Ocultar filtros ✕
              </Button>
            </div>

            {(!selectedLayerId ||
              (filterTree.children.length === 0 &&
                searchResults.length === 0)) && (
              <PredefinedSearchSuggestions currentLayerId={selectedLayerId} />
            )}

            {loadingAttributes && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 py-3 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando atributos da camada...
              </div>
            )}

            {errorAttributes && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0" />
                <span>{errorAttributes}</span>
              </div>
            )}

            {fields.length > 0 && (
              <div className="border rounded-xl p-3 bg-background/80 shadow-sm backdrop-blur">
                <FilterBuilder
                  value={filterTree}
                  onChange={(tree) => setConcatenatedSearch({ filterTree: tree })}
                  fields={fields}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() =>
                  setConcatenatedSearch({
                    filterTree: DEFAULT_TREE,
                  })
                }
              >
                Limpar todos os critérios
              </Button>
              <Button
                size="sm"
                onClick={handleSearch}
                disabled={isSearching || !selectedLayerId}
                className="h-8 text-xs px-5 rounded-lg gap-1.5"
              >
                {isSearching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <TableProperties className="h-3.5 w-3.5" />
                )}
                Aplicar e consultar tabela
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. MAIN SPREADSHEET GRID (Excel Look & Feel 100% Tela)    */}
        {/* ========================================================= */}
        <div
          ref={tableContainerRef}
          className="flex-1 min-h-0 relative bg-background overflow-hidden flex flex-col"
        >
          {isSearching ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Consultando registros da camada...</p>
            </div>
          ) : searchResults.length > 0 ? (
            displayedResults.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <h4 className="text-sm font-semibold text-foreground">
                  Nenhum registro encontrado para &ldquo;{clientSearchTerm}&rdquo;
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mt-1 mb-4">
                  O termo pesquisado não está presente nos {searchResults.length} registros já carregados na memória.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClientSearchTerm("")}
                    className="h-8 text-xs"
                  >
                    Limpar filtro local
                  </Button>
                  {hasMoreRecords && (
                    <Button
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="h-8 text-xs gap-1.5"
                    >
                      {isLoadingMore ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Carregar próximo lote (+1.000)
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 relative overflow-x-auto overflow-y-hidden select-none">
                <div style={{ width: resultsTableWidth, height: "100%" }}>
                  {/* Sticky Header Row */}
                  <div
                    className="sticky top-0 z-20 flex border-b bg-muted/70 backdrop-blur-md shadow-sm"
                    style={{ height: HEADER_HEIGHT }}
                  >
                    {/* Row index header (#) */}
                    <div
                      style={{ width: ROW_INDEX_WIDTH }}
                      className="flex h-full shrink-0 items-center justify-center border-r bg-muted/90 text-[10px] font-mono font-bold text-muted-foreground select-none"
                    >
                      #
                    </div>

                    {/* Attribute Column Headers */}
                    {searchResultColumns.map((key) => {
                      const mapping = (selectedLayerConfig?.properties as any)
                        ?.attributeMapping?.[key];
                      const displayName = mapping?.label || mapping?.name || key;
                      const description = mapping?.description;
                      const fieldType = fields.find((f) => f.name === key)?.type;
                      const isSorted = sortColumn === key;

                      return (
                        <div
                          key={key}
                          style={{ width: COLUMN_WIDTH }}
                          onClick={() => handleSortToggle(key)}
                          className={cn(
                            "flex h-full shrink-0 items-center justify-between border-r px-2.5 text-[11px] font-semibold text-muted-foreground cursor-pointer hover:bg-muted/90 hover:text-foreground transition-colors group",
                            isSorted && "bg-primary/10 text-primary font-bold",
                          )}
                          title={`Clique para ordenar por ${displayName}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {getColumnTypeIcon(key, fieldType)}
                            <span className="truncate">{displayName}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {description && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Info className="h-3 w-3 text-muted-foreground/60 hover:text-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold">{displayName}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      {description}
                                    </p>
                                    <p className="text-[10px] font-mono text-primary mt-1 border-t pt-1">
                                      Campo técnico: {key}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {isSorted ? (
                              sortDirection === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5 text-primary shrink-0" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-primary shrink-0" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Virtualized Rows List */}
                  <List
                    style={{
                      height: Math.max(containerHeight - HEADER_HEIGHT, 150),
                      width: resultsTableWidth,
                      overflowX: "hidden",
                      overflowY: "auto",
                    }}
                    rowCount={displayedResults.length}
                    rowHeight={ROW_HEIGHT}
                    rowProps={{}}
                    rowComponent={({ index, style }) => {
                      const row = displayedResults[index];
                      const isEven = index % 2 === 0;

                      return (
                        <div
                          style={style}
                          className={cn(
                            "flex border-b text-xs transition-colors hover:bg-primary/5 items-center",
                            isEven ? "bg-background" : "bg-muted/15",
                          )}
                        >
                          {/* Row Index (#) */}
                          <div
                            style={{ width: ROW_INDEX_WIDTH }}
                            className="flex h-full shrink-0 items-center justify-center border-r bg-muted/30 text-[10px] font-mono text-muted-foreground/70 select-none"
                          >
                            {index + 1}
                          </div>

                          {/* Cell Values */}
                          {searchResultColumns.map((key) => {
                            const val = row[key];
                            const cellId = `${index}-${key}`;
                            const isCopied = copiedCell === cellId;
                            const isNumericOrCode =
                              typeof val === "number" ||
                              (typeof val === "string" &&
                                /^[0-9.-]+$/.test(val) &&
                                val.length > 2);

                            return (
                              <div
                                key={key}
                                style={{ width: COLUMN_WIDTH }}
                                onClick={() => handleCopyCell(val, cellId)}
                                className={cn(
                                  "flex h-full shrink-0 items-center border-r px-2.5 truncate cursor-pointer hover:bg-primary/10 transition-colors relative group",
                                  isNumericOrCode && "font-mono text-[11px]",
                                  isCopied && "bg-emerald-500/15 text-emerald-600 font-bold",
                                )}
                                title={
                                  val !== null && val !== undefined
                                    ? `${String(val)} (Clique para copiar)`
                                    : "-"
                                }
                              >
                                <span className="truncate">
                                  {val !== null && val !== undefined ? String(val) : "-"}
                                </span>
                                {isCopied && (
                                  <span className="absolute right-1 text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-1 rounded flex items-center gap-0.5">
                                    <Check className="h-2.5 w-2.5" />
                                    Copiado
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            )
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
                <TableProperties className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                {selectedLayerId
                  ? "Nenhum dado carregado ainda"
                  : "Selecione uma camada para começar"}
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mt-1 mb-5">
                {selectedLayerId
                  ? `Clique no botão "Consultar dados" para carregar a planilha da camada "${selectedLayerConfig?.name || selectedLayerId}".`
                  : "Escolha uma camada no topo para explorar os registros, aplicar critérios de filtro e visualizar em formato de planilha."}
              </p>
              {selectedLayerId && (
                <Button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="rounded-full px-6 gap-2"
                >
                  <TableProperties className="h-4 w-4" />
                  Consultar dados da camada
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 5. STATUS BAR (Excel-like bottom bar)                     */}
        {/* ========================================================= */}
        <div className="shrink-0 h-9 px-4 border-t bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3 truncate">
            {searchResults.length > 0 ? (
              <>
                <span className="font-semibold text-foreground">
                  {displayedResults.length === searchResults.length
                    ? `${searchResults.length.toLocaleString("pt-BR")} registros na memória`
                    : `${displayedResults.length.toLocaleString("pt-BR")} de ${searchResults.length.toLocaleString("pt-BR")} registros exibidos`}
                </span>
                {totalCount !== undefined &&
                  layerTotalCount !== undefined &&
                  layerTotalCount > 0 && (
                    <span className="hidden sm:inline border-l pl-3">
                      Total da camada: {layerTotalCount.toLocaleString("pt-BR")} (
                      {calcPercentage(totalCount, layerTotalCount)}% filtrado)
                    </span>
                  )}
                <span className="hidden md:inline border-l pl-3">
                  {searchResultColumns.length} colunas
                </span>
              </>
            ) : (
              <span>Pronto para consultar.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasMoreRecords && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="h-6 text-[11px] font-semibold gap-1.5 px-2.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-none transition-all"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span>Carregando mais...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 text-primary" />
                          <span>Carregar mais registros (+1.000)</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs" side="top" align="end">
                    <p className="font-semibold">Buscar próximo lote de dados</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Consulta mais 1.000 registros no servidor WFS e adiciona à tabela em memória para exploração e exportação.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <div className="hidden lg:flex items-center gap-2 text-[10px] text-muted-foreground/80 pl-2">
              <span>💡 Clique duplo na célula para copiar</span>
            </div>
          </div>
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
