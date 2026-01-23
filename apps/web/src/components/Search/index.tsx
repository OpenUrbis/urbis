import { useEffect, useState } from "preact/compat";
import { Card, CardContent } from "@open-urbis/map-ui";
import { Input } from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@open-urbis/map-ui";
import { Switch, cn } from "@open-urbis/map-ui";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { useSearchContext } from "../../hooks/useSearchContext";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
  IGetSearchItemError,
} from "../../types/fetch-search-config-type";
import { ConcatenatedSearchModal } from "./ConcatenatedSearchModal";
import proj4 from "proj4";
import { useDebounce } from "@/hooks/useDebounce";

proj4.defs(
  "EPSG:31983",
  "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
);

const convertFeatureToSirgas = (feature: any) => {
  if (!feature || !feature.geometry) return feature;
  const cloned = JSON.parse(JSON.stringify(feature));

  const transform = (coords: any): any => {
    if (typeof coords[0] === "number") {
      return proj4("EPSG:4326", "EPSG:31983", coords);
    }
    return coords.map(transform);
  };

  if (cloned.geometry.coordinates) {
    cloned.geometry.coordinates = transform(cloned.geometry.coordinates);
  }

  if (cloned.bbox) {
    const min = proj4("EPSG:4326", "EPSG:31983", [
      cloned.bbox[0],
      cloned.bbox[1],
    ]);
    const max = proj4("EPSG:4326", "EPSG:31983", [
      cloned.bbox[2],
      cloned.bbox[3],
    ]);
    cloned.bbox = [min[0], min[1], max[0], max[1]];
  }

  cloned.crs = {
    type: "name",
    properties: { name: "urn:ogc:def:crs:EPSG::31983" },
  };

  return cloned;
};

