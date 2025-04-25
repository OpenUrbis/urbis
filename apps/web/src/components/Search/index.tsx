import { computed } from "@preact/signals-react";
import "@rmwc/card/styles";
import "@rmwc/circular-progress/styles";
import "@rmwc/textfield/styles";
import { TargetedEvent, useEffect } from "preact/compat";
import { createElement, ReactNode } from "react";
import { Card, CircularProgress, List, ListItem, TextField } from "rmwc";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { useMapContext } from "../../hooks/useMapContext";
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
    results,
    searchConfig,
    resetSearch,
    populateSearchConfig,
    searchQuery,
  } = useSearchContext();
  const mapContext = useMapContext();
  const clickActions = CLICK_ACTIONS_CONFIG(mapContext);

  useEffect(() => {
    populateSearchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasTerm = computed(
    () => !!(currentTerm.value && currentTerm.value.length >= 3)
  );

  const handleSearch = (e: TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    // O search é acionado automaticamente pelo react-query quando o searchTerm é alterado
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
      console.log({
        latitude,
        longitude,
        feature: rawData,
        template,
      });
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
    <div className="search-container">
      <Card className="search-card">
        {
          (
            <div className="search-card-container">
              <form
                onSubmit={handleSearch}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <TextField
                  label="Buscar"
                  placeholder="Digite para buscar..."
                  value={currentTerm.value}
                  outlined
                  onChange={(e: { target: { value: string } }) =>
                    (currentTerm.value = e.target.value)
                  }
                  style={{ flex: 1, width: "100%" }}
                />
                {searchQuery.isLoading && <CircularProgress width="24px" />}
              </form>

              {searchQuery.error && (
                <p style={{ color: "red", marginTop: "8px" }}>
                  {(searchQuery.error as { message: string }).message}
                </p>
              )}

              {!currentTerm.value && (
                <p className="search-placeholder">
                  Busque por IPTU, endereço, coordenadas, bairros ou regiões de
                  São Paulo:
                </p>
              )}

              {currentTerm.value && !hasTerm.value && (
                <p className="search-placeholder">
                  Digite ao menos 3 caracteres para buscar.
                </p>
              )}

              {hasTerm.value && (
                <>
                  {searchConfig.value.map((config) =>
                    buildList(config, results.value[config.id])
                  )}
                </>
              )}
            </div>
          ) as ReactNode
        }
      </Card>
    </div>
  );
};
