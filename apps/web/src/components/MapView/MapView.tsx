/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { Map } from "react-map-gl/mapbox";
import { DeckGLOverlay } from "./DeckGLOverlay";

import { computed } from "@preact/signals";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapContext } from "../../context/MapContext/mapContext";
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
  } = useMapContext();

  const layers = computed(() =>
    transformSchemaLayers(layersSchema.value, {
      zoom: zoom.value,
      boundingBox: boundingBox.value,
    })
  );

  useEffect(() => {
    populateMapContext();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {viewport.value && (
        <Map
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
            onClick={console.log}
          />
        </Map>
      )}
    </div>
  );
}

export default MapView;
