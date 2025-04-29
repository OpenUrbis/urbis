/* eslint-disable turbo/no-undeclared-env-vars */
import DeckGL, { PolygonLayer } from "deck.gl";
import { useRef } from "react";
import { Map } from "react-map-gl/mapbox";
import { calculateCentroid } from "../MapView/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PolygonMap = ({ polygonCoordinates }: any) => {
  const accessToken =
    import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    "your-mapbox-access-token";
  const mapRef = useRef(null);

  const centroid = calculateCentroid(polygonCoordinates[0]);

  const layer = new PolygonLayer({
    id: "polygon-layer",
    data: [{ coordinates: polygonCoordinates }],
    pickable: false,
    stroked: true,
    filled: true,
    lineWidthMinPixels: 2,
    getPolygon: (d) => d.coordinates,
    getFillColor: [255, 165, 0, 100],
    getLineColor: [255, 140, 0],
  });

  const initialViewState = {
    longitude: centroid[0],
    latitude: centroid[1],
    zoom: 16.5,
    pitch: 0,
    bearing: 0,
  };

  return (
    <div
      style={{
        height: 184,
        marginTop: "12px",
        overflow: "hidden",
        borderRadius: "12px",
        position: "relative",
      }}
    >
      <DeckGL
        ref={mapRef}
        initialViewState={initialViewState}
        controller={false}
        layers={[layer]}
      >
        {
          (
            <Map
              id="polygon-details"
              mapboxAccessToken={accessToken}
              mapStyle="mapbox://styles/mapbox/standard-satellite"
            />
          ) as // eslint-disable-next-line @typescript-eslint/no-explicit-any
          any
        }
      </DeckGL>
    </div>
  );
};
