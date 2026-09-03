import { useContext } from "react";
import { PolygonEditContext } from "../context/PolygonEditContext";
import { IPolygonEditContextActions } from "../types/polygon-edit-context-type";

export const usePolygonEditContext = (): IPolygonEditContextActions => {
  const context = useContext(PolygonEditContext);
  if (!context)
    throw new Error(
      "usePolygonEditContext must be used within a NavigationProvider",
    );

  const {
    feature: ctxFeature,
    isEditing: ctxIsEditing,
    drawRef,
    reset: resetFetch,
    ...restContext
  } = context;

  // Use raw signals to ensure stability
  const feature = ctxFeature;
  const isEditing = ctxIsEditing;

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
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addedIds = draw!.add(data as any);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const featureId = (data as any).id || (addedIds && addedIds[0]);
      if (featureId) {
        try {
          draw!.changeMode("direct_select", { featureId });
        } catch (e) {
          console.warn("Failed to enter direct_select mode", e);
          draw!.changeMode("simple_select", { featureIds: [featureId] });
        }
      }
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
