import { computed, useSignal } from "@preact/signals";
import { PickingInfo } from "deck.gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo } from "react";
import { Map } from "react-map-gl/mapbox";
import { Button } from "@open-urbis/map-ui";
import { cn } from "@open-urbis/map-ui";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { LayerController } from "../LayerController";
import { DeckGLOverlay } from "./DeckGLOverlay";
import { addMapControls } from "./map-controls";
import { transformSchemaLayers } from "./map-layer-transform";
import { useTheme } from "../ThemeProvider";
import { MapCoordinates } from "./MapCoordinates";
import { getDigitalAddressLayers } from "./digital-address-layer";
import { encode, getPolygon } from "@open-urbis/endereco-digital";
import { DigitalAddressDetails } from "../LocationSelectionCard/DigitalAddressDetails";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";
// @ts-ignore
import { OpenLocationCode } from "open-location-code";
import proj4 from "proj4";

proj4.defs("EPSG:31983", "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:4674", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");

const olc = new OpenLocationCode();

export const MapView = ({
  previewLayers,
  hideControls,
  disablePadding,
}: {
  previewLayers?: IGetConfigLayerSchema[];
  hideControls?: boolean;
  disablePadding?: boolean;
}) => {
  const accessToken =
    import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    "your-mapbox-access-token";

  const mapContext = useMapContext();
  const { theme } = useTheme();
  const { drawerOpen, navigateTo } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const sidebarOpen = isDesktop && drawerOpen.value;

  const isPickingLocation = useSignal(false);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
    return () => document.body.classList.remove("sidebar-open");
  }, [sidebarOpen]);

  const {
    layerSchemas,
    viewport,
    zoom,
    boundingBox,
    populateMapContext,
    handleViewportChange,
    selectedFeatures,
    is3DActive,
    overlayRef,
    selectedBaseMap,
    cursorPosition,
    digitalAddressFeature,
    flyTo: mapFlyTo
  } = mapContext;
  
  if (!overlayRef) {
    console.error("MapContext is not initialized (overlayRef is null)");
  }

  const polygonEdit = usePolygonEditContext();
  const { isEditing, loading, fetchData, feature } = polygonEdit;

  const clickActions = CLICK_ACTIONS_CONFIG();

  const layers = computed(() => {
    if (previewLayers) {
      return transformSchemaLayers(previewLayers, {
        zoom: zoom.value,
        boundingBox: boundingBox.value,
        selectedFeature: selectedFeatures.value,
        is3DActive: is3DActive.value,
      }).flat();
    }

    const baseLayers = transformSchemaLayers(layerSchemas.value, {
      zoom: zoom.value,
      boundingBox: boundingBox.value,
      selectedFeature: selectedFeatures.value,
      is3DActive: is3DActive.value,
    }).flat();

    const digitalLayers = getDigitalAddressLayers(digitalAddressFeature.value);

    return [...baseLayers, ...digitalLayers];
  });

  const currentMapStyle = useMemo(() => {
      const style = selectedBaseMap.value;
      if (style === "standard") {
          const currentTheme = theme === "system" 
             ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
             : theme;
          return currentTheme === "dark" 
              ? "mapbox://styles/mapbox/dark-v9"
              : "mapbox://styles/mapbox/light-v9";
      }
      
      switch (style) {
          case "light": return "mapbox://styles/mapbox/light-v9";
          case "dark": return "mapbox://styles/mapbox/dark-v9";
          case "outdoors": return "mapbox://styles/mapbox/outdoors-v9";
          case "satellite": return "mapbox://styles/mapbox/satellite-v9";
          case "satellite-streets": return "mapbox://styles/mapbox/satellite-streets-v9";
          case "maxar-satellite": {
            const baseUrl = (import.meta.env.VITE_API_URL || "/api");
            return {
              version: 8,
              sources: {
                "maxar-wms": {
                  type: "raster",
                  tiles: [
                    `${baseUrl}/maps/geoserver-proxy/maxar?service=WMS&request=GetMap&layers=Maxar:Imagery&styles=&format=image/jpeg&transparent=false&version=1.3.0&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}`
                  ],
                  tileSize: 256
                }
              },
              layers: [
                {
                  id: "maxar-wms",
                  type: "raster",
                  source: "maxar-wms",
                  paint: {}
                }
              ]
            } as mapboxgl.Style;
          }
          default: return "mapbox://styles/mapbox/light-v9";
      }
  }, [theme, selectedBaseMap.value]);

  useEffect(() => {
    populateMapContext({ disablePadding });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (overlayRef?.current as any)?._map;
      map?.resize();
    }, 350);
    return () => clearTimeout(timeout);
  }, [drawerOpen.value]);

  const handleClick = (info: PickingInfo) => {
    if (isPickingLocation.value) {
        if (info.coordinate) {
            const lon = info.coordinate[0];
            const lat = info.coordinate[1];

            // Calculate Digital Address
            const address = encode(lat, lon);
            const p = getPolygon(address);
            
            // Polygon Coords
            const lats = p.map(pt => pt.lat);
            const lons = p.map(pt => pt.lon);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);
            
            const polygonCoords = [[
                [minLon, minLat],
                [maxLon, minLat],
                [maxLon, maxLat],
                [minLon, maxLat],
                [minLon, minLat]
            ]];

            // Calculate Plus Code
            const calcPlusCode = olc.encode(lat, lon, 12); 

            // Construct FeatureCollection
            const featureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: polygonCoords
                        },
                        properties: { type: "polygon", sourceType: "digital" }
                    },
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [lon, lat]
                        },
                        properties: { type: "marker" }
                    }
                ]
            };

            // Hide all layers
            layerSchemas.value = layerSchemas.value.map(l => ({ ...l, isVisible: false }));

            // Set feature and navigate
            digitalAddressFeature.value = featureCollection;

            // Use flyTo from MapContext (aliased as mapFlyTo) if available, otherwise NavigationContext one
            if (mapFlyTo) {
                mapFlyTo({
                  center: [lon, lat],
                  zoom: 22,
                  pitch: 45,
                  bearing: 0,
                });
            }

            navigateTo(
                <DigitalAddressDetails 
                    latitude={lat} 
                    longitude={lon} 
                    plusCode={calcPlusCode} 
                    sourceType="latlon"
                />
            );

            isPickingLocation.value = false;
        }
        return;
    }

    const { clickAction, viewTemplate: template } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (info?.layer?.props as any) ?? {};
    if (!clickAction) return; // Silent return if no action, unless picking
    if (!info?.coordinate || !info.object || !info.object.id)
      return; 

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
        disabled={loading}
        className="absolute bottom-4 right-4 z-[1000]"
        onClick={() => fetchData(feature.value)}
      >
        <span className={cn("material-symbols-outlined mr-2 text-base", loading && "animate-spin")}>
          {loading ? "progress_activity" : "save"}
        </span>
        Salvar / Atualizar
      </Button>
    );
  };

  return (
    <>
      <div 
        className={cn("relative w-full h-full", disablePadding && "disable-map-padding")}
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        {viewport.value ? (
          <Map
            style={{ width: "100%", height: "100%" }}
            mapStyle={currentMapStyle}
            mapboxAccessToken={accessToken}
            initialViewState={viewport.value}
            onMouseMove={(evt) => {
              cursorPosition.value = {
                latitude: evt.lngLat.lat,
                longitude: evt.lngLat.lng,
              };
            }}
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
                addMapControls(
                  (overlayRef.current as any)._map,
                  polygonEdit,
                  () => {
                    isPickingLocation.value = !isPickingLocation.value;
                  },
                  hideControls,
                  drawerOpen.value
                );
              }}
              style={{ cursor: isPickingLocation.value ? 'crosshair' : 'default' }}
            />
          </Map>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
          </div>
        )}
        {!hideControls && <MapCoordinates />}
      </div>
      {!hideControls && (isEditing.value ? saveButton() : <LayerController />)}
    </>
  );
};
