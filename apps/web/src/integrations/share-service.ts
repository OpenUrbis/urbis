export interface SyncData {
  root: {
    searchContext: {
      currentTerm: string;
      history: any[];
      searchQuery: any;
      searchConfig: any[];
    };
    mapContext: {
      layerSchemas: any[];
      layerGroups: any[];
      selectedFeatures: any[];
      boundingBox: any;
      viewport: any;
      zoom: number;
      is3DActive: boolean;
      selectedBaseMap: string;
      editFeatureTemplate: any[];
      layerWithRootEditTemplate: string;
    };
  };
}

export const shareService = {
  save: async (data: SyncData) => {
    console.log('[ShareService] Saving data...', data);
    // Mock API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, id: 'mock-id-' + Date.now() };
  },
  
  share: async (data: SyncData) => {
     console.log('[ShareService] Sharing data...', data);
     await new Promise((resolve) => setTimeout(resolve, 1000));
     // Return a mock ID that would represent the shared state
     const id = 'share-' + Date.now();
     return { 
        id,
        shortUrl: `https://urbis.map/share/${id}`,
        directUrl: `${window.location.origin}/?id=${id}`
     };
  },

  load: async (id: string): Promise<SyncData | null> => {
      console.log('[ShareService] Loading data for id...', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Mock: return null or some dummy data? 
      // For now, let's assume if it starts with 'share-', we might mock data, 
      // but simpler to return null so it falls back to defaults or handling
      // In a real app this fetches from DynamoDB.
      return null; 
  }
};
