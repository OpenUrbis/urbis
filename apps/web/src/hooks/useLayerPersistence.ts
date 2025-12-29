import { effect, signal } from "@preact/signals";
import { useContext, useEffect } from "react";
import { appState, appHistory } from "../integrations/signaldb";
import { useMapContext } from "./useMapContext";
import { SearchContext } from "../context/SearchContext";
import { shareService } from "../integrations/share-service";

export const currentSessionId = signal<string>(crypto.randomUUID());
const isRestored = signal(false);
const isMapPopulated = signal(false);

export const useLayerPersistence = () => {
  const mapContext = useMapContext();
  const searchContext = useContext(SearchContext);

  // Monitor when map is populated by API
  effect(() => {
      if (mapContext.layerSchemas.value.length > 0 && !isMapPopulated.value) {
          isMapPopulated.value = true;
      }
  });

  // Init / Restore logic
  useEffect(() => {
    const init = async () => {
      // Wait for Map to be populated from API first
      // This prevents API defaults from overwriting our restored state later
      // We check the signal in a loop or wait for it
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
      const id = params.get('id');

      if (id) {
        currentSessionId.value = id;
        try {
            const data = await shareService.load(id);
            if (data && data.root) {
                // Restore from API (Mock) logic if needed
                console.log('Restored from API', data);
            } else {
                const local = appHistory.findOne({ id });
                if (local) {
                    restoreState(local.state);
                    console.log('Restored from Local History', local);
                }
            }
        } catch (e) {
            console.error("Failed to load session", e);
        }
      } else {
         const active = appState.findOne({ id: 'active' });
         if (active && (active as any).sessionId) {
             const sessionId = (active as any).sessionId;
             currentSessionId.value = sessionId;
             const history = appHistory.findOne({ id: sessionId });
             if (history) {
                 restoreState(history.state);
                 console.log('Restored from Active Session', history);
             }
         }
      }
      
      // Allow saving after restore is done
      isRestored.value = true;
    };

    const restoreState = (state: any) => {
        if (!state || !state.mapContext) return;
        
        if (state.mapContext.layerSchemas) mapContext.layerSchemas.value = state.mapContext.layerSchemas;
        if (state.mapContext.layerGroups) mapContext.layerGroups.value = state.mapContext.layerGroups;
        if (state.mapContext.zoom) mapContext.zoom.value = state.mapContext.zoom;
        if (state.mapContext.boundingBox) mapContext.boundingBox.value = state.mapContext.boundingBox;
        if (state.mapContext.is3DActive !== undefined) mapContext.is3DActive.value = state.mapContext.is3DActive;
        if (state.mapContext.selectedBaseMap) mapContext.selectedBaseMap.value = state.mapContext.selectedBaseMap;
        if (state.mapContext.selectedFeatures) mapContext.selectedFeatures.value = state.mapContext.selectedFeatures;
        if (state.mapContext.viewport) mapContext.viewport.value = state.mapContext.viewport;

        if (state.searchContext) {
            if (state.searchContext.currentTerm) searchContext!.currentTerm.value = state.searchContext.currentTerm;
            if (state.searchContext.history) searchContext!.history.value = state.searchContext.history;
            if (state.searchContext.searchConfig) searchContext!.searchConfig.value = state.searchContext.searchConfig;
        }
    };

    init();
  }, []);

  effect(() => {
    if (!isRestored.value) return;

    const state = {
        id: currentSessionId.value,
        searchContext: {
            currentTerm: searchContext?.currentTerm.value || "",
            history: searchContext?.history.value || [],
            searchQuery: {
                data: searchContext?.searchQuery?.data,
                loading: searchContext?.searchQuery?.loading,
                error: searchContext?.searchQuery?.error
            },
            searchConfig: searchContext?.searchConfig.value || []
        },
        mapContext: {
            selectedFeatures: mapContext.selectedFeatures.value,
            layerSchemas: mapContext.layerSchemas.value,
            layerGroups: mapContext.layerGroups.value,
            zoom: mapContext.zoom.value,
            viewport: mapContext.viewport.value,
            is3DActive: mapContext.is3DActive.value,
            selectedBaseMap: mapContext.selectedBaseMap.value,
        },
        lastUpdate: Date.now()
    };

    let safeState;
    try {
        safeState = JSON.parse(JSON.stringify(state));
    } catch (e) {
        console.error("Failed to serialize state:", e);
        return;
    }

    console.log('Saving state to IndexedDB:', safeState);

    const existing = appHistory.findOne({ id: currentSessionId.value });
    if (existing) {
        appHistory.updateOne({ id: currentSessionId.value }, { $set: { state: safeState, timestamp: Date.now() } });
    } else {
        appHistory.insert({
            id: currentSessionId.value,
            state: safeState,
            timestamp: Date.now()
        });
    }
    
    const active = appState.findOne({ id: 'active' });
    if (active) {
        appState.updateOne({ id: 'active' }, { $set: { sessionId: currentSessionId.value, lastUpdate: Date.now() } });
    } else {
        appState.insert({ id: 'active', sessionId: currentSessionId.value, lastUpdate: Date.now() } as any);
    }
  });
};
