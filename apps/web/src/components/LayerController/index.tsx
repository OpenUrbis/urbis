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
      {/* Botões flutuantes no canto inferior esquerdo */}
<div
  style={{
    position: "fixed",
    bottom: "30px",
    left: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    zIndex: 9999,
  }}
>
  {/* Botão 3D */}
  {has3DLayer.value && (
    <button
      onClick={() => (is3DActive.value = !is3DActive.value)}
      title="Alternar visualização 3D"
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        backgroundColor: "#007bff",
        color: "#fff",
        fontSize: "20px",
        fontWeight: "bold",
        textAlign: "center",
        lineHeight: "48px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        border: "none",
        cursor: "pointer",
      }}
    >
      3D
    </button>
  )}

  {/* Botão de Ajuda */}
  <a
    href="https://urbis.sampa.br/pt/ajuda"
    target="_blank"
    rel="noopener noreferrer"
    title="Ajuda"
    style={{
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      backgroundColor: "#007bff",
      color: "#fff",
      fontSize: "24px",
      fontWeight: "bold",
      textAlign: "center",
      lineHeight: "48px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
      border: "none",
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-block",
    }}
  >
    ?
  </a>
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
