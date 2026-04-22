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
import { Switch } from "@open-urbis/map-ui";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { useSearchContext } from "../../hooks/useSearchContext";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
  IGetSearchItemError,
} from "../../types/fetch-search-config-type";
import { ITemplate } from "../ViewTemplate/types/templates-type";
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
    const template: ITemplate[] = layerSchema?.viewTemplate ?? [];

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
      <div className="mt-4">
        <span className="font-semibold block mb-2">
          {config.name} (0)
        </span>
        <div className="text-destructive mt-3 p-2 bg-destructive/10 rounded">
          {list?.[0]?.message ||
            "Ocorreu um erro ao buscar os dados. Tente novamente mais tarde."}
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
      <div className="mt-4">
        <span className="font-semibold block mb-2">
          {config.name} ({totalCount})
        </span>
        <ul className="mt-2 border-t border-border divide-y divide-border">
          {list.map((result) => {
            const content = result as IGetSearchItem;

            return (
              <li
                key={content.id}
                className="py-2 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between group"
                onClick={() => {
                  handleClickItem(config, content);
                  resetSearch();
                  clearResults();
                }}
              >
                <span className="line-clamp-2 text-sm flex-1 mr-2">
                  {content.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setJsonFeature(convertFeatureToSirgas(content.rawData));
                  }}
                  title="Ver JSON"
                >
                  <span className="material-symbols-outlined text-xs">data_object</span>
                </Button>
              </li>
            )
          })}
        </ul>
      </div>
    );
  };

  return (
    <Card className="rounded-xl border shadow-sm">
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
                  className="pr-8"
                />
                {currentTerm.value && (
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="absolute right-0 top-0 h-full w-8 hover:bg-transparent"
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
                    className="shrink-0 rounded-full"
                  >
                    <span className="material-symbols-outlined text-base">
                      settings
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configuração de Pesquisa</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium text-muted-foreground">
                            Opção de pesquisa
                          </th>
                          <th className="text-center py-2 font-medium text-muted-foreground">
                            Habilitada
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchConfig.value.map((config) => (
                          <tr
                            key={config.id}
                            className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-2 font-medium">{config.name}</td>
                            <td className="py-2 text-center">
                              <Switch
                                checked={config.isActive !== false}
                                onCheckedChange={() =>
                                  toggleConfig(config.id, config.isActive)
                                }
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
                className="shrink-0 rounded-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-base">search</span>
                )}
              </Button>
            </form>

            {error && <p className="text-destructive mt-2 text-sm">{error}</p>}

            {!data && (
              <p className="mt-2 text-sm text-muted-foreground">
                Busque por IPTU, endereço, coordenadas, bairros ou regiões de
                São Paulo:
              </p>
            )}

            {data && (
              <div className="max-h-[60vh] overflow-y-auto">
                {searchConfig.value
                  .filter((config) => config.isActive !== false)
                  .map((config) => buildList(config, data?.[config.id] ?? []))}
              </div>
            )}

            <Dialog open={!!jsonFeature} onOpenChange={(open) => !open && setJsonFeature(null)}>
              <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Detalhes da Feature (JSON)</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto bg-muted p-4 rounded-md text-xs font-mono whitespace-pre-wrap">
                  {jsonFeature && JSON.stringify(jsonFeature, null, 2)}
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleCopyJson} className="gap-2">
                    <span className="material-symbols-outlined text-base">content_copy</span>
                    Copiar JSON
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
      </CardContent>
    </Card>
  );
};
