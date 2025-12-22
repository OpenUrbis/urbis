import { useEffect } from "preact/compat";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { useSearchContext } from "../../hooks/useSearchContext";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
  IGetSearchItemError,
} from "../../types/fetch-search-config-type";
import { ITemplate } from "../ViewTemplate/types/templates-type";

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

    return (
      <div className="mt-4">
        <span className="font-semibold block mb-2">
          {config.name} ({list.length})
        </span>
        <ul className="mt-2 border-t border-border divide-y divide-border">
          {list.map((result) => {
            const content = result as IGetSearchItem;

            return (
              <li
                key={content.id}
                className="py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  handleClickItem(config, content);
                  resetSearch();
                  clearResults();
                }}
              >
                <span className="line-clamp-2 text-sm">
                  {content.name}
                </span>
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
                {searchConfig.value.map((config) =>
                  buildList(config, data?.[config.id] ?? [])
                )}
              </div>
            )}
      </CardContent>
    </Card>
  );
};