export const Search = () => {
  const {
    currentTerm,
    searchConfig,
    resetSearch,
    populateSearchConfig,
    searchQuery,
  } = useSearchContext();
  const { data, error, fetchData, clearResults, loading } = searchQuery;
  const clickActions = CLICK_ACTIONS_CONFIG();
  const { reset: resetPolygonEdit } = usePolygonEditContext();
  const [jsonFeature, setJsonFeature] = useState<any>(null);
  const debouncedTerm = useDebounce(currentTerm.value, 500);

  useEffect(() => {
    if (debouncedTerm) {
      fetchData(debouncedTerm);
    } else {
      clearResults();
    }
  }, [debouncedTerm]);

  const handleCopyJson = () => {
    if (jsonFeature) {
      navigator.clipboard.writeText(JSON.stringify(jsonFeature, null, 2));
    }
  };

  useEffect(() => {
    populateSearchConfig();
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const search = query.get("search");
    if (search) {
      currentTerm.value = search;
      fetchData(currentTerm.value);
    }
  }, [searchConfig.value]);

  const toggleConfig = (id: string, currentStatus: boolean | undefined) => {
    const newStatus = currentStatus === false ? true : false;
    searchConfig.value = searchConfig.value.map((c) =>
      c.id === id ? { ...c, isActive: newStatus } : c
    );

    if (currentTerm.value) {
      fetchData(currentTerm.value);
    }
  };

  const handleClickItem = (
    config: IGetSearchConfigResponse,
    item: IGetSearchItem
  ) => {
    const { clickAction: clickActionsRoot, layerSchema } = config;
    const clickAction = clickActionsRoot?.action
      ? clickActionsRoot
      : layerSchema?.clickAction;
    const template = layerSchema?.viewTemplate ?? [];

    if (!clickAction) return;

    const { action, params } = clickAction;
    const actionFn = clickActions[action as keyof typeof clickActions];
    if (actionFn) {
      const { latitude, longitude, rawData } = item;
      resetPolygonEdit();
      actionFn(params, {
        latitude,
        longitude,
        feature: rawData,
        template,
      });
    }
  };

  const renderError = (
    config: IGetSearchConfigResponse,
    list: IGetSearchItemError[] = []
  ) => {
    return (
      <div className="mt-4 px-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {config.name} (0)
        </span>
        <div className="text-destructive mt-1.5 p-2 bg-destructive/10 rounded-lg text-xs border border-destructive/20 shadow-sm">
          {list?.[0]?.message ||
            "Erro ao buscar os dados."}
        </div>
      </div>
    )
  }

  const buildList = (
    config: IGetSearchConfigResponse,
    list: IGetSearchItem[] | IGetSearchItemError[] = []
  ) => {
    if (list.findIndex((item) => (item as IGetSearchItemError)?.type === 'error') >= 0) return renderError(config, list as IGetSearchItemError[]);

    const totalCount = (list as any).totalCount ?? list.length;

    return (
      <div className="mt-4 first:mt-2 px-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {config.name} ({totalCount})
        </span>
        <ul className="mt-1.5 space-y-0.5">
          {list.map((result) => {
            const content = result as IGetSearchItem;

            return (
              <li
                key={content.id}
                className="p-1.5 cursor-pointer hover:bg-accent/50 rounded-lg transition-all flex items-center justify-between group border border-transparent hover:border-border/50"
                onClick={() => {
                  handleClickItem(config, content);
                  resetSearch();
                  clearResults();
                }}
              >
                <span className="line-clamp-2 text-xs flex-1 mr-2 text-foreground/90 group-hover:text-foreground">
                  {content.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setJsonFeature(convertFeatureToSirgas(content.rawData));
                  }}
                  title="Ver JSON"
                >
                  <span className="material-symbols-outlined text-[14px]">data_object</span>
                </Button>
              </li>
            )
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "rounded-2xl border shadow-sm backdrop-blur-sm overflow-hidden transition-colors duration-300",
          data ? "bg-background/95" : "bg-background/50"
        )}
      >
        <CardContent className="p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchData(currentTerm.value);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Input
                    placeholder="Digite para buscar..."
                    value={currentTerm.value}
                    onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                      (currentTerm.value = e.target.value)
                    }
                    className="pr-8 h-10 rounded-xl"
                  />
                  {currentTerm.value && (
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="absolute right-0 top-0 h-full w-8 hover:bg-transparent rounded-full"
                      onClick={() => {
                        resetSearch();
                        clearResults();
                      }}
                    >
                      <span className="material-symbols-outlined text-base text-muted-foreground">close</span>
                    </Button>
                  )}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      className="shrink-0 rounded-full h-10 w-10 border-input"
                      title="Configurações de busca"
                    >
                      <span className="material-symbols-outlined text-base">
                        tune
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md p-4">
                    <DialogHeader className="mb-2">
                      <DialogTitle className="text-lg font-bold">Configuração de Pesquisa</DialogTitle>
                    </DialogHeader>
                    <div className="py-1 overflow-hidden border rounded-xl shadow-sm bg-background">
                      <table className="w-full text-[13px]">
                        <thead className="bg-muted/50 backdrop-blur-md text-[10px]">
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-bold text-muted-foreground uppercase tracking-wider">
                              Opção
                            </th>
                            <th className="text-center py-2 px-3 font-bold text-muted-foreground uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {searchConfig.value.map((config) => (
                            <tr
                              key={config.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-2 px-3 font-medium text-foreground/90">{config.name}</td>
                              <td className="py-2 px-3 text-center">
                                <Switch
                                  checked={config.isActive !== false}
                                  onCheckedChange={() =>
                                    toggleConfig(config.id, config.isActive)
                                  }
                                  className="scale-75 origin-center"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </DialogContent>
                </Dialog>

                <ConcatenatedSearchModal />
                
                <Button
                  variant="outline"
                  size="icon"
                  type="submit"
                  className="shrink-0 rounded-full h-10 w-10 shadow-sm border-input"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-base">search</span>
                  )}
                </Button>
              </form>

              {error && <p className="text-destructive mt-3 px-1 text-xs font-medium">{error}</p>}

              {!data && !currentTerm.value && (
                <div className="mt-4 px-1">
                  <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                    Busque por IPTU, endereço, coordenadas, bairros ou regiões de
                    São Paulo utilizando a barra acima.
                  </p>
                </div>
              )}

              {data && (
                <div className="mt-2 max-h-[50vh] overflow-y-auto pr-1">
                  {searchConfig.value
                    .filter((config) => config.isActive !== false)
                    .map((config) => buildList(config, data?.[config.id] ?? []))}
                </div>
              )}
        </CardContent>
      </Card>

      <Dialog open={!!jsonFeature} onOpenChange={(open) => !open && setJsonFeature(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">Detalhes da Feature (SIRGAS 2000)</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted p-4 rounded-xl text-xs font-mono whitespace-pre-wrap border shadow-inner">
            {jsonFeature && JSON.stringify(jsonFeature, null, 2)}
          </div>
          <div className="flex justify-end pt-4 mt-2 border-t gap-2">
            <Button variant="outline" onClick={() => setJsonFeature(null)} className="rounded-full px-6">
              Fechar
            </Button>
            <Button onClick={handleCopyJson} className="gap-2 rounded-full px-8 shadow-md">
              <span className="material-symbols-outlined text-base">content_copy</span>
              Copiar GeoJSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
