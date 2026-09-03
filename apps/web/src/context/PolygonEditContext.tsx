import { computed, signal } from "@preact/signals";
import { createContext, ReactNode, useRef } from "react";
import { useFetchIntersectingPolygons } from "../hooks/useFetchIntersectingPolygons";
import { useMapContext } from "../hooks/useMapContext";
import { PolygonEditContextType } from "../types/polygon-edit-context-type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const feature = signal<any>(null);
const isEditing = signal<boolean>(false);

export const PolygonEditContext = createContext<PolygonEditContextType | null>(
  null,
);

export const PolygonEditProvider = ({ children }: { children: ReactNode }) => {
  const { data, loading, error, reset, fetchData: fetchIntersections } =
    useFetchIntersectingPolygons();
  const {
    layerSchemas,
    editFeatureTemplate: mapContextEditFeatureTemplate,
    layerWithRootEditTemplate: mapContextLayerWithRootEditTemplate,
  } = useMapContext();

  const fetchData = async (
    polygon: any,
    customLayers?: string[],
    options?: { isFiu?: boolean; context?: string },
  ) => {
    const layerSet = new Set<string>();

    if (customLayers && Array.isArray(customLayers)) {
      customLayers.forEach((l) => {
        if (l) layerSet.add(l);
      });
    }

    if (layerSchemas?.value?.length) {
      const isFiu = Boolean(options?.isFiu || options?.context === "fiu");

      for (const s of layerSchemas.value) {
        if (s.isActive === false) continue;

        if (isFiu) {
          // In FIU context, include layers marked for FIU
          const isFiuLayer =
            (s as any).includeInFiu !== false &&
            (s as any).properties?.includeInFiu !== false;
          if (isFiuLayer) {
            const id = s.id || s.name;
            if (id) layerSet.add(id);
          }
        } else {
          // 1. Mandatory layers from admin (includeInAnalysis !== false)
          const isMandatory =
            (s as any).includeInAnalysis !== false &&
            (s as any).properties?.includeInAnalysis !== false;

          // 2. Active / visible layers currently selected by user on map
          const isUserActive = Boolean(s.isVisible || s.isSelected);

          if (isMandatory || isUserActive) {
            const id = s.id || s.name;
            if (id) layerSet.add(id);
            if (s.origin) {
              try {
                const parsed = new URL(s.origin);
                const tn =
                  parsed.searchParams.get("typeName") ||
                  parsed.searchParams.get("layers");
                if (tn) layerSet.add(tn);
              } catch {
                // Not a full URL
              }
            }
            if ((s as any).properties?.layers) {
              layerSet.add((s as any).properties.layers);
            }
            if ((s as any).properties?.typeName) {
              layerSet.add((s as any).properties.typeName);
            }
          }
        }
      }
    }

    const layersToQuery = layerSet.size > 0 ? Array.from(layerSet) : undefined;
    await fetchIntersections(polygon, layersToQuery, options);
  };

  const editFeatureTemplate = computed(
    () => mapContextEditFeatureTemplate.value,
  );
  const layerWithRootEditTemplate = computed(
    () => mapContextLayerWithRootEditTemplate.value,
  );

  return (
    <PolygonEditContext.Provider
      value={{
        feature,
        isEditing,
        data,
        loading,
        error,
        reset,
        fetchData,
        editFeatureTemplate,
        layerWithRootEditTemplate,
        drawRef: useRef(null),
      }}
    >
      {children}
    </PolygonEditContext.Provider>
  );
};
