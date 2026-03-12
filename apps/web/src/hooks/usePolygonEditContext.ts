import { computed } from "@preact/signals";
import { useContext } from "react";
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
    reset: resetFetch,
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
    (drawRef as any)!.current = newDrawRef;
  };

  const reset = () => {
    resetFetch();
    ctxFeature.value = null;
    ctxIsEditing.value = false;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editFeature = (data: any) => {
    if (!drawRef) {
      console.error("MapContext is not initialized (drawRef is null)");
      return;
    }

    reset();
    const { current: draw } = drawRef;

    setFeature(data);
    setIsEditing(true);

    draw!.deleteAll();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    draw!.add(data as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const featureId = (data as any).id;
    if (featureId) {
      draw!.changeMode("direct_select", { featureId });
    }
  };

  return {
    feature,
    isEditing,
    drawRef,
    setFeature,
    setIsEditing,
    setDrawRef,
    reset,
    editFeature,
    ...restContext,
  };
};
