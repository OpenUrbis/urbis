import { useEffect, useRef, useState, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@open-urbis/map-ui";
import { Eye, EyeOff, Info, ArrowLeft, Layers } from "lucide-react";
import { getMapStyle } from "../../MapView/base-map-styles";

interface MapPreviewProps {
  featureCollection: any;
  mainGeometry?: any;
}

interface LayerConfig {
  id: string;
  color: string;
  label: string;
  visible: boolean;
}

const getLayerExtrusionOpacity = (layerId: string) => {
  if (layerId === "pavimento") {
    return 0.68;
  }

  if (layerId === "area_edificada") {
    return 0.42;
  }

  if (layerId === "area_individual") {
    return 0.85;
  }

  return 0.72;
};

const getLayerExtrusionColor = (layer: LayerConfig) => {
  if (layer.id === "pavimento") {
    return [
      "case",
      ["==", ["get", "is2D"], true],
      "#cbd5e1",
      [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "base_height"], 0],
        0,
        "#8aa392",
        3,
        "#6f8b7a",
        6,
        "#556e5f",
        9,
        "#8fa899",
        12,
        "#43594c",
        15,
        "#9bb3a5",
      ],
    ] as maplibregl.ExpressionSpecification;
  }

  if (layer.id === "area_individual") {
    return [
      "case",
      ["has", "unitColor"],
      ["get", "unitColor"],
      layer.color,
    ] as maplibregl.ExpressionSpecification;
  }

  return layer.color;
};

const getLayerLineColor = (layer: LayerConfig) => {
  if (layer.id === "pavimento") {
    return [
      "case",
      ["==", ["get", "is2D"], true],
      "#64748b",
      [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "base_height"], 0],
        0,
        "#5f7869",
        3,
        "#4f6758",
        6,
        "#3f5548",
        9,
        "#617a6b",
        12,
        "#314338",
        15,
        "#6c8576",
      ],
    ] as maplibregl.ExpressionSpecification;
  }

  if (layer.id === "area_individual") {
    return [
      "case",
      ["has", "unitColor"],
      ["get", "unitColor"],
      layer.color,
    ] as maplibregl.ExpressionSpecification;
  }

  return layer.color;
};

const getLayerLineWidth = (layerId: string) => {
  if (layerId === "pavimento") return 2.5;
  if (layerId === "area_individual") return 2;
  if (layerId === "bloco") return 3;
  return 2;
};

const fitMapToBounds = (
  mapInstance: maplibregl.Map,
  fc: any,
  options?: {
    pitch?: number;
    bearing?: number;
    duration?: number;
    padding?: number;
  },
) => {
  if (!fc || !fc.features || fc.features.length === 0) return;

  const bounds = new maplibregl.LngLatBounds();
  let hasCoords = false;
  const walk = (coords: any) => {
    if (
      typeof coords[0] === "number" &&
      typeof coords[1] === "number" &&
      Number.isFinite(coords[0]) &&
      Number.isFinite(coords[1])
    ) {
      bounds.extend(coords as [number, number]);
      hasCoords = true;
    } else if (Array.isArray(coords)) {
      coords.forEach(walk);
    }
  };

  fc.features.forEach((f: any) => {
    if (f.geometry?.coordinates) walk(f.geometry.coordinates);
  });

  if (hasCoords && !bounds.isEmpty()) {
    mapInstance.fitBounds(bounds, {
      padding: options?.padding ?? 50,
      duration: options?.duration ?? 1000,
      pitch: options?.pitch ?? 0,
      bearing: options?.bearing ?? 0,
    });
  }
};

/**
 * MapPreview PURAMENTE MAPLIBRE-GL.
 * Permite navegação 3D com visualização dos pavimentos empilhados,
 * e ao clicar em um pavimento transiciona para 2D alinhado ao Norte
 * com exibição detalhada das unidades e áreas daquele pavimento.
 */
