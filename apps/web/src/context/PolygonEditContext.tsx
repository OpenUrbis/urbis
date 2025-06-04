import { computed, signal } from "@preact/signals-react";
import { ComponentChildren, createContext } from "preact";
import { useRef } from "react";
import { useFetchIntersectingPolygons } from "../hooks/useFetchIntersectingPolygons";
import { useMapContext } from "../hooks/useMapContext";
import { PolygonEditContextType } from "../types/polygon-edit-context-type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const feature = signal<any>(null);
const isEditing = signal<boolean>(false);

export const PolygonEditContext = createContext<PolygonEditContextType | null>(
  null
);

export const PolygonEditProvider = ({
  children,
}: {
  children: ComponentChildren;
}) => {
  const { data, loading, error, reset, fetchData } =
    useFetchIntersectingPolygons();
  const { editFeatureTemplate: mapContextEditFeatureTemplate, layerWithRootEditTemplate: mapContextLayerWithRootEditTemplate } =
    useMapContext();

  const editFeatureTemplate = computed(
    () => mapContextEditFeatureTemplate.value
  );
  const layerWithRootEditTemplate = computed(
    () => mapContextLayerWithRootEditTemplate.value
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
