import { computed } from "@preact/signals";
import { PickingInfo } from "deck.gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo } from "react";
import { Map } from "react-map-gl/mapbox";
import { Button } from "@open-urbis/map-ui";
import { cn } from "@open-urbis/map-ui";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { LayerController } from "../LayerController";
import { DeckGLOverlay } from "./DeckGLOverlay";
import { addMapControls } from "./map-controls";
import { transformSchemaLayers } from "./map-layer-transform";
import { useTheme } from "../ThemeProvider";
import { MapCoordinates } from "./MapCoordinates";
import { getDigitalAddressLayers } from "./digital-address-layer";

export const MapView = () => {
  const accessToken =
    import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    "your-mapbox-access-token";

  const mapContext = useMapContext();
  const { theme } = useTheme();
  const { drawerOpen } = useNavigationContext();

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
    digitalAddressFeature
  } = mapContext;
  
  if (!overlayRef) {
    console.error("MapContext is not initialized (overlayRef is null)");
  }

  const polygonEdit = usePolygonEditContext();
  const { isEditing, loading, fetchData, feature } = polygonEdit;

  const clickActions = CLICK_ACTIONS_CONFIG();

  const layers = computed(() => {
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
          default: return "mapbox://styles/mapbox/light-v9";
      }
  }, [theme, selectedBaseMap.value]);

  useEffect(() => {
    populateMapContext();
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
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
                addMapControls((overlayRef.current as any)._map, polygonEdit);
              }}
            />
          </Map>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
          </div>
        )}
        <MapCoordinates />
      </div>
      {isEditing.value ? saveButton() : <LayerController />}
    </>
  );
};
