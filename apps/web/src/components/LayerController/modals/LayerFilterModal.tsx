import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { useState, useEffect } from "react";
import { IGetConfigLayerSchema } from "../../../types/fetch-map-config-type";
import { filterNodeToCQL } from "../../../utils/cql-builder-advanced";
import { getLayerNameFromConfig } from "../../../utils/layer-utils";
import { useMapContext } from "../../../hooks/useMapContext";
import { FilterBuilder, FilterField } from "../../FilterBuilder";
import { fetchAttributes as fetchAttributesFromIntegration } from "../../../integrations/layer-attributes-integration";
import { FilterGroup } from "../../FilterBuilder/types";
import { PredefinedSearchSuggestions } from "../../Search/PredefinedSearchSuggestions";
import { Loader2, Filter, Info, AlertTriangle, Check, Code2, Globe } from "lucide-react";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<FilterField[]>([]);
  const [filterTree, setFilterTree] = useState<FilterGroup>(DEFAULT_TREE);
  const [copiedCql, setCopiedCql] = useState(false);
  const [copiedWms, setCopiedWms] = useState(false);

  const getCurrentCql = () => {
    return filterNodeToCQL(filterTree, fields) || layer.cqlFilter || "";
  };

  const getWmsUrl = () => {
    const cql = getCurrentCql();
    const fullLayerName = getLayerNameFromConfig(layer) || layer.id;
    const baseUrl = layer.origin || "";
    if (!baseUrl) return "";

    try {
      const urlObj = new URL(baseUrl, window.location.href);
      urlObj.searchParams.set("service", "WMS");
      urlObj.searchParams.set("version", "1.1.1");
      urlObj.searchParams.set("request", "GetMap");
      urlObj.searchParams.set("layers", fullLayerName);
      if (cql) {
        urlObj.searchParams.set("CQL_FILTER", cql);
      }
      return urlObj.toString();
    } catch {
      const filterParam = cql ? `&CQL_FILTER=${encodeURIComponent(cql)}` : "";
      return `${baseUrl}?service=WMS&version=1.1.1&request=GetMap&layers=${encodeURIComponent(fullLayerName)}${filterParam}`;
    }
  };

  const handleCopyCql = async () => {
    const cql = getCurrentCql();
    await navigator.clipboard.writeText(cql);
    setCopiedCql(true);
    setTimeout(() => setCopiedCql(false), 2000);
  };

  const handleCopyWms = async () => {
    const wmsUrl = getWmsUrl();
    if (wmsUrl) {
      await navigator.clipboard.writeText(wmsUrl);
    }
    setCopiedWms(true);
    setTimeout(() => setCopiedWms(false), 2000);
  };

  useEffect(() => {
    const fetchAttributes = async () => {
      const fullLayerName = getLayerNameFromConfig(layer);

      if (!fullLayerName) {
        console.error("Layer name not found. Config:", layer);
        setErrorMessage("Nome/typeName da camada não foi encontrado na configuração.");
        return;
      }

      setLoadingAttributes(true);
      setErrorMessage(null);
      try {
        const attributes = await fetchAttributesFromIntegration(
          layer.origin,
          fullLayerName,
        );
        if (attributes.length === 0) {
          throw new Error("Nenhum atributo retornado pelo serviço WFS DescribeFeatureType.");
        }
        setFields(
          attributes.map((attr) => ({
            name: attr.name,
            type: attr.type,
          })),
        );
      } catch (error: any) {
        console.error("Failed to fetch attributes", error);
        setErrorMessage(
          error?.message ?? "Falha ao carregar os parâmetros da camada."
        );
      } finally {
        setLoadingAttributes(false);
      }
    };

    if (open && layer) {
      fetchAttributes();
      if (layer.filterTree) {
        setFilterTree(layer.filterTree);
      } else {
        setFilterTree(DEFAULT_TREE);
      }
    }
  }, [open, layer]);

  const handleApply = () => {
    const cql = filterNodeToCQL(filterTree, fields);

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
          <DialogTitle className="text-xl font-bold text-primary">
            Filtrar geometrias no mapa: {layer.name}
          </DialogTitle>
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

          {errorMessage && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs leading-relaxed text-destructive space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Não foi possível carregar os parâmetros para filtro desta camada.</span>
              </div>
              <p className="text-muted-foreground text-[11px] font-mono break-all pt-1 border-t border-destructive/20">
                Detalhes técnicos: {errorMessage}
              </p>
            </div>
          )}

          {fields.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <div className="space-y-2">
                  <p>
                    Clique no botão <strong>+Condição</strong> e selecione o Atributo, o Operador relacional e o Valor desejados, com possibilidade de agrupar condições (botão <strong>+Grupo</strong>) e relacionar condições ou grupos com um operador lógico (E ou OU).
                  </p>
                  <div className="text-[11px] space-y-1 border-t pt-2 mt-2">
                    <p className="font-semibold text-foreground">Mais informações:</p>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>É possível ver o tipo de dado do atributo (Texto, Número ou Data) passando o mouse pelo ícone antes do seu nome.</li>
                      <li>Há operadores relacionais específicos para cada tipo de dado do parâmetro (ex.: para atributos tipo Número, estará disponível o operador relacional “Maior que”, enquanto para atributos tipo Texto, estará disponível o operador “Contém (consid. caixa)”).</li>
                    </ul>
                  </div>
                </div>
              </div>

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
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 pt-4 border-t flex-wrap sm:flex-nowrap gap-2 items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCql}
              className="h-8 text-xs gap-1.5 rounded-lg border-dashed text-muted-foreground hover:text-foreground"
              title="Copiar expressão CQL do filtro"
            >
              {copiedCql ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Code2 className="h-3.5 w-3.5" />}
              {copiedCql ? "CQL Copiado" : "Copiar CQL"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyWms}
              className="h-8 text-xs gap-1.5 rounded-lg border-dashed text-muted-foreground hover:text-foreground"
              title="Copiar URL do serviço WMS com o filtro CQL"
            >
              {copiedWms ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Globe className="h-3.5 w-3.5" />}
              {copiedWms ? "WMS Copiado" : "Copiar WMS"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleClear}
              className="rounded-full h-10 px-6"
            >
              Limpar filtros
            </Button>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleApply}
                className="rounded-full h-10 px-8 shadow-md gap-2"
              >
                <Filter className="h-4 w-4" />
                Aplicar no mapa
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
                      <p>Clique no botão para fazer efeito na camada.</p>
                      <div className="border-t pt-1.5 mt-1.5 text-[11px] text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground">Mais informações:</p>
                        <p>Uma mensagem de Sucesso deve aparecer no canto superior direito.</p>
                        <p>A camada com filtros é tornada visível, se já não estava, e na caixa Camadas é exibido um ícone de filtro aplicado, pelo qual é possível voltar à caixa de Filtros por atributos de camadas.</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
