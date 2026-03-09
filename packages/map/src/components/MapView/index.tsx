import { computed } from "@preact/signals-react";
import { PickingInfo } from "deck.gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef } from "react";
import { Map } from "react-map-gl";
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
  onMapLoad,
  hideLayerManager,
  hideBaseMapSelector,
}: {
  previewLayers?: IGetConfigLayerSchema[];
  hideControls?: boolean;
  disablePadding?: boolean;
  onMapLoad?: () => void;
  hideLayerManager?: boolean;
  hideBaseMapSelector?: boolean;
}) => {
  const accessToken =
    import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    "your-mapbox-access-token";

  const mapContext = useMapContext();
  const { theme } = useTheme();
  const { drawerOpen, toggleDrawer, navigateTo } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const sidebarOpen = isDesktop && drawerOpen.value;

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
    isPickingLocation,
    onLocationPick,
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
      if (style === "standard" || !style) { // Fallback if selectedBaseMap.value is initially undefined/null
          const currentTheme = theme === "system" 
             ? (typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
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
    const handleResize = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (overlayRef?.current as any)?._map;
        map?.resize();
    };

    // Trigger immediate resize
    handleResize();

    // Trigger delayed resize for animations
    const timeout = setTimeout(handleResize, 350);

    // Also listen to visibility changes or focus if needed, but the main issue is likely container sizing
    // during route transitions or drawer toggles.

    return () => clearTimeout(timeout);
  }, [drawerOpen.value, hideControls, hideLayerManager, disablePadding]); // Add more dependencies that might affect layout

  const handleClick = (info: PickingInfo) => {
    if (isPickingLocation.value) {
        if (info.coordinate) {
            if (isDesktop && !drawerOpen.value) toggleDrawer();

            const lon = info.coordinate[0];
            const lat = info.coordinate[1];

            // If custom callback exists (e.g. filling inputs in LocationSelectionCard)
            if (onLocationPick.value) {
                onLocationPick.value(lat, lon);
                isPickingLocation.value = false;
                onLocationPick.value = null;
                return;
            }

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

  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const map = (overlayRef?.current as any)?._map;
    if (!mapContainerRef.current) return;

    const observer = new ResizeObserver(() => {
       const currentMap = (overlayRef?.current as any)?._map;
       if (currentMap) currentMap.resize();
    });
    observer.observe(mapContainerRef.current);
    
    return () => observer.disconnect();
  }, []);

  const saveButton = () => {
    return (
      <Button
        disabled={loading.value}
        className="absolute top-4 right-4 z-[1000] shadow-md"
        onClick={() => {
            fetchData(feature.value);
            // After saving, we should probably exit edit mode and show details,
            // but fetchData updates intersections which triggers the useEffect in MapPicker.
            // MapPicker then calls onChange, which updates value in MapTestPage.
            // MapTestPage sees intersections change and should open the result view (Ficha).
            // However, we might want to explicitly stop editing here or let the parent handle it.
            // The user requested: "esse botao na verdade deveria confirmar o perimetro e dai abrir a ficha tecnica"
            // The current flow (fetchData -> intersection update -> MapPicker onChange -> MapTestPage effect -> setShowResult)
            // seems to align with this, assuming fetchData returns the intersections which are part of the 'ficha'.
        }}
      >
        <span className={cn("material-symbols-outlined mr-2 text-base", loading.value && "animate-spin")}>
          {loading.value ? "progress_activity" : "check"}
        </span>
        Confirmar Perímetro
      </Button>
    );
  };

  return (
    <>
      <div 
        ref={mapContainerRef}
        className={cn("relative w-full h-full", disablePadding && "disable-map-padding")}
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        {viewport.value ? (
          <Map
            style={{ width: "100%", height: "100%" }}
            mapStyle={currentMapStyle}
            mapboxAccessToken={accessToken}
            initialViewState={viewport.value}
            padding={{ top: disablePadding ? 0 : 64, bottom: 0, left: (sidebarOpen && !disablePadding) ? 400 : 0, right: 0 }}
            onMouseMove={(evt: any) => {
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
                if (onMapLoad) onMapLoad();
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
      {!hideControls && (isEditing.value ? saveButton() : <LayerController hideManager={hideLayerManager} hideBaseMapSelector={hideBaseMapSelector} />)}
    </>
  );
};
