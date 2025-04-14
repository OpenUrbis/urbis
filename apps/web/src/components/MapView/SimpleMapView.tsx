import { useRef, useState } from "react";
import { Map } from "react-map-gl/mapbox";
import { DeckGLOverlay } from "./DeckGLOverlay";

import { ScatterplotLayer } from "@deck.gl/layers";
import "mapbox-gl/dist/mapbox-gl.css";

function SimpleMapView() {
  const accessToken =
    import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    "your-mapbox-access-token";
  const overlayRef = useRef(null);

  const [viewport, setViewport] = useState({
    latitude: -23.5505,
    longitude: -46.6333,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  });

  // Exemplo de camada simples com pontos
  const layers = [
    new ScatterplotLayer({
      id: "scatterplot-layer",
      data: [
        { position: [-46.6333, -23.5505], size: 100, color: [255, 0, 0] },
        { position: [-46.6433, -23.5605], size: 100, color: [0, 255, 0] },
      ],
      getPosition: (d) => d.position,
      getRadius: (d) => d.size,
      getFillColor: (d) => d.color,
      pickable: true,
      onClick: (info) => {
        if (info.object) {
          alert(`Clicou no ponto em ${info.object.position}`);
        }
      },
    }),
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <Map
        mapStyle="mapbox://styles/mapbox/light-v9"
        mapboxAccessToken={accessToken}
        initialViewState={viewport}
      >
        <DeckGLOverlay ref={overlayRef} layers={layers} interleaved={true} />
      </Map>
    </div>
  );
}

export default SimpleMapView;
