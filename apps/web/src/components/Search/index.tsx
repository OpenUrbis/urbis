import "@rmwc/card/styles";
import "@rmwc/circular-progress/styles";
import "@rmwc/textfield/styles";
import { useEffect } from "preact/compat";
import { createElement, ReactNode } from "react";
import { Card, CircularProgress, Fab, List, ListItem, TextField } from "rmwc";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { useSearchContext } from "../../hooks/useSearchContext";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
  IGetSearchItemError,
} from "../../types/fetch-search-config-type";
import { ITemplate } from "../ViewTemplate/types/templates-type";
import "./style.scss";

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const search = query.get("search");
    if (search) {
      currentTerm.value = search;
      fetchData(currentTerm.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <>
        <span>
          {config.name} (0)
        </span>
        <div className="alert alert-danger mt-3">
          {list?.[0]?.message ||
            "Ocorreu um erro ao buscar os dados. Tente novamente mais tarde."}
        </div>
      </>
    )
  }

  const buildList = (
    config: IGetSearchConfigResponse,
    list: IGetSearchItem[] | IGetSearchItemError[] = []
  ) => {
    if (list.findIndex((item) => (item as IGetSearchItemError)?.type === 'error') >= 0) return renderError(config, list as IGetSearchItemError[]);

    return (
      <>
        <span>
          {config.name} ({list.length})
        </span>
        <List
          twoLine={true}
          style={{
            marginTop: "16px",
            borderTop: "1px solid #efefef",
            listStyle: "none",
            padding: 0,
          }}
        >
          {list.map((result) => {
            const content = result as IGetSearchItem;

            // eslint-disable-next-line react/no-children-prop
            return createElement(ListItem, {
              key: content.id,
              onClick: () => {
                handleClickItem(config, content);

                resetSearch();
                clearResults();
              },
              children: [
                createElement(
                  "span",
                  { key: `${content.id}-text`, className: "text" },
                  content.name
                ),
              ],
            })
          }
          )}
        </List>
      </>
    );
  };

  return (
    <Card className="search-card">
      {
        (
          <div className="search-card-container">
            <form
              onSubmit={(e) => {
                e.preventDefault();

                fetchData(currentTerm.value);
              }}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <TextField
                label="Buscar"
                placeholder="Digite para buscar..."
                value={currentTerm.value}
                outlined
                onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                  (currentTerm.value = e.target.value)
                }
                trailingIcon={{
                  icon: "close",
                  tabIndex: 0,
                  onClick: () => {
                    resetSearch();
                    clearResults();
                  },
                }}
                style={{ flex: 1, width: "100%" }}
              />
              {createElement(Fab, {
                raised: true,
                icon: loading
                  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  createElement(CircularProgress as any, { width: "24px" })
                  : "search",
                type: "submit",
                class: "search-button",
              })}
            </form>

            {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}

            {!data && (
              <p className="search-placeholder">
                Busque por IPTU, endereço, coordenadas, bairros ou regiões de
                São Paulo:
              </p>
            )}

            {data && (
              <>
                {searchConfig.value.map((config) =>
                  buildList(config, data?.[config.id] ?? [])
                )}
              </>
            )}
          </div>
        ) as ReactNode
      }
    </Card>
  );
};
