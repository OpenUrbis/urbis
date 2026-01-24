import { computed } from "@preact/signals";
import { PickingInfo } from "deck.gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import { Map } from "react-map-gl/mapbox";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { useMapContext } from "../../hooks/useMapContext";
import { DeckGLOverlay } from "./DeckGLOverlay";
import { transformSchemaLayers } from "./map-layer-transform";

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
    // eslint-disable-next-line react-hooks/rules-of-hooks
    overlayRef = useRef(null),
  } = mapContext;
  const clickActions = CLICK_ACTIONS_CONFIG(mapContext);

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

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {viewport.value && (
        <Map
          style={{ width: "100vw", height: "100vh" }}
          mapStyle="mapbox://styles/mapbox/light-v9"
          mapboxAccessToken={accessToken}
          initialViewState={viewport.value}
          onMoveEnd={() =>
            handleViewportChange(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (overlayRef.current as any)._deck.getViewports()[0]
            )
          }
        >
          <DeckGLOverlay
            ref={overlayRef}
            layers={layers.value}
            onClick={(i) => handleClick(i)}
          />
        </Map>
      )}
    </div>
  );
};
