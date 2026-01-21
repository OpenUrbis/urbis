import { computed } from "@preact/signals";
import { useCallback } from "react";
import { Icon, Tooltip } from "rmwc";
import { useMapContext } from "../../hooks/useMapContext";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";
import "./LayerItem.scss";

export const LayerItem = ({ item }: { item: IGetConfigLayerSchema }) => {
  const { handleVisibleLayer, zoom } = useMapContext();

  const renderLayerClassName = useCallback(
    () => `layer-item ${item.isVisible ? "layer-item-active" : ""}`,
    [item.isVisible]
  );

  const renderColor = () => {
    const { colors } = item;
    const colorArray = colors.filter((color) => color.type === "fill");

    return (
      <div className="layer-item-color">
        {colorArray.map((itemColor, index) => (
          <div
            key={index}
            style={{ backgroundColor: `rgba(${itemColor.color.join(",")})` }}
          ></div>
        ))}
      </div>
    );
  };

  const renderVisibilityIcon = computed(() => {
    if (item.isVisible && (item.minZoom || item?.properties?.maxZoom)) {
      if (item.minZoom)
        if (zoom.value > item.minZoom) {
          return <Icon icon="visibility" />;
        } else {
          return (
            <Tooltip
              content={`Esta camada só é visível a partir do zoom nível ${item.minZoom}.`}
              tag="div"
            >
              <Icon icon="visibility_off" />
            </Tooltip>
          );
        }
      if (item.properties?.maxZoom)
        if (zoom.value < item?.properties?.maxZoom) {
          return <Icon icon="visibility" />;
        } else {
          return (
            <Tooltip
              content={`Esta camada só é visível a partir do zoom nível ${item?.properties?.maxZoom}.`}
              tag="div"
            >
              <Icon icon="visibility_off" />
            </Tooltip>
          );
        }
    }

    return <></>;
  });

  return (
    <section
      key={item.id}
      className={renderLayerClassName()}
      onClick={() => handleVisibleLayer(item.id)}
    >
      {renderColor()}
      <span className="layer-item-name">{item.name}</span>
      {<div className="layer-item-actions">{renderVisibilityIcon.value}</div>}
    </section>
  );
};
