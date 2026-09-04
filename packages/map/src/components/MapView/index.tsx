import { computed } from "@preact/signals";
import { PickingInfo } from "deck.gl";
import { GeoJsonLayer } from "@deck.gl/layers";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useContext, useRef, useState, useCallback } from "react";
import { Map } from "react-map-gl/maplibre";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@open-urbis/map-ui";
import { ClickActionEnum } from "@open-urbis/map-shared";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { useAuth } from "@open-urbis/map-auth";
import { LayerController } from "../LayerController";
import { DeckGLOverlay } from "./DeckGLOverlay";
import { addMapControls } from "./map-controls";
import { transformSchemaLayers } from "./map-layer-transform";
import { useTheme } from "../ThemeProvider";

import { getDigitalAddressLayers } from "./digital-address-layer";
import { DigitalAddressDetails } from "../LocationSelectionCard/DigitalAddressDetails";
import { PolygonDetails } from "../PolygonDetails";

import {
  IGetConfigLayerSchema,
  IGetConfigLayerSchemaTypeEnum,
} from "../../types/fetch-map-config-type";
import { getProspectiveSearchLayers } from "./prospective-layers";
import { ProspectiveSearchContext } from "../ProspectiveSearch/ProspectiveSearchContext";
// @ts-expect-error OpenLocationCode declaration
import { OpenLocationCode } from "open-location-code";
import proj4 from "proj4";
import { getMapStyle, getSingleMapStyle } from "./base-map-styles";
import { Copy, Info, Loader2, Search, SquarePen, X, Layers, Trash2 } from "lucide-react";
import { encode, getPolygon } from "@open-urbis/endereco-digital";
import { enabledFeatureFlags } from "../../features/feature-flags";
import { useToast } from "../../hooks/useToast";
import { formatMapHash, updateMapUrlHash } from "../../utils/map-hash";

proj4.defs(
  "EPSG:31983",
  "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);
proj4.defs(
  "EPSG:4674",
  "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs",
);

const olc = new OpenLocationCode();
const MOBILE_LONG_PRESS_MS = 550;
const MAX_POLYGON_ANALYSIS_AREA_KM2 = 25;
const EARTH_RADIUS_METERS = 6378137;

const ringAreaSquareMeters = (ring: number[][]) => {
  if (!Array.isArray(ring) || ring.length < 4) return 0;

  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [lon1, lat1] = ring[index];
    const [lon2, lat2] = ring[index + 1];

    if (
      typeof lon1 !== "number" ||
      typeof lat1 !== "number" ||
      typeof lon2 !== "number" ||
      typeof lat2 !== "number"
    ) {
      continue;
    }

    area +=
      (((lon2 - lon1) * Math.PI) / 180) *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }

  return Math.abs((area * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2);
};

const polygonCoordinatesAreaSquareMeters = (coordinates: number[][][]) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return 0;

  const [outerRing, ...holes] = coordinates;
  const holesArea = holes.reduce(
    (total, hole) => total + ringAreaSquareMeters(hole),
    0,
  );

  return Math.max(ringAreaSquareMeters(outerRing) - holesArea, 0);
};

const featureAreaSquareMeters = (geojsonFeature: any): number => {
  const geometry = geojsonFeature?.geometry ?? geojsonFeature;

  if (geometry?.type === "Polygon") {
    return polygonCoordinatesAreaSquareMeters(geometry.coordinates);
  }

  if (geometry?.type === "MultiPolygon") {
    return geometry.coordinates.reduce(
      (total: number, polygon: number[][][]) =>
        total + polygonCoordinatesAreaSquareMeters(polygon),
      0,
    );
  }

  return 0;
};

