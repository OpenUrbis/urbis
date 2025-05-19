import { computed, signal } from "@preact/signals";
import { useCallback, useState } from "react";
import { Button, IconButton, Select } from "rmwc";
import { useMapContext } from "../../hooks/useMapContext";
import {
  IGetConfigColor,
  IGetConfigLayerSchema,
} from "../../types/fetch-map-config-type";
import "./style.scss";

const isCollapsed = signal<boolean>(false);

export const MapLegend = () => {
  const [activedTab, setActivedTab] = useState<string>("");
  const { layerSchemas } = useMapContext();

  const layers = computed(() =>
    layerSchemas.value.filter(
      (schema: IGetConfigLayerSchema) =>
        schema.isVisible &&
        schema.colors.filter((cl) => cl.type === "fill").length > 1
    )
  );

  const activedLayer = useCallback(() => {
    const currentLayer = layers.value.find((layer) => layer.id === activedTab);
    if (!currentLayer && layers.value.length) setActivedTab(layers.value[0].id);

    return currentLayer;
  }, [layers.value, activedTab]);

  const renderColorClass = (item: IGetConfigColor) => {
    let result = "color";

    if (item?.pattern) result += ` pattern ${item.pattern}`;

    return result;
  };

  const renderLegend = (item?: IGetConfigLayerSchema) => {
    if (!item || item.colors.length === 0) return null;

    return item.colors.map((itemColor) => (
      <section key={itemColor.id} className="layer-legend-item">
        <div
          style={{ backgroundColor: `rgba(${itemColor.color.join(",")})` }}
          className={renderColorClass(itemColor)}
        ></div>
        <span className="label">{itemColor.label}</span>
      </section>
    ));
  };

  return layers.value.length ? (
    <>
      {!isCollapsed.value ? (
        <Button
          icon="closed_caption"
          label="Legendas"
          onClick={() => (isCollapsed.value = true)}
          className="map-legend-main-button"
          unelevated
        />
      ) : null}

      {isCollapsed.value ? (
        <div className="map-legend">
          <div className="header">
            <h5>Legendas:</h5>
            <IconButton
              icon="close"
              className="rmwc-icon-button-sm"
              label="Fechar"
              onClick={() => (isCollapsed.value = false)}
            />
          </div>

          <div className="content">
            <Select
              label="Selecione a uma camada"
              value={activedTab}
              onChange={(input: { target: { value: string } }) =>
                setActivedTab(input.target.value)
              }
              options={layers.value.map((value) => ({
                label: value.name,
                value: value.id,
              }))}
            />

            {renderLegend(activedLayer())}
          </div>
        </div>
      ) : null}
    </>
  ) : null;
};
