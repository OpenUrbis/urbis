import { computed } from "@preact/signals";
import { useContext } from "preact/hooks";
import { PolygonEditContext } from "../context/PolygonEditContext";
import { IPolygonEditContextActions } from "../types/polygon-edit-context-type";

export const usePolygonEditContext = (): IPolygonEditContextActions => {
  const context = useContext(PolygonEditContext);
  if (!context)
    throw new Error(
      "usePolygonEditContext must be used within a NavigationProvider"
    );

  const {
    feature: ctxFeature,
    isEditing: ctxIsEditing,
    drawRef,
    ...restContext
  } = context;
  const feature = computed(() => ctxFeature.value);
  const isEditing = computed(() => ctxIsEditing.value);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setFeature = (newFeature: any) => {
    ctxFeature.value = newFeature;
  };

  const setIsEditing = (newIsEditing: boolean) => {
    ctxIsEditing.value = newIsEditing;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setDrawRef = (newDrawRef: any) => {
    drawRef!.current = newDrawRef;
  };

  return {
    feature,
    isEditing,
    drawRef,
    setFeature,
    setIsEditing,
    setDrawRef,
    ...restContext,
  };
};
