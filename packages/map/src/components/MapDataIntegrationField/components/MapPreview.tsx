import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from '@open-urbis/map-ui';
import { Eye, EyeOff, Info, ArrowLeft } from 'lucide-react';

interface MapPreviewProps {
  featureCollection: any;
  mainGeometry: any;
}

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN || "pk.eyJ1Ijoib3BlbnVyYmlzIiwiYSI6ImNtNXp6cXJybDAxam0ya3B6bm9hd2ZoeHcifQ.Z_X_vX_vX_vX_vX_vX_vXw";

interface LayerConfig {
  id: string;
  color: string;
  label: string;
  visible: boolean;
}

/**
 * MapPreview PURAMENTE MAPBOX-GL.
 * Inclui controle de visibilidade e inspeção de dados JSON (Popup).
 */
export const MapPreview = ({ featureCollection }: MapPreviewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);

  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedFloorProps, setSelectedFloorProps] = useState<any | null>(null);
  const [layersState, setLayersState] = useState<LayerConfig[]>([
    { id: 'imovel', color: '#e8e0d0', label: 'Imóvel', visible: true },  // off-white bege claríssimo
    { id: 'pavimento', color: '#5f7a6a', label: 'Pavimentos', visible: true },  // verde-cinza escuro (moderno para buildings)
    { id: 'area_individual', color: '#9f8cd1', label: 'Unidades', visible: true },  // roxo-azulado suave
    { id: 'calcada', color: '#a0a8b5', label: 'Calçadas', visible: true },  // cinza azulado claro
    { id: 'acesso_veiculo', color: '#f4b95f', label: 'Acessos', visible: true }   // amarelo-alaranjado claro (atenção sem exagerar)
  ]);

  const filteredFeatures = useMemo(() => {
    if (!featureCollection) return null;
    if (!selectedFloor) {
      return {
        ...featureCollection,
        features: featureCollection.features.filter((f: any) => f.properties.type !== 'area_individual')
      };
    }
    return {
      ...featureCollection,
      features: featureCollection.features.filter((f: any) => {
        // Se a feature não tem o jsonPath que selecionamos (ou não é filha dele), não mostra
        if (!f.properties.jsonPath.includes(selectedFloor)) return false;

        // Se for o próprio selectedFloor, não mostra (a menos que a lógica exija)
        if (f.properties.jsonPath === selectedFloor) return false;

        // Se for do tipo 'pavimento', ele é o próprio pavimento mas tem o jsonPath dele mesmo
        // Ocultamos imovel e pavimento etc, mas mostramos os filhos
        if (f.properties.type === 'imovel' || f.properties.type === 'pavimento' || f.properties.type === 'area_edificada') {
          return false;
        }

        return true;
      })
    };
  }, [featureCollection, selectedFloor]);

  const toggleLayer = (id: string) => {
    setLayersState(prev => prev.map(l => (l.id === id ? { ...l, visible: !l.visible } : l)));
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    const isDark = document.documentElement.classList.contains('dark');

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: [-46.6333, -23.5505],
      zoom: 12,
      pitch: selectedFloor ? 0 : 60,
      bearing: selectedFloor ? 0 : -20,
      attributionControl: false
    });

    map.current = m;
    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '300px',
      className: 'dwg-metadata-popup'
    });

    m.on('load', () => {
      m.addSource('dwg-source', {
        type: 'geojson',
        data: filteredFeatures || { type: 'FeatureCollection', features: [] }
      });
      layersState.forEach(l => {
        // Camada 3D (Só pavimentos têm altura, conforme solicitado)
        m.addLayer({
          id: `dwg-3d-${l.id}`,
          type: 'fill-extrusion',
          source: 'dwg-source',
          layout: { 'visibility': l.visible ? 'visible' : 'none' },
          paint: {
            'fill-extrusion-color': l.color,
            // Adiciona alternância de opacidade apenas para pavimentos
            'fill-extrusion-opacity': l.id === 'pavimento'
              ? 0.38
              : 0.7,
            'fill-extrusion-height': (l.id === 'area_edificada' || l.id === 'pavimento' || l.id === 'area_individual') ? ['get', 'height'] : 0,
            'fill-extrusion-base': ['get', 'base_height']
          },
          filter: ['all', ['==', '$type', 'Polygon'], ['==', 'type', l.id]]
        });

        // Outline
        m.addLayer({
          id: `dwg-line-${l.id}`,
          type: 'line',
          source: 'dwg-source',
          layout: { 'visibility': l.visible ? 'visible' : 'none' },
          paint: {
            'line-color': l.color,
            'line-width': l.id === 'bloco' ? 3 : 1.5,
            'line-opacity': 0.8
          },
          filter: ['==', 'type', l.id]
        });
        let prevent = false;
        // Interatividade
        m.on('click', `dwg-3d-${l.id}`, (e) => {
          const props = e.features?.[0].properties;
          if (!props) return;

          if ((props.type === 'area_edificada' || props.type === 'pavimento') && !selectedFloor) {
            setSelectedFloor(props.jsonPath);
            setSelectedFloorProps(props);
            // Do not open modal on floor click
            prevent = true;
            setTimeout(() => { prevent = false; }, 100);
            return;
          }
          if (props.type === 'imovel') {
            return;
          }

          if (prevent) {
            return;
          }

          // Emit a custom event to open the modal with the feature properties
          const event = new CustomEvent('openFeatureModal', { detail: props });
          window.dispatchEvent(event);
        });

        m.on('mouseenter', `dwg-3d-${l.id}`, (e) => {
          m.getCanvas().style.cursor = 'pointer';
          const props = e.features?.[0].properties;
          if (props && popup.current) {
            popup.current.setLngLat(e.lngLat).setHTML(`
              <div class="px-3 py-2 font-sans bg-white dark:!bg-black rounded-lg overflow-hidden text-gray-800 dark:text-gray-200 flex flex-col gap-1 items-start">
                <strong class="text-blue-700 dark:text-blue-400 text-[11px] uppercase tracking-tighter">${props.name || props.type}</strong>
                <span class="text-[9px] text-gray-500 dark:text-gray-400 uppercase">Clique para ver detalhes</span>
              </div>
            `).addTo(m);
          }
        });

        m.on('mouseleave', `dwg-3d-${l.id}`, () => {
          m.getCanvas().style.cursor = '';
          popup.current?.remove();
        });
      });

      if (filteredFeatures && filteredFeatures.features.length > 0) {
        fitMapToBounds(m, filteredFeatures);
      }
    });

    return () => {
      m.remove();
    };
  }, [selectedFloor]);

  useEffect(() => {
    if (map.current?.isStyleLoaded() && map.current.getSource('dwg-source')) {
      const source = map.current.getSource('dwg-source') as mapboxgl.GeoJSONSource;
      source.setData(filteredFeatures || { type: 'FeatureCollection', features: [] });
      layersState.forEach(l => {
        const visibility = l.visible ? 'visible' : 'none';
        if (map.current?.getLayer(`dwg-3d-${l.id}`)) map.current.setLayoutProperty(`dwg-3d-${l.id}`, 'visibility', visibility);
        if (map.current?.getLayer(`dwg-line-${l.id}`)) map.current.setLayoutProperty(`dwg-line-${l.id}`, 'visibility', visibility);
      });
    }
  }, [filteredFeatures, layersState]);

  const fitMapToBounds = (mapInstance: mapboxgl.Map, fc: any) => {
    const bounds = new mapboxgl.LngLatBounds();
    let hasCoords = false;
    const walk = (coords: any) => {
      if (typeof coords[0] === 'number') {
        bounds.extend(coords as [number, number]);
        hasCoords = true;
      }
      else if (Array.isArray(coords)) coords.forEach(walk);
    };
    fc.features.forEach((f: any) => walk(f.geometry.coordinates));
    if (hasCoords && !bounds.isEmpty()) {
      mapInstance.fitBounds(bounds, { padding: 50, duration: 1000 });
    }
  };

  return (
    <div className="w-full h-full min-h-[400px] relative rounded-md overflow-hidden border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-sans transition-colors">
      <style>{`
        .dwg-metadata-popup .mapboxgl-popup-content {
          padding: 0 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06) !important;
          border: 1px solid #e5e7eb !important;
          background: white !important;
        }
        html.dark .dwg-metadata-popup .mapboxgl-popup-content,
        .dark .dwg-metadata-popup .mapboxgl-popup-content {
          border-color: #27272a !important;
          background: #09090b !important;
        }
        .dwg-metadata-popup .mapboxgl-popup-tip {
          border-top-color: #e5e7eb !important;
        }
        html.dark .dwg-metadata-popup .mapboxgl-popup-tip,
        .dark .dwg-metadata-popup .mapboxgl-popup-tip {
          border-top-color: #27272a !important;
        }
      `}</style>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />

      {selectedFloor && (
        <div className="absolute top-4 left-2 flex flex-col gap-2 z-20">
          <button
            onClick={() => {
              setSelectedFloor(null);
              setSelectedFloorProps(null);
            }}
            className="bg-white dark:bg-zinc-900 shadow-sm dark:shadow-zinc-950/40 px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] tracking-widest hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border border-gray-200 dark:border-zinc-800 group text-gray-700 dark:text-zinc-300"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Desselecionar pavimento
          </button>

          {selectedFloorProps && (
            <button
              onClick={() => {
                const event = new CustomEvent('openFeatureModal', { detail: selectedFloorProps });
                window.dispatchEvent(event);
              }}
              className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 shadow-sm dark:shadow-zinc-950/40 px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-200 dark:border-blue-500/20 group"
            >
              <Info size={14} /> Ficha de parâmetros do pavimento
            </button>
          )}
        </div>
      )}

      {/* Legenda Interativa */}
      <div className="absolute top-2 right-2 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-950/40 z-10 space-y-2 min-w-[140px] transition-colors">
        <h5 className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 border-b border-gray-200 dark:border-zinc-800 pb-1 flex items-center gap-2 transition-colors">
          <Info size={12} /> Legendas
        </h5>
        {layersState.filter(l => selectedFloor ? l.id === 'area_individual' : l.id !== 'area_individual').map(l => (
          <button
            key={l.id}
            onClick={() => toggleLayer(l.id)}
            className={cn(
              "flex items-center justify-between w-full p-2 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 group",
              !l.visible && "opacity-50 grayscale"
            )}
          >
            <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300 transition-colors">
              <div className="w-3 h-3 rounded-sm shadow-sm dark:shadow-zinc-950/40" style={{ backgroundColor: l.color }} />
              <span className="text-xs font-medium">{l.label}</span>
            </div>
            {l.visible ? <Eye size={12} className="text-gray-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors" /> : <EyeOff size={12} className="text-gray-300 dark:text-zinc-600 transition-colors" />}
          </button>
        ))}
      </div>
    </div>
  );
};
