import { signal } from "@preact/signals";
import "preact/compat";
import { Button, IconButton } from "rmwc";
import { useMapContext } from "../../hooks/useMapContext";
import { LayerGroup } from "./LayerGroup";
import "./style.scss";

const isCollapsed = signal<boolean>(false);

export const LayerController = () => {
  const { layerGroups } = useMapContext();

  return (
    <>
      {!isCollapsed.value && (
        <Button
          raised
          icon="layers"
          label="Camadas"
          onClick={() => (isCollapsed.value = true)}
          className="main-button"
        />
      )}

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