export const MapPreview = ({ featureCollection }: MapPreviewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedFloorProps, setSelectedFloorProps] = useState<any | null>(null);

  const [layersState, setLayersState] = useState<LayerConfig[]>([
    { id: "calcada", color: "#a0a8b5", label: "Calçadas", visible: true },
    { id: "acesso_veiculo", color: "#f4b95f", label: "Acessos", visible: true },
    { id: "pavimento", color: "#5f7a6a", label: "Pavimentos", visible: true },
    { id: "area_individual", color: "#818cf8", label: "Unidades", visible: true },
    { id: "estacionamento", color: "#38bdf8", label: "Estacionamento", visible: true },
  ]);

  const selectedFloorUnitsCount = useMemo(() => {
    if (!selectedFloor || !featureCollection?.features) return 0;
    return featureCollection.features.filter((f: any) => {
      const path = f.properties?.jsonPath || "";
      return (
        f.properties?.type === "area_individual" &&
        (path === selectedFloor || path.startsWith(`${selectedFloor}.`) || path.includes(selectedFloor))
      );
    }).length;
  }, [featureCollection, selectedFloor]);

  const filteredFeatures = useMemo(() => {
    if (!featureCollection) return null;

    if (!selectedFloor) {
      // MODO 3D (Visão Geral do Edifício / Pavimentos Empilhados):
      // Oculta unidades internas e estacionamentos internos dos pavimentos
      return {
        ...featureCollection,
        features: featureCollection.features
          .filter(
            (f: any) =>
              f.properties?.type !== "area_individual" &&
              !(
                f.properties?.type === "estacionamento" &&
                f.properties?.jsonPath?.includes("pavimentos")
              ),
          )
          .map((f: any) => ({
            ...f,
            properties: {
              ...f.properties,
              is2D: false,
            },
          })),
      };
    }

    // MODO 2D (Pavimento Selecionado):
    // Exibe apenas as unidades e áreas pertencentes ao pavimento selecionado + contorno do pavimento.
    // Todas as geometrias ficam com height: 0 e base_height: 0 para projeção plana 2D perfeita.
    const floorFeatures = featureCollection.features
      .filter((f: any) => {
        const path = f.properties?.jsonPath || "";
        const isThisFloor = path === selectedFloor;
        const isChildOfThisFloor =
          path.startsWith(`${selectedFloor}.`) || path.includes(selectedFloor);
        return isThisFloor || isChildOfThisFloor;
      })
      .map((f: any) => {
        const isFloorBoundary = f.properties?.jsonPath === selectedFloor;
        return {
          ...f,
          properties: {
            ...f.properties,
            is2D: true,
            isFloorBoundary,
            height: 0,
            base_height: 0,
          },
        };
      });

    return {
      ...featureCollection,
      features: floorFeatures,
    };
  }, [featureCollection, selectedFloor]);

  const toggleLayer = (id: string) => {
    setLayersState((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    );
  };

  // Inicialização única do mapa
  useEffect(() => {
    if (!mapContainer.current) return;

    const isDark = document.documentElement.classList.contains("dark");

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(
        "geosampa-ortofoto-2020",
        isDark ? "dark" : "light",
      ) as maplibregl.StyleSpecification,
      center: [-46.6333, -23.5505],
      zoom: 12,
      pitch: 60,
      bearing: -20,
      attributionControl: false,
    });

    map.current = m;

    m.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      "bottom-right",
    );

    popup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: "320px",
      className: "dwg-metadata-popup",
    });

    m.on("load", () => {
      m.addSource("dwg-source", {
        type: "geojson",
        data: filteredFeatures || { type: "FeatureCollection", features: [] },
      });

      layersState.forEach((l) => {
        const extrusionOpacity = getLayerExtrusionOpacity(l.id);
        const extrusionColor = getLayerExtrusionColor(l);
        const lineColor = getLayerLineColor(l);
        const lineWidth = getLayerLineWidth(l.id);

        m.addLayer({
          id: `dwg-3d-${l.id}`,
          type: "fill-extrusion",
          source: "dwg-source",
          layout: { visibility: l.visible ? "visible" : "none" },
          paint: {
            "fill-extrusion-color": extrusionColor,
            "fill-extrusion-opacity": extrusionOpacity,
            "fill-extrusion-height": [
              "coalesce",
              ["get", "height"],
              0,
            ],
            "fill-extrusion-base": [
              "coalesce",
              ["get", "base_height"],
              0,
            ],
            "fill-extrusion-vertical-gradient": false,
          },
          filter: ["all", ["==", "$type", "Polygon"], ["==", "type", l.id]],
        });

        m.addLayer({
          id: `dwg-line-${l.id}`,
          type: "line",
          source: "dwg-source",
          layout: {
            visibility: l.visible ? "visible" : "none",
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": lineColor,
            "line-width": lineWidth,
            "line-opacity": 1,
          },
          filter: ["all", ["==", "$type", "Polygon"], ["==", "type", l.id]],
        });

        let clickPrevent = false;

        m.on("click", `dwg-3d-${l.id}`, (e) => {
          const props = e.features?.[0]?.properties;
          if (!props) return;

          // Se estiver na visão 3D e clicar em um pavimento, ativa o modo 2D
          if (
            (props.type === "area_edificada" || props.type === "pavimento") &&
            !selectedFloor
          ) {
            setSelectedFloor(props.jsonPath);
            setSelectedFloorProps(props);
            popup.current?.remove();
            clickPrevent = true;
            setTimeout(() => {
              clickPrevent = false;
            }, 100);
            return;
          }

          if (
            props.type === "imovel" ||
            props.type === "calcada" ||
            props.type === "acesso_veiculo"
          ) {
            return;
          }

          if (clickPrevent) {
            return;
          }

          // Emitir evento para abrir modal com as propriedades da feature/unidade
          const event = new CustomEvent("openFeatureModal", { detail: props });
          window.dispatchEvent(event);
        });

        m.on("mouseenter", `dwg-3d-${l.id}`, (e) => {
          m.getCanvas().style.cursor = "pointer";
          const props = e.features?.[0]?.properties;
          if (props && popup.current) {
            const isFloorIn3D =
              (props.type === "area_edificada" || props.type === "pavimento") &&
              !selectedFloor;
            const isUnitIn2D = props.type === "area_individual";
            const title = props.name || props.type;
            const subtitle = isFloorIn3D
              ? "Clique para ver unidades em 2D"
              : isUnitIn2D
                ? "Clique para ver ficha de parâmetros"
                : "Clique para ver detalhes";

            popup.current
              .setLngLat(e.lngLat)
              .setHTML(
                `
                <div class="px-3 py-2 font-sans bg-white dark:!bg-zinc-950 rounded-lg overflow-hidden text-gray-800 dark:text-gray-200 flex flex-col gap-1 items-start shadow-md border border-gray-200 dark:border-zinc-800">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full" style="background-color: ${props.unitColor || l.color}"></span>
                    <strong class="text-blue-700 dark:text-blue-400 text-xs font-bold tracking-tight">${title}</strong>
                  </div>
                  <span class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">${subtitle}</span>
                </div>
              `,
              )
              .addTo(m);
          }
        });

        m.on("mouseleave", `dwg-3d-${l.id}`, () => {
          m.getCanvas().style.cursor = "";
          popup.current?.remove();
        });
      });

      if (filteredFeatures && filteredFeatures.features.length > 0) {
        fitMapToBounds(m, filteredFeatures, {
          pitch: 60,
          bearing: -20,
          duration: 800,
        });
      }

      setIsMapReady(true);
    });

    return () => {
      m.remove();
    };
  }, []);

  // Responsividade e redimensionamento do container
  useEffect(() => {
    const container = mapContainer.current;
    if (!container) return;

    const resizeMap = () => {
      if (!map.current) return;
      requestAnimationFrame(() => {
        map.current?.resize();
      });
    };

    resizeMap();

    const resizeObserver = new ResizeObserver(() => {
      resizeMap();
    });

    resizeObserver.observe(container);
    window.addEventListener("resize", resizeMap);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeMap);
    };
  }, []);

  // Sincronização dos dados e câmera quando selectedFloor ou featureCollection mudam
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    const source = map.current.getSource("dwg-source") as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(
        filteredFeatures || { type: "FeatureCollection", features: [] },
      );
    }

    layersState.forEach((l) => {
      const visibility = l.visible ? "visible" : "none";
      if (map.current?.getLayer(`dwg-3d-${l.id}`)) {
        map.current.setLayoutProperty(`dwg-3d-${l.id}`, "visibility", visibility);
      }
      if (map.current?.getLayer(`dwg-line-${l.id}`)) {
        map.current.setLayoutProperty(`dwg-line-${l.id}`, "visibility", visibility);
      }
    });

    if (filteredFeatures && filteredFeatures.features.length > 0) {
      fitMapToBounds(map.current, filteredFeatures, {
        pitch: selectedFloor ? 0 : 60,
        bearing: selectedFloor ? 0 : -20,
        duration: 1000,
        padding: selectedFloor ? 60 : 50,
      });
    }
  }, [filteredFeatures, selectedFloor, layersState, isMapReady]);

  return (
    <div className="w-full h-full min-h-[400px] relative rounded-md overflow-hidden border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-sans transition-colors">
      <style>{`
        .dwg-metadata-popup .maplibregl-popup-content,
        .dwg-metadata-popup .mapboxgl-popup-content {
          padding: 0 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06) !important;
          border: 1px solid #e5e7eb !important;
          background: white !important;
        }
        html.dark .dwg-metadata-popup .maplibregl-popup-content,
        html.dark .dwg-metadata-popup .mapboxgl-popup-content,
        .dark .dwg-metadata-popup .maplibregl-popup-content,
        .dark .dwg-metadata-popup .mapboxgl-popup-content {
          border-color: #27272a !important;
          background: #09090b !important;
        }
        .dwg-metadata-popup .maplibregl-popup-tip,
        .dwg-metadata-popup .mapboxgl-popup-tip {
          border-top-color: #e5e7eb !important;
        }
        html.dark .dwg-metadata-popup .maplibregl-popup-tip,
        html.dark .dwg-metadata-popup .mapboxgl-popup-tip,
        .dark .dwg-metadata-popup .maplibregl-popup-tip,
        .dark .dwg-metadata-popup .mapboxgl-popup-tip {
          border-top-color: #27272a !important;
        }
      `}</style>

      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      {/* Header Overlay quando um pavimento está selecionado (Modo 2D Alinhado ao Norte) */}
      {selectedFloor ? (
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedFloor(null);
                setSelectedFloorProps(null);
              }}
              className="bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-100 shadow-md px-3.5 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all border border-gray-200 dark:border-zinc-800 group"
              title="Voltar para visualização 3D do edifício"
            >
              <ArrowLeft
                size={15}
                className="group-hover:-translate-x-0.5 transition-transform text-blue-600 dark:text-blue-400"
              />
              Voltar para visão 3D
            </button>

            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-gray-900 dark:text-zinc-100">
                {selectedFloorProps?.name || "Pavimento"}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                2D • Norte
              </span>
              {selectedFloorUnitsCount > 0 && (
                <span className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">
                  ({selectedFloorUnitsCount}{" "}
                  {selectedFloorUnitsCount === 1 ? "unidade" : "unidades"})
                </span>
              )}
            </div>

            {selectedFloorProps && (
              <button
                onClick={() => {
                  const event = new CustomEvent("openFeatureModal", {
                    detail: selectedFloorProps,
                  });
                  window.dispatchEvent(event);
                }}
                className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-sm px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors border border-blue-200 dark:border-blue-800"
                title="Ver ficha técnica do pavimento"
              >
                <Info size={14} /> Ficha do pavimento
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-zinc-300">
            <Layers size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Visão 3D • Clique em um pavimento para abrir em 2D</span>
          </div>
        </div>
      )}

      {/* Legenda Interativa */}
      <div className="absolute top-2 right-2 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-950/40 z-10 space-y-2 min-w-[140px] transition-colors">
        <h5 className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 border-b border-gray-200 dark:border-zinc-800 pb-1 flex items-center gap-2 transition-colors">
          <Info size={12} /> Legendas
        </h5>
        {layersState
          .filter((l) =>
            selectedFloor
              ? l.id === "area_individual" ||
                l.id === "estacionamento" ||
                l.id === "pavimento"
              : l.id !== "area_individual",
          )
          .map((l) => {
            const label =
              selectedFloor && l.id === "pavimento"
                ? "Perímetro do Pavimento"
                : l.label;

            return (
              <button
                key={l.id}
                onClick={() => toggleLayer(l.id)}
                className={cn(
                  "flex items-center justify-between w-full p-2 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 group",
                  !l.visible && "opacity-50 grayscale",
                )}
              >
                <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300 transition-colors">
                  <div
                    className="w-3 h-3 rounded-sm shadow-sm dark:shadow-zinc-950/40"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="text-xs font-medium">{label}</span>
                </div>
                {l.visible ? (
                  <Eye
                    size={12}
                    className="text-gray-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors"
                  />
                ) : (
                  <EyeOff
                    size={12}
                    className="text-gray-300 dark:text-zinc-600 transition-colors"
                  />
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
};
