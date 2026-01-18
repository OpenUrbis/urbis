/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { Map } from "react-map-gl/mapbox";
import { DeckGLOverlay } from "./DeckGLOverlay";

import { computed } from "@preact/signals";
import { PickingInfo } from "deck.gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapContext } from "../../context/MapContext/mapContext";
import {
  GetConfigLayerSchemaClickActionAction,
  IGetConfigLayerSchemaClickAction,
} from "../../services/mapService";
import { transformSchemaLayers } from "./MapLayerTransform";

function MapView() {
  const accessToken =
    import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    "your-mapbox-access-token";
  const overlayRef = useRef(null);

  const {
    layersSchema,
    viewport,
    zoom,
    boundingBox,
    populateMapContext,
    handleViewportChange,
    selectFeature,
  } = useMapContext();

  const layers = computed(() =>
    transformSchemaLayers(layersSchema.value, {
      zoom: zoom.value,
      boundingBox: boundingBox.value,
    }).flat()
  );

  useEffect(() => {
    populateMapContext();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clickActions: {
    [key in GetConfigLayerSchemaClickActionAction]: (
      clickAction: IGetConfigLayerSchemaClickAction,
      info: PickingInfo
    ) => void;
  } = {
    OpenProps: (_clickAction, info) => {
      const { viewTemplate } = (info?.layer?.props as any) ?? {};
      if (!info.object || !info.object.id) return;

      selectFeature({ feature: info.object, template: viewTemplate });
    },
    setZoom: ({ params }, info) => {
      if (!info?.coordinate || !info.object || !info.object.id) return;
      if (!params.zoom)
        return console.error(
          'clickAction(setZoom) Error: Property "zoom" is not defined'
        );

      const destination = {
        center: [info?.coordinate[0], info?.coordinate[1]],
        zoom: params?.zoom,
        // pitch: 45,
        // bearing: 0,
      };

      setTimeout(() => {
        (overlayRef.current as any)._map.flyTo(destination);
      });
    },
  };

  const handleClick = (info: PickingInfo) => {
    const clickAction: IGetConfigLayerSchemaClickAction | undefined = (
      info?.layer?.props as any
    )?.clickAction;
    if (!clickAction) return;

    const { action } = clickAction!;
    if (clickActions?.[action]) clickActions[action](clickAction, info);
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
}

export default MapView;
