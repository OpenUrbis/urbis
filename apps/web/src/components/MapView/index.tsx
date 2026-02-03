import { computed } from "@preact/signals";
import { PickingInfo } from "deck.gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect } from "react";
import { Map } from "react-map-gl/mapbox";
import { Button, CircularProgress } from "rmwc";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { useMapContext } from "../../hooks/useMapContext";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { LayerController } from "../LayerController";
import { DeckGLOverlay } from "./DeckGLOverlay";
import { addMapControls } from "./map-controls";
import { transformSchemaLayers } from "./map-layer-transform";
import "./style.scss";

export const MapView = () => {
  const accessToken =
    import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    "your-mapbox-access-token";

  const mapContext = useMapContext();

  const {
    layerSchemas,
    viewport,
    zoom,
    boundingBox,
    populateMapContext,
    handleViewportChange,
    selectedFeatures,
    overlayRef,
  } = mapContext;
  if (!overlayRef) {
    console.error("MapContext is not initialized (overlayRef is null)");
  }

  const polygonEdit = usePolygonEditContext();
  const { isEditing, loading, fetchData, feature } = polygonEdit;

  const clickActions = CLICK_ACTIONS_CONFIG();

  const layers = computed(() =>
    transformSchemaLayers(layerSchemas.value, {
      zoom: zoom.value,
      boundingBox: boundingBox.value,
      selectedFeature: selectedFeatures.value,
    }).flat()
  );

  useEffect(() => {
    populateMapContext();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = (info: PickingInfo) => {
    const { clickAction, viewTemplate: template } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (info?.layer?.props as any) ?? {};
    if (!clickAction) return console.error("clickAction not defined");
    if (!info?.coordinate || !info.object || !info.object.id)
      return console.error("No informations about the clicked object");

    const { action, params } = clickAction!;
    const actionFn = clickActions[action as keyof typeof clickActions];

    if (actionFn) {
      actionFn(params, {
        latitude: info?.coordinate[1],
        longitude: info?.coordinate[0],
        template,
        feature: info.object,
      });
    }
  };

  const saveButton = () => {
    return (
      <Button
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        icon={!loading ? "save" : ((<CircularProgress />) as any)}
        disabled={loading}
        label="Salvar / Atualizar"
        raised
        className="save-button"
        onClick={() => fetchData(feature.value)}
      />
    );
  };

  return (
    <>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {viewport.value && (
          <Map
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/light-v9"
            mapboxAccessToken={accessToken}
            initialViewState={viewport.value}
            onMoveEnd={() =>
              handleViewportChange(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (overlayRef!.current as any)._deck.getViewports()[0]
              )
            }
          >
            <DeckGLOverlay
              ref={overlayRef}
              layers={!isEditing.value ? layers.value : []}
              onClick={(i) => handleClick(i)}
              onLoad={() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                addMapControls((overlayRef.current as any)._map, polygonEdit);
              }}
            />
          </Map>
        )}
      </div>
      {isEditing.value ? saveButton() : <LayerController />}
    </>
  );
};
