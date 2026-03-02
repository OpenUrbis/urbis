import React, { useEffect, useMemo } from 'react';
import { MapView } from "../../MapView";
import { MapProvider } from "../../../context/MapContext";
import { SearchProvider } from "../../../context/SearchContext";
import { NavigationProvider } from "../../../context/NavigationContext";
import { PolygonEditProvider } from "../../../context/PolygonEditContext";
import { useMapContext } from "../../../hooks/useMapContext";

interface MapPreviewProps {
  featureCollection: any;
  mainGeometry: any;
}

const MapPreviewInner = ({ featureCollection, mainGeometry }: MapPreviewProps) => {
  const { layerSchemas, flyTo } = useMapContext();

  useEffect(() => {
    if (featureCollection) {
      layerSchemas.value = [
        {
          id: "dwg-integration-layer",
          name: "Integração DWG",
          type: "GeoJsonLayer" as any, // Cast to avoid strict enum issues
          origin: featureCollection as any,
          isActive: true,
          isVisible: true,
          getFillColorPropName: "type",
          getLineColorPropName: "type",
          colors: [
            { id: 1, color: [59, 130, 246, 80], value: "imovel", label: "Imóvel", layerSchemaId: "dwg-integration-layer", pattern: "full" },
            { id: 2, color: [245, 158, 11, 80], value: "bloco", label: "Blocos", layerSchemaId: "dwg-integration-layer", pattern: "full" },
            { id: 3, color: [16, 185, 129, 80], value: "calcada", label: "Calçadas", layerSchemaId: "dwg-integration-layer", pattern: "full" },
            { id: 4, color: [139, 92, 246, 80], value: "area_individual", label: "Áreas Individuais", layerSchemaId: "dwg-integration-layer", pattern: "full" },
            { id: 5, color: [239, 68, 68, 80], value: "acesso_veiculo", label: "Acessos", layerSchemaId: "dwg-integration-layer", pattern: "full" },
          ],
          layerGroup: { id: "dwg", name: "DWG" },
          properties: {},
          clickAction: { action: "NONE" as any, params: {} }
        }
      ];
      
      // Calculate a rough centroid to zoom in
      if (mainGeometry && mainGeometry.coordinates) {
        let lon = 0;
        let lat = 0;
        let count = 0;
        
        try {
          const extractCoords = (coordsArray: any[]) => {
            coordsArray.forEach(coord => {
              if (Array.isArray(coord) && typeof coord[0] === 'number') {
                lon += coord[0];
                lat += coord[1];
                count++;
              } else if (Array.isArray(coord)) {
                extractCoords(coord);
              }
            });
          };

          extractCoords(mainGeometry.coordinates);
          
          if (count > 0) {
            lon /= count;
            lat /= count;
            flyTo({
              center: [lon, lat],
              zoom: 16,
              pitch: 45,
              bearing: 0,
            });
          }
        } catch(e) {
          console.warn("Failed to calculate centroid", e);
        }
      }
    }
  }, [featureCollection, mainGeometry]);

  return (
    <MapView 
      hideControls={true} 
      hideLayerManager={true}
      hideBaseMapSelector={false}
    />
  );
};

export const MapPreview = (props: MapPreviewProps) => {
  return (
    <MapProvider>
      <SearchProvider>
        <NavigationProvider>
          <PolygonEditProvider>
            <MapPreviewInner {...props} />
          </PolygonEditProvider>
        </NavigationProvider>
      </SearchProvider>
    </MapProvider>
  );
};