const getDigitalAddressPolygonCoords = (address: string) => {
  const polygon = getPolygon(address);
  const lats = polygon.map((point) => point.lat);
  const lons = polygon.map((point) => point.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  return {
    centerLat: (minLat + maxLat) / 2,
    centerLon: (minLon + maxLon) / 2,
    polygonCoords: [
      [
        [minLon, minLat],
        [maxLon, minLat],
        [maxLon, maxLat],
        [minLon, maxLat],
        [minLon, minLat],
      ],
    ],
  };
};

type MapContextMenuState = {
  x: number;
  y: number;
  latitude: number;
  longitude: number;
};

type MapCamera = {
  center: { lng: number; lat: number };
  zoom: number;
  bearing: number;
  pitch: number;
};

type ShiftDragMenuState = {
  x: number;
  y: number;
  before: MapCamera;
  after: MapCamera;
  bounds?: [[number, number], [number, number]];
};

type MapClickEventLike = {
  point: { x: number; y: number };
  lngLat: { lat: number; lng: number };
};

const InfoTooltip = ({ children }: { children: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-border dark:hover:text-foreground"
        onClick={(event) => event.stopPropagation()}
      >
        <Info className="h-3 w-3" aria-hidden="true" />
      </span>
    </TooltipTrigger>
    <TooltipContent
      side="right"
      className="max-w-64 border-border bg-popover text-popover-foreground shadow-lg dark:bg-card dark:text-card-foreground"
    >
      {children}
    </TooltipContent>
  </Tooltip>
);

const localizeMapLabels = (map: any) => {
  try {
    const styleLayers = map.getStyle()?.layers || [];
    styleLayers.forEach((layer: any) => {
      if (layer.type === "symbol" && layer.layout) {
        if (layer.layout["text-field"]) {
          const tfStr = JSON.stringify(layer.layout["text-field"]);
          if (tfStr.includes("name_en") || tfStr.includes("name:latin")) {
            map.setLayoutProperty(layer.id, "text-field", [
              "coalesce",
              ["get", "name:pt"],
              ["get", "name_pt"],
              ["get", "name"],
              ["get", "name_en"],
            ]);
          }
        }

        if (layer.layout["text-font"] && Array.isArray(layer.layout["text-font"])) {
          const updatedFonts = layer.layout["text-font"].map((font: string) =>
            font.replace("Italic", "Regular"),
          );
          if (JSON.stringify(updatedFonts) !== JSON.stringify(layer.layout["text-font"])) {
            map.setLayoutProperty(layer.id, "text-font", updatedFonts);
          }
        }
      }
    });
  } catch (_err) {
    // Style might still be loading
  }
};

export const MapView = ({
  previewLayers,
  hideControls,
  disablePadding,
  minimalPreview,
  onMapLoad,
  hideLayerManager,
  hideBaseMapSelector,
}: {
  previewLayers?: IGetConfigLayerSchema[];
  hideControls?: boolean;
  disablePadding?: boolean;
  minimalPreview?: boolean;
  onMapLoad?: () => void;
  hideLayerManager?: boolean;
  hideBaseMapSelector?: boolean;
}) => {
  const mapContext = useMapContext();
  const auth = useAuth();
  const token = auth?.user?.access_token;

  // Retrieve organization ID from localStorage (with same key used by Angular app)
  const orgByLocalStorage = typeof window !== "undefined" ? localStorage.getItem("organization-seleted") : null;
  let organizationId: string | undefined = undefined;
  if (orgByLocalStorage && orgByLocalStorage !== "undefined") {
    try {
      const org = JSON.parse(orgByLocalStorage);
      organizationId =
        typeof org === "string" ? org : org?.id || org?.organizationId;
    } catch {
      organizationId = orgByLocalStorage;
    }
  }
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const {
    drawerOpen,
    toggleDrawer,
    navigateTo,
    isProspectiveSearchActive,
  } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const sidebarOpen = isDesktop && drawerOpen.value;
  const [contextMenu, setContextMenu] = useState<MapContextMenuState | null>(
    null,
  );
  const [shiftDragMenu, setShiftDragMenu] = useState<ShiftDragMenuState | null>(
    null,
  );
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const shiftDragMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileLongPressTimeoutRef = useRef<number | null>(null);
  const isRulerActiveRef = useRef(false);
  const boxZoomStartCameraRef = useRef<ShiftDragMenuState["before"] | null>(
    null,
  );
  const shiftDragStartRef = useRef<{
    x: number;
    y: number;
    before: ShiftDragMenuState["before"];
  } | null>(null);
  const lastMapPointRef = useRef<{ x: number; y: number } | null>(null);
  const features = enabledFeatureFlags.value;
  const { toastWarning, toastSuccess } = useToast();

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
    layerGroups,
    viewport,
    zoom,
    boundingBox,
    populateMapContext,
    handleViewportChange,
    selectedFeatures,
    is3DActive,
    overlayRef,
    selectedBaseMap,
    selectedBaseMaps,
    baseMapOpacity,
    baseMapOpacities,
    baseMapSaturation,
    baseMap3DOpacity,
    cursorPosition,
    digitalAddressFeature,
    activeHighlightFeature,
    isPickingLocation,
    onLocationPick,
    flyTo: mapFlyTo,
  } = mapContext;

  if (!overlayRef) {
    console.error("MapContext is not initialized (overlayRef is null)");
  }

  const polygonEdit = usePolygonEditContext();
  const { isEditing, loading, fetchData, feature } = polygonEdit;
  const prospectiveContext = useContext(ProspectiveSearchContext);

  const clickActions = CLICK_ACTIONS_CONFIG();

  const layers = computed(() => {
    if (previewLayers) {
      return transformSchemaLayers(previewLayers, {
        zoom: zoom.value,
        boundingBox: boundingBox.value,
        selectedFeature: selectedFeatures.value,
        is3DActive: is3DActive.value,
        token: token,
        organizationId: organizationId,
      }).flat();
    }

    const shouldRenderProspectiveLayers =
      features.prospectiveSearch && isProspectiveSearchActive.value;
    const shouldRenderConfiguredLayers =
      features.mapFeatures && !isProspectiveSearchActive.value;

    const prospectiveLayers = shouldRenderProspectiveLayers
      ? (getProspectiveSearchLayers(
          prospectiveContext?.matchingZones || [],
          prospectiveContext?.regrasZonamento || null,
          prospectiveContext &&
            Object.keys(prospectiveContext.urbanParams || {}).length > 0,
          prospectiveContext?.areaImovel || null,
          isDark,
          prospectiveContext?.compatiblePqas || [],
          prospectiveContext &&
            Object.keys(prospectiveContext.pqaParams || {}).length > 0,
        ) as unknown as IGetConfigLayerSchema[])
      : [];

    const configuredLayers = shouldRenderConfiguredLayers
      ? layerSchemas.value
      : [];

    const baseLayers = transformSchemaLayers(
      shouldRenderProspectiveLayers ? prospectiveLayers : configuredLayers,
      {
        zoom: zoom.value,
        boundingBox: boundingBox.value,
        selectedFeature: selectedFeatures.value,
        is3DActive: is3DActive.value,
        token: token,
        organizationId: organizationId,
      },
    ).flat();

    const digitalLayers = features.digitalAddress
      ? getDigitalAddressLayers(digitalAddressFeature.value)
      : [];

    const rawHighlight =
      activeHighlightFeature.value ||
      selectedFeatures.value?.[0]?.feature ||
      null;

    const highlightTarget = rawHighlight?.geometry ? rawHighlight : null;

    const selectionHighlightLayers = highlightTarget?.geometry
      ? [
          new GeoJsonLayer({
            id: "active-selection-highlight-layer",
            data: highlightTarget,
            stroked: true,
            filled: true,
            getFillColor: [239, 68, 68, 35],
            getLineColor: [239, 68, 68, 255],
            getLineWidth: 3.5,
            lineWidthUnits: "pixels",
            getLineDashArray: [6, 4],
            dashJustified: true,
            pointType: "circle",
            getPointRadius: 8,
            pickable: false,
          }),
        ]
      : [];

    return [...baseLayers, ...digitalLayers, ...selectionHighlightLayers];
  });

  const mapInstanceRef = useRef<any>(null);

  const currentMapStyle = useMemo(
    () =>
      getMapStyle(
        selectedBaseMap.value,
        theme,
        import.meta.env.VITE_API_URL || "/api",
        baseMapOpacity?.value ?? 100,
        baseMapSaturation?.value ?? 100,
        selectedBaseMaps?.value,
        baseMapOpacities?.value,
      ),
    [
      theme,
      selectedBaseMap.value,
      selectedBaseMaps?.value,
    ],
  );

  // Smooth camera pitch transition & 3D Building management when 3D mode is toggled
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || minimalPreview) return;

    const setup3D = () => {
      // Localize map labels to Portuguese (with accents) and clean typography
      localizeMapLabels(map);

      // Ensure openmaptiles vector source exists on the map (for Ortofoto, Satélite, etc.)
      if (!map.getSource("openmaptiles")) {
        try {
          map.addSource("openmaptiles", {
            type: "vector",
            tiles: ["https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf"],
            maxzoom: 14,
          });
        } catch {
          // Source may already exist
        }
      }

      // Add 3D buildings extrusion layer if not present
      if (
        map.getSource("openmaptiles") &&
        !map.getLayer("openfreemap-3d-buildings") &&
        !map.getLayer("building-3d")
      ) {
        try {
          map.addLayer({
            id: "openfreemap-3d-buildings",
            type: "fill-extrusion",
            source: "openmaptiles",
            "source-layer": "building",
            minzoom: 13,
            layout: {
              visibility: is3DActive.value ? "visible" : "none",
            },
            paint: {
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "render_height"], ["get", "height"], 10],
                0,
                "#64748b",
                30,
                "#475569",
                80,
                "#334155",
                150,
                "#1e293b",
              ],
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                13,
                0,
                13.5,
                ["coalesce", ["get", "render_height"], ["get", "height"], 10],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                13,
                0,
                13.5,
                ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
              ],
              "fill-extrusion-opacity": 0.48,
              "fill-extrusion-vertical-gradient": true,
            },
          });
        } catch {
          // Ignore if layer cannot be added
        }
      }

      const is3D = is3DActive.value;
      const visibility = is3D ? "visible" : "none";
      const b3dOpacity = is3D ? 0.48 : 0;

      const flatBuildingLayerIds = [
        "building",
        "building_outline",
        "building-underground",
        "building-top",
      ];
      flatBuildingLayerIds.forEach((id) => {
        if (map.getLayer(id)) {
          try {
            map.setLayoutProperty(id, "visibility", is3D ? "none" : "visible");
          } catch {
            // Ignore
          }
        }
      });

      const extrusionColor = [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "render_height"], ["get", "height"], 10],
        0,
        "#64748b",
        30,
        "#475569",
        80,
        "#334155",
        150,
        "#1e293b",
      ];

      if (map.getLayer("openfreemap-3d-buildings")) {
        try {
          map.setLayoutProperty("openfreemap-3d-buildings", "visibility", visibility);
          map.setPaintProperty("openfreemap-3d-buildings", "fill-extrusion-opacity", b3dOpacity);
          map.setPaintProperty("openfreemap-3d-buildings", "fill-extrusion-color", extrusionColor);
          map.setPaintProperty("openfreemap-3d-buildings", "fill-extrusion-vertical-gradient", false);
        } catch {
          // Ignore
        }
      }
      if (map.getLayer("building-3d")) {
        try {
          map.setLayoutProperty("building-3d", "visibility", visibility);
          map.setPaintProperty("building-3d", "fill-extrusion-opacity", b3dOpacity);
          map.setPaintProperty("building-3d", "fill-extrusion-color", extrusionColor);
          map.setPaintProperty("building-3d", "fill-extrusion-vertical-gradient", false);
        } catch {
          // Ignore
        }
      }

      if (is3DActive.value) {
        if (map.getPitch() < 30) {
          map.easeTo({ pitch: 55, duration: 800 });
        }
      } else {
        if (map.getPitch() > 50) {
          map.easeTo({ pitch: 0, duration: 600 });
        }
      }
    };

    if (map.isStyleLoaded()) {
      setup3D();
    } else {
      map.once("style.load", setup3D);
    }
  }, [is3DActive.value, currentMapStyle, minimalPreview]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const activeMaps = selectedBaseMaps?.value ?? [selectedBaseMap.value];
    const globalOpacity = baseMapOpacity?.value ?? 100;
    const saturation = baseMapSaturation?.value ?? 100;
    const opacitiesMap = baseMapOpacities?.value ?? {};
    const normSat = Math.max(-1, Math.min(1, saturation / 100 - 1));

    const applyPaintUpdates = () => {
      try {
        const isBaseVector =
          activeMaps[0] === "openfreemap-liberty" ||
          activeMaps[0] === "openfreemap-positron" ||
          activeMaps[0] === "openfreemap-bright";

        // When base map is vector and additional raster maps are active, inject overlay sources and layers
        if (isBaseVector && activeMaps.length > 1) {
          activeMaps.slice(1).forEach((styleId, idx) => {
            const index = idx + 1;
            const prefix = `bm_${index}_`;
            const singleSpec = getSingleMapStyle(
              styleId,
              theme,
              (import.meta as any).env?.VITE_API_URL || "/api",
            ) as any;

            if (
              typeof singleSpec === "object" &&
              singleSpec.sources &&
              singleSpec.layers
            ) {
              Object.entries(singleSpec.sources).forEach(([srcKey, srcVal]) => {
                const sourceId = `${prefix}${srcKey}`;
                if (!map.getSource(sourceId)) {
                  try {
                    map.addSource(sourceId, srcVal as any);
                  } catch {
                    // Ignore
                  }
                }
              });

              singleSpec.layers.forEach((l: any) => {
                if (l.type === "background") return;

                const layerId = `${prefix}${l.id}`;
                if (!map.getLayer(layerId)) {
                  const opacityVal = opacitiesMap[styleId] ?? 100;
                  const normOpacity = Math.max(0, Math.min(1, opacityVal / 100));

                  const beforeLayerId = map.getLayer("openfreemap-3d-buildings")
                    ? "openfreemap-3d-buildings"
                    : map.getLayer("building-3d")
                    ? "building-3d"
                    : map.getLayer("place_city")
                    ? "place_city"
                    : undefined;

                  try {
                    map.addLayer(
                      {
                        ...l,
                        id: layerId,
                        source: `${prefix}${l.source}`,
                        paint: {
                          ...l.paint,
                          "raster-opacity": normOpacity,
                          "raster-saturation": normSat,
                        },
                      },
                      beforeLayerId,
                    );
                  } catch {
                    // Ignore
                  }
                }
              });
            }
          });
        }

        const styleLayers = map.getStyle()?.layers || [];

        // Remove obsolete overlay layers that are no longer active
        styleLayers.forEach((layer: any) => {
          if (layer.id && layer.id.startsWith("bm_")) {
            const match = layer.id.match(/^bm_(\d+)_/);
            if (match) {
              const layerIdx = Number(match[1]);
              if (
                layerIdx >= activeMaps.length ||
                (isBaseVector && layerIdx === 0)
              ) {
                try {
                  map.removeLayer(layer.id);
                } catch {
                  // Ignore
                }
              }
            }
          }
        });

        styleLayers.forEach((layer: any) => {
          if (
            !layer.id ||
            layer.id.startsWith("deck-") ||
            layer.id === "building-3d" ||
            layer.id === "openfreemap-3d-buildings"
          ) {
            return;
          }

          if (activeMaps.length > 1) {
            activeMaps.forEach((styleId, index) => {
              const prefix = `bm_${index}_`;
              if (layer.id.startsWith(prefix)) {
                const opacityVal = opacitiesMap[styleId] ?? 100;
                const normOpacity = Math.max(0, Math.min(1, opacityVal / 100));

                if (layer.type === "raster") {
                  map.setPaintProperty(layer.id, "raster-opacity", normOpacity);
                  map.setPaintProperty(layer.id, "raster-saturation", normSat);
                } else if (layer.type === "background") {
                  map.setPaintProperty(layer.id, "background-opacity", normOpacity);
                } else if (layer.type === "fill") {
                  map.setPaintProperty(layer.id, "fill-opacity", normOpacity);
                } else if (layer.type === "line") {
                  map.setPaintProperty(layer.id, "line-opacity", normOpacity);
                } else if (layer.type === "fill-extrusion") {
                  map.setPaintProperty(
                    layer.id,
                    "fill-extrusion-opacity",
                    normOpacity * 0.45,
                  );
                }
              }
            });
          } else {
            const singleStyleId = activeMaps[0];
            const opacityVal = opacitiesMap[singleStyleId] ?? globalOpacity;
            const normOpacity = Math.max(0, Math.min(1, opacityVal / 100));

            if (layer.id.startsWith("bm_0_") || !layer.id.startsWith("bm_")) {
              if (layer.type === "raster") {
                map.setPaintProperty(layer.id, "raster-opacity", normOpacity);
                map.setPaintProperty(layer.id, "raster-saturation", normSat);
              } else if (layer.type === "background") {
                map.setPaintProperty(layer.id, "background-opacity", normOpacity);
              }
            }
          }
        });

        // Keep 3D building layers linked with baseMap3DOpacity control
        const b3dOpacity = (baseMap3DOpacity?.value ?? 45) / 100;
        const is3D = is3DActive.value && b3dOpacity > 0;
        const visibility = is3D ? "visible" : "none";

        localizeMapLabels(map);

        const flatBuildingLayerIds = [
          "building",
          "building_outline",
          "building-underground",
          "building-top",
        ];
        flatBuildingLayerIds.forEach((id) => {
          if (map.getLayer(id)) {
            try {
              map.setLayoutProperty(id, "visibility", is3D ? "none" : "visible");
            } catch {
              // Ignore
            }
          }
        });

        const extrusionColor = [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "render_height"], ["get", "height"], 10],
          0,
          "#64748b",
          30,
          "#475569",
          80,
          "#334155",
          150,
          "#1e293b",
        ];

        if (map.getLayer("building-3d")) {
          map.setLayoutProperty("building-3d", "visibility", visibility);
          map.setPaintProperty("building-3d", "fill-extrusion-opacity", b3dOpacity);
          map.setPaintProperty("building-3d", "fill-extrusion-color", extrusionColor);
          map.setPaintProperty("building-3d", "fill-extrusion-vertical-gradient", true);
        }
        if (map.getLayer("openfreemap-3d-buildings")) {
          map.setLayoutProperty("openfreemap-3d-buildings", "visibility", visibility);
          map.setPaintProperty("openfreemap-3d-buildings", "fill-extrusion-opacity", b3dOpacity);
          map.setPaintProperty("openfreemap-3d-buildings", "fill-extrusion-color", extrusionColor);
          map.setPaintProperty("openfreemap-3d-buildings", "fill-extrusion-vertical-gradient", true);
        }
      } catch (_err) {
        // Style might be loading
      }
    };

    if (map.isStyleLoaded()) {
      applyPaintUpdates();
    } else {
      map.once("styledata", applyPaintUpdates);
    }
  }, [
    baseMapOpacities?.value,
    baseMapOpacity?.value,
    baseMapSaturation?.value,
    baseMap3DOpacity?.value,
    selectedBaseMap.value,
    selectedBaseMaps?.value,
    is3DActive.value,
  ]);

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

  useEffect(() => {
    if (!contextMenu && !shiftDragMenu) return;

    const closeMenusOnOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (contextMenuRef.current?.contains(target)) return;
      if (shiftDragMenuRef.current?.contains(target)) return;

      setContextMenu(null);
      setShiftDragMenu(null);
    };

    const closeMenusOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setContextMenu(null);
      setShiftDragMenu(null);
    };

    document.addEventListener(
      "pointerdown",
      closeMenusOnOutsidePointerDown,
      true,
    );
    document.addEventListener("keydown", closeMenusOnEscape);

    return () => {
      document.removeEventListener(
        "pointerdown",
        closeMenusOnOutsidePointerDown,
        true,
      );
      document.removeEventListener("keydown", closeMenusOnEscape);
    };
  }, [contextMenu, shiftDragMenu]);

  const handleCancelDrawing = useCallback(() => {
    polygonEdit.drawRef.current?.deleteAll();
    polygonEdit.reset();
  }, [polygonEdit]);

  const handleDeletePoint = useCallback(() => {
    const draw = polygonEdit.drawRef.current;
    if (!draw) return;

    const mode = draw.getMode();
    const all = draw.getAll().features;

    if (mode === "direct_select" || mode === "draw_polygon") {
      draw.trash();
    } else if (all.length > 0) {
      const feat = all[0];
      const coords = (feat.geometry as any)?.coordinates?.[0];
      if (coords && coords.length > 4) {
        try {
          (draw as any).changeMode("direct_select", { featureId: feat.id });
          draw.trash();
        } catch {
          draw.trash();
        }
      } else {
        draw.deleteAll();
        polygonEdit.setFeature(null);
        try {
          (draw as any).changeMode("draw_polygon");
        } catch {
          // ignore
        }
        return;
      }
    } else {
      draw.trash();
    }

    const updatedAll = draw.getAll().features;
    if (updatedAll.length > 0) {
      polygonEdit.setFeature(updatedAll[0]);
    } else {
      polygonEdit.setFeature(null);
      try {
        (draw as any).changeMode("draw_polygon");
      } catch {
        // ignore
      }
    }
  }, [polygonEdit]);

  useEffect(() => {
    if (!isEditing.value) return;

    const handleDrawingKeyDown = (event: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInput) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        handleCancelDrawing();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        event.stopPropagation();
        handleDeletePoint();
      }
    };

    window.addEventListener("keydown", handleDrawingKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleDrawingKeyDown, true);
    };
  }, [isEditing.value, handleDeletePoint, handleCancelDrawing]);

  const clearMobileLongPress = () => {
    if (!mobileLongPressTimeoutRef.current) return;

    window.clearTimeout(mobileLongPressTimeoutRef.current);
    mobileLongPressTimeoutRef.current = null;
  };

  const openContextMenuAt = ({
    x,
    y,
    latitude,
    longitude,
  }: MapContextMenuState) => {
    cursorPosition.value = { latitude, longitude };
    setContextMenu({ x, y, latitude, longitude });
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  const createSquareFeature = (lat: number, lon: number) => {
    const sideMeters = 50;
    const halfMeters = sideMeters / 2;
    const deltaLat = halfMeters / 111320;
    const deltaLon =
      halfMeters / (111320 * Math.cos((lat * Math.PI) / 180));

    const minLat = lat - deltaLat;
    const maxLat = lat + deltaLat;
    const minLon = lon - deltaLon;
    const maxLon = lon + deltaLon;

    return {
      type: "Feature" as const,
      id: `square-${Date.now()}`,
      properties: {},
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [minLon, minLat],
            [maxLon, minLat],
            [maxLon, maxLat],
            [minLon, maxLat],
            [minLon, minLat],
          ],
        ],
      },
    };
  };

  const handleDrawAnalyzeHere = (lat: number, lon: number) => {
    const squareFeature = createSquareFeature(lat, lon);

    setContextMenu(null);

    polygonEdit.editFeature(squareFeature);

    if (!drawerOpen.value) {
      toggleDrawer();
    }

    navigateTo(
      <PolygonDetails
        template={polygonEdit.editFeatureTemplate.value ?? []}
        rootTemplate={polygonEdit.editFeatureTemplate.value ?? []}
      />,
    );

    polygonEdit.fetchData(squareFeature);
  };

  const getMapCamera = (map: any): ShiftDragMenuState["before"] => {
    const center = map.getCenter();

    return {
      center: { lng: center.lng, lat: center.lat },
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    };
  };

  const applyShiftDragZoom = (menu: ShiftDragMenuState) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (overlayRef?.current as any)?._map;
    if (!map) return;

    if (menu.bounds) {
      map.fitBounds(menu.bounds, { padding: 40, duration: 250 });
      return;
    }

    map.jumpTo({
      center: [menu.after.center.lng, menu.after.center.lat],
      zoom: menu.after.zoom,
      bearing: menu.after.bearing,
      pitch: menu.after.pitch,
    });
  };

  const getProjectedCoordinates = (latitude: number, longitude: number) => {
    try {
      const [easting, northing] = proj4("EPSG:4326", "EPSG:31983", [
        longitude,
        latitude,
      ]);

      return { easting, northing };
    } catch (error) {
      console.error("Projection error", error);
      return null;
    }
  };

  const openDigitalAddressAt = (latitude: number, longitude: number) => {
    if (!features.digitalAddress) return;

    if (isDesktop && !drawerOpen.value) toggleDrawer();

    const digitalAddress = encode(latitude, longitude);
    const { centerLat, centerLon, polygonCoords } =
      getDigitalAddressPolygonCoords(digitalAddress);
    const calcPlusCode = olc.encode(latitude, longitude, 12);

    // Construct FeatureCollection
    const featureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: polygonCoords,
          },
          properties: { type: "polygon", sourceType: "digital" },
        },
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          properties: { type: "marker" },
        },
      ],
    };

    // Hide all layers
    layerSchemas.value = layerSchemas.value.map((layer) => ({
      ...layer,
      isVisible: false,
    }));

    // Set feature and navigate
    digitalAddressFeature.value = featureCollection;

    // Use flyTo from MapContext (aliased as mapFlyTo) if available.
    if (mapFlyTo) {
      mapFlyTo({
        center: [centerLon, centerLat],
        zoom: 22,
        pitch: 45,
        bearing: 0,
      });
    }

    navigateTo(
      <DigitalAddressDetails
        key={`digital-address-${digitalAddress}-${latitude}-${longitude}`}
        latitude={centerLat}
        longitude={centerLon}
        plusCode={calcPlusCode}
        sourceType="digital"
        digitalAddress={digitalAddress}
        discoveryPoint={{ latitude, longitude }}
      />,
    );

    isPickingLocation.value = false;
  };

  const handleClick = (info: PickingInfo) => {
    setContextMenu(null);

    if (isRulerActiveRef.current) return;

    if (isPickingLocation.value) {
      if (info.coordinate) {
        const lon = info.coordinate[0];
        const lat = info.coordinate[1];

        // If custom callback exists (e.g. filling inputs in LocationSelectionCard)
        if (onLocationPick.value) {
          onLocationPick.value(lat, lon);
          isPickingLocation.value = false;
          onLocationPick.value = null;
          return;
        }

        openDigitalAddressAt(lat, lon);
      }
      return;
    }

    const { clickAction, viewTemplate: template } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (info?.layer?.props as any) ?? {};
    if (!clickAction) return; // Silent return if no action, unless picking
    if (
      !info?.coordinate ||
      !info.object ||
      (!info.object.id && !info.object.properties?.id)
    )
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

  const createLayerFromDrawing = () => {
    if (!feature.value) return;

    const layerId = `drawing-${Date.now()}`;
    const drawingFeature = {
      ...feature.value,
      properties: {
        ...(feature.value.properties ?? {}),
        source: "drawing-tool",
      },
    };

    const newLayer: IGetConfigLayerSchema = {
      id: layerId,
      name: `Desenho ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      origin: "local",
      isActive: true,
      isSelected: true,
      type: IGetConfigLayerSchemaTypeEnum.GeoJsonLayer,
      isVisible: true,
      groupId: "drawings",
      layerGroup: {
        id: "drawings",
        name: "Desenhos",
      },
      colors: [
        {
          id: Date.now(),
          type: "fill",
          color: [245, 158, 11, 140],
          label: "Desenho",
          value: "default",
          layerSchemaId: layerId,
          pattern: "full",
        },
      ],
      clickAction: { action: ClickActionEnum.SelectFeature as any, params: {} },
      properties: {
        metadata: {
          description: "Camada criada a partir da ferramenta de desenho",
        },
        data: {
          type: "FeatureCollection",
          features: [drawingFeature],
        },
      },
    };

    const currentGroups = layerGroups?.value || [];
    if (!currentGroups.some((g) => g.id === "drawings")) {
      layerGroups.value = [
        ...currentGroups,
        {
          id: "drawings",
          name: "Desenhos",
          ownerGroup: "local",
          childGroups: [],
        },
      ];
    }

    layerSchemas.value = [...layerSchemas.value, newLayer];
    polygonEdit.drawRef.current?.deleteAll();
    polygonEdit.reset();
    toastSuccess("Camada criada e adicionada ao mapa com sucesso!");
  };

  const handleMapClickFallback = (evt: MapClickEventLike) => {
    if (isRulerActiveRef.current) return;
    if (isDesktop) return;

    if (isPickingLocation.value) {
      handleClick({
        coordinate: [evt.lngLat.lng, evt.lngLat.lat],
      } as PickingInfo);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deck = (overlayRef?.current as any)?._deck;
    if (!deck) return;

    const pickedInfo = deck.pickObject({
      x: evt.point.x,
      y: evt.point.y,
      radius: 24,
    }) as PickingInfo | null;

    if (!pickedInfo?.layer || !pickedInfo.object) return;

    handleClick({
      ...pickedInfo,
      coordinate: pickedInfo.coordinate ?? [evt.lngLat.lng, evt.lngLat.lat],
    } as PickingInfo);
  };

  const saveButton = () => {
    const minimumAnalysisZoom = 13;
    const analysisBlockedByZoom = zoom.value < minimumAnalysisZoom;
    const currentFeature =
      feature.value ||
      polygonEdit.drawRef.current?.getAll()?.features?.[0] ||
      null;
    const hasDrawnFeature = Boolean(currentFeature);
    const analysisDisabled = loading.value || !hasDrawnFeature;

    return (
      <div className="urbis-draw-layer absolute bottom-24 right-4 z-[999999] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
        <Button
          variant="outline"
          size="sm"
          title="Cancelar desenho e voltar ao modo normal"
          className="rounded-full shadow-lg h-10 px-3 bg-background/95 backdrop-blur border text-xs gap-1.5"
          onClick={handleCancelDrawing}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <X className="h-4 w-4 text-muted-foreground" />
          <span>Cancelar</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          title="Excluir ponto selecionado ou desfazer último ponto (Delete / Backspace)"
          className="rounded-full shadow-lg h-10 px-3.5 bg-background/95 backdrop-blur border text-xs gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          onClick={handleDeletePoint}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          <span>Excluir ponto</span>
        </Button>

        <Button
          disabled={analysisDisabled}
          variant="secondary"
          size="sm"
          title="Criar camada a partir do desenho"
          className="rounded-full shadow-lg h-10 px-4 text-xs font-semibold gap-1.5 disabled:opacity-50"
          onClick={() => {
            if (analysisDisabled || !currentFeature) return;
            if (!feature.value && currentFeature) {
              polygonEdit.setFeature(currentFeature);
            }
            createLayerFromDrawing();
          }}
        >
          <Layers className="h-4 w-4 text-primary" />
          <span>Criar camada</span>
        </Button>

        <Button
          disabled={analysisDisabled}
          size="sm"
          title={
            analysisBlockedByZoom
              ? `Aproxime o mapa para analisar. Disponível a partir do zoom ${minimumAnalysisZoom}.`
              : "Analisar área"
          }
          className="rounded-full shadow-lg h-10 px-4 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
          onClick={() => {
            if (analysisDisabled || !currentFeature) return;

            if (analysisBlockedByZoom) {
              toastWarning(
                `Aproxime o mapa para analisar esta área. A análise fica disponível a partir do zoom ${minimumAnalysisZoom}.`,
                5000,
              );
              return;
            }

            const areaSquareMeters = featureAreaSquareMeters(currentFeature);
            const areaSquareKilometers = areaSquareMeters / 1_000_000;

            if (areaSquareKilometers > MAX_POLYGON_ANALYSIS_AREA_KM2) {
              toastWarning(
                `A área selecionada tem aproximadamente ${areaSquareKilometers.toFixed(1)} km². Reduza o polígono para até ${MAX_POLYGON_ANALYSIS_AREA_KM2} km² antes de analisar.`,
                7000,
              );
              return;
            }

            if (!feature.value && currentFeature) {
              polygonEdit.setFeature(currentFeature);
            }
            polygonEdit.setIsEditing(false);
            fetchData(currentFeature);
          }}
        >
          {loading.value ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          <span>{analysisBlockedByZoom ? "Aproxime para analisar" : "Analisar área"}</span>
        </Button>
      </div>
    );
  };

  const renderShiftDragMenu = () => {
    if (!shiftDragMenu) return null;

    return (
      <div
        ref={shiftDragMenuRef}
        className="urbis-app-menu-layer absolute min-w-52 overflow-hidden rounded-md border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg dark:bg-card dark:text-card-foreground"
        style={{ left: shiftDragMenu.x, top: shiftDragMenu.y }}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
      >
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left outline-none hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground dark:hover:bg-border dark:focus:bg-border"
          onClick={() => {
            applyShiftDragZoom(shiftDragMenu);
            setShiftDragMenu(null);
          }}
        >
          <Search className="h-4 w-4" />
          Dar zoom aqui
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left outline-none hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground dark:hover:bg-border dark:focus:bg-border"
          onClick={() => setShiftDragMenu(null)}
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
      </div>
    );
  };

  const renderContextMenu = () => {
    if (!contextMenu) return null;

    const projectedCoordinates = getProjectedCoordinates(
      contextMenu.latitude,
      contextMenu.longitude,
    );
    const latLon = `${contextMenu.latitude}, ${contextMenu.longitude}`;
    const projectedCoordinatesText = projectedCoordinates
      ? `${projectedCoordinates.easting.toFixed(
          2,
        )}, ${projectedCoordinates.northing.toFixed(2)}`
      : null;
    const formattedLatLon = `${contextMenu.latitude.toFixed(
      5,
    )}, ${contextMenu.longitude.toFixed(5)}`;

    return (
      <div
        ref={contextMenuRef}
        className="urbis-app-menu-layer absolute min-w-60 overflow-hidden rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-xl backdrop-blur-sm dark:bg-popover dark:text-popover-foreground"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
      >
        <TooltipProvider delayDuration={150}>
          <div className="space-y-0.5 p-0.5">
            <button
              type="button"
              className="group flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              onClick={() => {
                copyToClipboard(latLon);
                setContextMenu(null);
              }}
            >
              <span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  Latitude / Longitude · EPSG:4326
                  <InfoTooltip>
                    Coordenada em graus, usada em GPS e mapas web.
                  </InfoTooltip>
                </span>
                <span className="block font-mono text-xs font-semibold text-foreground">
                  {formattedLatLon}
                </span>
              </span>
              <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </button>
            {projectedCoordinatesText && (
              <button
                type="button"
                className="group flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                onClick={() => {
                  copyToClipboard(projectedCoordinatesText);
                  setContextMenu(null);
                }}
              >
                <span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    X / Y (metros) · EPSG:31983
                    <InfoTooltip>
                      Coordenada oficial projetada em metros para São Paulo.
                    </InfoTooltip>
                  </span>
                  <span className="block font-mono text-xs font-semibold text-foreground">
                    {projectedCoordinatesText}
                  </span>
                </span>
                <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </button>
            )}
            <div className="my-1 border-t border-border/50" />
            <button
              type="button"
              className="group flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-xs font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              onClick={() => {
                handleDrawAnalyzeHere(
                  contextMenu.latitude,
                  contextMenu.longitude,
                );
              }}
            >
              <span className="flex items-center gap-2 text-foreground">
                <SquarePen className="h-3.5 w-3.5 shrink-0 text-primary" />
                Desenhar / Analisar aqui
              </span>
              <InfoTooltip>
                Desenha um quadrado no local selecionado e abre a análise da área.
              </InfoTooltip>
            </button>
            {features.digitalAddress && (
              <button
                type="button"
                className="group flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-xs font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                onClick={() => {
                  openDigitalAddressAt(
                    contextMenu.latitude,
                    contextMenu.longitude,
                  );
                  setContextMenu(null);
                }}
              >
                <span className="flex items-center gap-2 text-foreground">
                  <img src="/ed.png" alt="" className="h-3.5 w-3.5 shrink-0" />
                  Descobrir Endereço Digital
                </span>
                <InfoTooltip>
                  Calcula e abre o Endereço Digital correspondente ao ponto selecionado.
                </InfoTooltip>
              </button>
            )}
          </div>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <>
      <div
        className={cn(
          "relative w-full h-full",
          disablePadding && "disable-map-padding",
        )}
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        {viewport.value ? (
          <Map
            style={{ width: "100%", height: "100%" }}
            mapStyle={currentMapStyle}
            maxPitch={is3DActive.value ? 85 : 60}
            initialViewState={viewport.value}
            attributionControl={!minimalPreview}
            boxZoom={true}
            dragPan={true}
            dragRotate={!minimalPreview}
            doubleClickZoom={true}
            keyboard={true}
            scrollZoom={true}
            touchZoomRotate={true}
            onMouseMove={
              minimalPreview
                ? undefined
                : (evt) => {
                    lastMapPointRef.current = {
                      x: evt.point.x,
                      y: evt.point.y,
                    };
                    cursorPosition.value = {
                      latitude: evt.lngLat.lat,
                      longitude: evt.lngLat.lng,
                    };
                  }
            }
            onContextMenu={
              minimalPreview
                ? undefined
                : (evt) => {
                    evt.originalEvent.preventDefault();
                    openContextMenuAt({
                      x: evt.point.x,
                      y: evt.point.y,
                      latitude: evt.lngLat.lat,
                      longitude: evt.lngLat.lng,
                    });
                  }
            }
            onClick={minimalPreview ? undefined : handleMapClickFallback}
            onTouchStart={
              minimalPreview
                ? undefined
                : (evt) => {
                    if (isDesktop) return;

                    const originalEvent = evt.originalEvent as TouchEvent;
                    if (originalEvent.touches.length !== 1) return;

                    clearMobileLongPress();
                    mobileLongPressTimeoutRef.current = window.setTimeout(
                      () => {
                        originalEvent.preventDefault();
                        openContextMenuAt({
                          x: evt.point.x,
                          y: evt.point.y,
                          latitude: evt.lngLat.lat,
                          longitude: evt.lngLat.lng,
                        });
                        mobileLongPressTimeoutRef.current = null;
                      },
                      MOBILE_LONG_PRESS_MS,
                    );
                  }
            }
            onTouchMove={minimalPreview ? undefined : clearMobileLongPress}
            onTouchEnd={minimalPreview ? undefined : clearMobileLongPress}
            onTouchCancel={minimalPreview ? undefined : clearMobileLongPress}
            onMoveEnd={
              minimalPreview
                ? undefined
                : () => {
                    const map = (overlayRef?.current as any)?._map;
                    if (map) {
                      const center = map.getCenter();
                      const bounds = map.getBounds();
                      const currentZoom = map.getZoom();
                      const currentBearing = map.getBearing();
                      const currentPitch = map.getPitch();

                      handleViewportChange({
                        zoom: currentZoom,
                        bearing: currentBearing,
                        pitch: currentPitch,
                        latitude: center.lat,
                        longitude: center.lng,
                        getBounds: () => [
                          bounds.getWest(),
                          bounds.getSouth(),
                          bounds.getEast(),
                          bounds.getNorth(),
                        ],
                      });

                      const hash = formatMapHash({
                        zoom: currentZoom,
                        latitude: center.lat,
                        longitude: center.lng,
                        bearing: currentBearing,
                        pitch: currentPitch,
                      });
                      updateMapUrlHash(hash);
                    } else {
                      const deckViewport = (
                        overlayRef!.current as any
                      )?._deck?.getViewports()?.[0];
                      if (deckViewport) {
                        handleViewportChange(deckViewport);
                      }
                    }
                  }
            }
          >
            <DeckGLOverlay
              ref={overlayRef}
              layers={!isEditing.value ? layers.value : []}
              onClick={(i) => {
                if (!minimalPreview) handleClick(i);
              }}
              onLoad={() => {
                onMapLoad?.();
                if (minimalPreview) return;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const map = (overlayRef.current as any)._map;
                mapInstanceRef.current = map;
                map.on("ruler.on", () => {
                  isRulerActiveRef.current = true;
                  setContextMenu(null);
                  setShiftDragMenu(null);
                });
                map.on("ruler.off", () => {
                  isRulerActiveRef.current = false;
                });
                map.on("boxzoomstart", () => {
                  boxZoomStartCameraRef.current = getMapCamera(map);
                  setContextMenu(null);
                  setShiftDragMenu(null);
                });
                map.on("boxzoomend", () => {
                  const before = boxZoomStartCameraRef.current;
                  if (!before) return;

                  window.setTimeout(() => {
                    const after = getMapCamera(map);
                    map.jumpTo({
                      center: [before.center.lng, before.center.lat],
                      zoom: before.zoom,
                      bearing: before.bearing,
                      pitch: before.pitch,
                    });

                    const point = lastMapPointRef.current ?? { x: 24, y: 24 };
                    setShiftDragMenu({
                      x: point.x,
                      y: point.y,
                      before,
                      after,
                    });
                    boxZoomStartCameraRef.current = null;
                  }, 0);
                });
                map.on("boxzoomcancel", () => {
                  boxZoomStartCameraRef.current = null;
                });

                const mapContainer = map.getContainer();
                const getLocalPoint = (event: MouseEvent) => {
                  const rect = mapContainer.getBoundingClientRect();
                  return {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                  };
                };
                const openShiftDragMenuFromMouse = (
                  before: ShiftDragMenuState["before"],
                  startPoint: { x: number; y: number },
                  endPoint: { x: number; y: number },
                ) => {
                  window.setTimeout(() => {
                    const after = getMapCamera(map);
                    const nw = map.unproject({
                      x: Math.min(startPoint.x, endPoint.x),
                      y: Math.min(startPoint.y, endPoint.y),
                    });
                    const se = map.unproject({
                      x: Math.max(startPoint.x, endPoint.x),
                      y: Math.max(startPoint.y, endPoint.y),
                    });
                    map.jumpTo({
                      center: [before.center.lng, before.center.lat],
                      zoom: before.zoom,
                      bearing: before.bearing,
                      pitch: before.pitch,
                    });
                    setShiftDragMenu({
                      x: endPoint.x,
                      y: endPoint.y,
                      before,
                      after,
                      bounds: [
                        [nw.lng, se.lat],
                        [se.lng, nw.lat],
                      ],
                    });
                  }, 50);
                };
                const onShiftDragMouseDown = (event: MouseEvent) => {
                  if (event.button !== 0 || !event.shiftKey) return;

                  const point = getLocalPoint(event);
                  shiftDragStartRef.current = {
                    ...point,
                    before: getMapCamera(map),
                  };
                  setContextMenu(null);
                  setShiftDragMenu(null);
                };
                const onShiftDragMouseUp = (event: MouseEvent) => {
                  const start = shiftDragStartRef.current;
                  if (!start) return;

                  shiftDragStartRef.current = null;
                  const point = getLocalPoint(event);
                  lastMapPointRef.current = point;
                  const distance = Math.hypot(
                    point.x - start.x,
                    point.y - start.y,
                  );
                  if (distance < 8) return;

                  openShiftDragMenuFromMouse(start.before, start, point);
                };
                const onShiftDragMouseCancel = () => {
                  shiftDragStartRef.current = null;
                };
                mapContainer.addEventListener(
                  "mousedown",
                  onShiftDragMouseDown,
                  true,
                );
                window.addEventListener("mouseup", onShiftDragMouseUp, true);
                window.addEventListener("blur", onShiftDragMouseCancel);

                addMapControls(
                  map,
                  polygonEdit,
                  () => {
                    if (!features.digitalAddress) return;

                    isPickingLocation.value = !isPickingLocation.value;
                  },
                  hideControls,
                  drawerOpen.value,
                );
              }}
              style={{
                cursor:
                  !minimalPreview && isPickingLocation.value
                    ? "crosshair"
                    : "default",
              }}
            />
          </Map>
        ) : (
          <div className="flex h-[100vh] w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {!minimalPreview && renderContextMenu()}
        {!minimalPreview && renderShiftDragMenu()}
      </div>
      {!hideControls &&
        !minimalPreview &&
        (isEditing.value ? (
          saveButton()
        ) : (
          <LayerController
            hideManager={hideLayerManager}
            hideBaseMapSelector={hideBaseMapSelector}
          />
        ))}
    </>
  );
};
