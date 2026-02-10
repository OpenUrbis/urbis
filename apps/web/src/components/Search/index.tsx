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

  const buildList = (
    config: IGetSearchConfigResponse,
    list: IGetSearchItem[] = []
  ) => {
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
          {list.map((result) =>
            // eslint-disable-next-line react/no-children-prop
            createElement(ListItem, {
              key: result.id,
              onClick: () => {
                handleClickItem(config, result);

                resetSearch();
                clearResults();
              },
              children: [
                createElement(
                  "span",
                  { key: `${result.id}-text`, className: "text" },
                  result.name
                ),
              ],
            })
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
