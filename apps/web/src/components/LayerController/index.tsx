import { computed, signal } from "@preact/signals";
import "preact/compat";
import { Button, IconButton } from "rmwc";
import { useMapContext } from "../../hooks/useMapContext";
import { LayerGroup } from "./LayerGroup";
import "./style.scss";

const isCollapsed = signal<boolean>(false);

export const LayerController = () => {
  const { layerGroups, layerSchemas, is3DActive } = useMapContext();

  const has3DLayer = computed(() => {
    const result = layerSchemas.value.filter((layer) => {
      const { getElevation } = layer.properties ?? {};

      const has =
        getElevation &&
        typeof getElevation === "string" &&
        getElevation.includes("=>");

      return layer.isVisible && has;
    });

    if (result.length) return true;
    else {
      is3DActive.value = true;
      return false;
    }
  });

  return (
    <>
      <div className="controllers-btn">
      {has3DLayer && (
        <Button
          icon="view_in_ar"
          label={is3DActive.value ? "Desativar 3D" : "Ativar 3D"}
          className="is-3d-active"
          onClick={() => (is3DActive.value = !is3DActive.value)}
          raised
        />
      )}
      {!isCollapsed.value && (
        <Button
          icon="layers"
          label="Camadas"
          onClick={() => (isCollapsed.value = true)}
          className="main-button"
          unelevated
        />
      )}
      </div>

      {isCollapsed.value && (
        <div className="layer-controller">
          <div className="header">
            <h5>Camadas</h5>
            <IconButton
              icon="close"
              label="Fechar"
              onClick={() => (isCollapsed.value = false)}
            />
          </div>

          <div className="content">
            {layerGroups.value.map((group, i) => (
              <LayerGroup key={`group-main-${i}`} group={group} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
