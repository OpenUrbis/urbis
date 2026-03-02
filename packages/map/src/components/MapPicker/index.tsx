import { useEffect, useRef, useState } from "react";
import { MapProvider } from "../../context/MapContext";
import { SearchProvider } from "../../context/SearchContext";
import { NavigationProvider } from "../../context/NavigationContext";
import { PolygonEditProvider } from "../../context/PolygonEditContext";
import { MapView } from "../MapView";
import { LocationSelectionCard } from "../LocationSelectionCard";
import { Search } from "../Search";
import { useMapContext } from "../../hooks/useMapContext";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { effect } from "@preact/signals-react";
import { MapContextSelectedFeature } from "../../types/map-context-type";
import { calculateCentroid } from "../MapView/utils";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";
import { useNavigationContext } from "../../hooks/useNavigationContext";

export interface MapPickerValue {
  type: 'selection' | 'digital' | 'edit' | 'view' | 'none';
  selectedFeatures: MapContextSelectedFeature[];
  features: MapContextSelectedFeature[]; // Alias for selectedFeatures
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  digitalAddress: any;
  feature?: any; // Alias for digitalAddress feature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editFeature: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intersections: any;
  loading?: boolean;
}

interface MapPickerProps {
  onChange: (value: MapPickerValue) => void;
  initialData?: MapPickerValue;
  mode?: 'editable' | 'selected';
  children?: React.ReactNode; // Sidebar content
  overlay?: React.ReactNode;  // Full screen/overlay content
  hideMap?: boolean;
  hideLayerManager?: boolean;
  hideBaseMapSelector?: boolean;
  layerConfig?: IGetConfigLayerSchema[];
}

const MapPickerContent = ({ onChange, initialData, mode = 'editable', children, overlay, hideMap, hideLayerManager, hideBaseMapSelector, layerConfig }: MapPickerProps) => {
  const { digitalAddressFeature, selectedFeatures, flyTo, layerSchemas } = useMapContext();
  const { feature: editFeature, data: intersections, loading, setFeature: setEditFeature, fetchData, editFeature: startEditing, reset: resetPolygonEdit } = usePolygonEditContext();
  const { drawerOpen } = useNavigationContext();
  const [isPickerSidebarOpen, setIsPickerSidebarOpen] = useState(true);
  const mapLoaded = useRef(false);

    // Hydrate Initial Data
    useEffect(() => {
        // Fechar sidebar global inicialmente no MapPicker
        drawerOpen.value = false;
        // Force a small update to ensure component is fresh or logic runs (debug/hot-reload check)
        console.log("MapPickerContent mounted - checking hot reload");

        // Reset State
        selectedFeatures.value = [];
        digitalAddressFeature.value = null;
        resetPolygonEdit();

        if (layerConfig) {
            layerSchemas.value = layerConfig;
        }

        if (initialData) {
            if (initialData.selectedFeatures) selectedFeatures.value = initialData.selectedFeatures;
            if (initialData.digitalAddress) digitalAddressFeature.value = initialData.digitalAddress;
            if (initialData.editFeature) {
                // Just set the feature and fetch data initially, don't try to draw yet
                setEditFeature(initialData.editFeature);
                fetchData(initialData.editFeature);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMapLoad = () => {
        mapLoaded.current = true;
        if (initialData?.editFeature) {
            // Now draw is available
            startEditing(initialData.editFeature);
            // Re-fetch in case reset inside startEditing cleared it
            fetchData(initialData.editFeature);

            if (initialData.editFeature.geometry?.coordinates) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const centroid: any = calculateCentroid(initialData.editFeature.geometry.coordinates);
                flyTo({
                    center: [centroid[0][0], centroid[0][1]],
                    zoom: 18,
                    bearing: 0,
                });
            }
        }
    };

  // Unified Handler
  useEffect(() => {
    const dispose = effect(() => {
        const selected = selectedFeatures.value || [];
        const digital = digitalAddressFeature.value;
        const edit = editFeature.value;
        const inters = intersections.value; // Fetch intersections response signal

        // Merge intersections into editFeature so it's available in the external state
        // and any template modifications apply to the same object
        if (edit && inters) {
            edit.response = inters;
        }

        let type: MapPickerValue['type'] = 'none';
        if (edit) {
            type = mode === 'selected' ? 'view' : 'edit';
        }
        else if (digital) type = 'digital';
        else if (selected.length > 0) type = 'selection';

        // Custom Logic for Lote Selection in Editable Mode
        // "quando o lote for selecionado ja puxa o perimetro do do lote e busca a ficha"
        // This is handled by the consumer (e.g. MapTest page or MapPickerValue consumer)
        // using the 'selection' type output when mode is editable.

        const output: MapPickerValue = {
            type,
            selectedFeatures: selected,
            features: selected,
            digitalAddress: digital,
            feature: digital?.features?.[0] || digital, // Approximate for digital
            editFeature: edit,
            intersections: inters,
            loading: loading.value
        };
        
        onChange(output);
    });
    return () => dispose();
  }, [onChange, editFeature, intersections, loading, digitalAddressFeature, selectedFeatures, mode]);

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row">
        <div className="w-full h-full relative flex-1">
            <div style={{ display: hideMap ? 'none' : 'block', width: '100%', height: '100%' }}>
                <MapView 
                    hideControls={mode === 'selected'} 
                    onMapLoad={handleMapLoad}
                    hideLayerManager={hideLayerManager}
                    hideBaseMapSelector={hideBaseMapSelector}
                    disablePadding={true}
                />
            </div>
            
            {mode === 'editable' && (
                <div className="absolute top-4 left-2 z-10 flex max-w-[420px] flex-col gap-2 overflow-y-auto pointer-events-auto scrollbar-thin">
                    {!hideMap && (
                        <>
                            <div style={{ display: isPickerSidebarOpen ? 'block' : 'none' }}>
                                <Search 
                                    onMenuClick={() => setIsPickerSidebarOpen(false)}
                                    isMenuOpen={true}
                                />
                            </div>
                            {!isPickerSidebarOpen && (
                                <button
                                    type="button"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 hover:bg-accent border shadow-sm backdrop-blur-sm transition-colors"
                                    onClick={() => setIsPickerSidebarOpen(true)}
                                    title="Expandir menu"
                                >
                                    <span className="material-symbols-outlined text-base">
                                        menu
                                    </span>
                                </button>
                            )}
                            <div style={{ display: isPickerSidebarOpen ? 'block' : 'none' }}>
                                <LocationSelectionCard />
                            </div>
                        </>
                    )}
                    {isPickerSidebarOpen && children && <div className="pointer-events-auto">{children}</div>}
                </div>
            )}
            
            {mode === 'selected' && children && (
                 <div className="absolute top-4 left-2 z-10 max-w-[360px] pointer-events-none">
                    <div className="pointer-events-auto">{children}</div>
                 </div>
            )}
            
            {overlay}
        </div>
    </div>
  );
};

export const MapPicker = (props: MapPickerProps) => {
  return (
    <MapProvider>
        <SearchProvider>
            <NavigationProvider>
                <PolygonEditProvider>
                    <MapPickerContent {...props} />
                </PolygonEditProvider>
            </NavigationProvider>
        </SearchProvider>
    </MapProvider>
  );
};
