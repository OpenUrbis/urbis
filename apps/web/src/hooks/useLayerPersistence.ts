import { effect, signal, batch } from "@preact/signals";
import { useContext, useEffect } from "react";
import { useMapContext, currentShare } from "./useMapContext";
import { SearchContext } from "../context/SearchContext";
import { shareService } from "../integrations/share-service";

export const currentSessionId = signal<string>(crypto.randomUUID());
export const isRestored = signal(false);
export const isMapPopulated = signal(false);
export const isMapError = signal(false);

export const useLayerPersistence = () => {
  const mapContext = useMapContext();
  const searchContext = useContext(SearchContext);

  // Monitor when map is populated by API
  effect(() => {
    if (
      (mapContext.layerSchemas.value.length > 0 ||
        mapContext.layerGroups.value.length > 0) &&
      !isMapPopulated.value
    ) {
      isMapPopulated.value = true;
    }
  });

  // Monitor map population timeout (fallback)
  useEffect(() => {
    if (!isMapPopulated.value) {
      const timer = setTimeout(() => {
        if (!isMapPopulated.value) {
          if (
            mapContext.layerSchemas.value.length === 0 &&
            mapContext.layerGroups.value.length === 0
          ) {
            isMapError.value = true;
          } else {
            isMapPopulated.value = true;
          }
        }
      }, 10000); // 10s timeout
      return () => clearTimeout(timer);
    }
    return () => {}; // Explicitly return void cleanup function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Init / Restore logic
  useEffect(() => {
    const init = async () => {
      // Wait for Map to be populated from API first
      if (!isMapPopulated.value) {
        const unsubs = effect(() => {
          if (isMapPopulated.value) {
            unsubs();
            performRestore();
          }
        });
      } else {
        performRestore();
      }
    };

    const performRestore = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const shareId = params.get("shareId");

      if (id || shareId) {
        const effectiveId = (shareId || id)!;
        currentSessionId.value = effectiveId;
        try {
          const data =
            currentShare.value && currentShare.value.id === effectiveId
              ? currentShare.value
              : await shareService.load(effectiveId);

          if (data && data.state) {
            restoreState(data.state, (data as any).type);
          }
        } catch (e) {
          console.error("Failed to load session", e);
        } finally {
          isRestored.value = true;
        }
      } else {
        // Allow saving after restore is done
        isRestored.value = true;
      }
    };

    const restoreState = (state: any, type?: string) => {
      if (!state) return;

      // Handle nested root if coming from Share service
      const root = state.root || state;

      batch(() => {
        // If type is 'map' or not specified, restore map state
        if ((!type || type === "map") && root.mapContext) {
          const mapState = root.mapContext;
          if (mapState.layerSchemas)
            mapContext.layerSchemas.value = [...mapState.layerSchemas];
          if (mapState.layerGroups)
            mapContext.layerGroups.value = [...mapState.layerGroups];
          if (mapState.zoom !== undefined)
            mapContext.zoom.value = mapState.zoom;
          if (mapState.boundingBox)
            mapContext.boundingBox.value = mapState.boundingBox;
          if (mapState.is3DActive !== undefined)
            mapContext.is3DActive.value = mapState.is3DActive;
          if (mapState.selectedBaseMap)
            mapContext.selectedBaseMap.value = mapState.selectedBaseMap;
          if (mapState.selectedBaseMaps)
            mapContext.selectedBaseMaps.value = mapState.selectedBaseMaps;
          if (mapState.baseMapOpacity !== undefined)
            mapContext.baseMapOpacity.value = mapState.baseMapOpacity;
          if (mapState.baseMapSaturation !== undefined)
            mapContext.baseMapSaturation.value = mapState.baseMapSaturation;
          if (mapState.selectedFeatures)
            mapContext.selectedFeatures.value = [...mapState.selectedFeatures];
          if (mapState.viewport) {
            mapContext.viewport.value = mapState.viewport;
          } else if (!mapContext.viewport.value) {
            mapContext.viewport.value = {
              latitude: -23.5505,
              longitude: -46.6333,
              zoom: mapState.zoom ?? 10,
              bearing: 0,
              pitch: 0,
              padding: { top: 64, bottom: 0, left: 400, right: 0 },
            };
          }
        }

        // If type is 'search', restore concatenated search state and force it open
        if (type === "search" && root.searchContext?.concatenatedSearch) {
          const searchState = root.searchContext;
          searchContext!.concatenatedSearch.value = {
            selectedLayerId:
              searchState.concatenatedSearch.selectedLayerId || "",
            filterTree: searchState.concatenatedSearch.filterTree || {
              id: "root",
              type: "group",
              operator: "AND",
              children: [],
            },
            results: searchState.concatenatedSearch.results || [],
            totalCount: searchState.concatenatedSearch.totalCount,
            isOpen: true, // Auto-open for search shares
          };
        } else if (
          (!type || type === "map") &&
          root.searchContext &&
          searchContext
        ) {
          // Restore basic search context for map shares
          const searchState = root.searchContext;
          if (searchState.currentTerm !== undefined)
            searchContext.currentTerm.value = searchState.currentTerm;
          if (searchState.history)
            searchContext.history.value = [...searchState.history];
          if (searchState.searchConfig)
            searchContext.searchConfig.value = [...searchState.searchConfig];
        }
      });
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
