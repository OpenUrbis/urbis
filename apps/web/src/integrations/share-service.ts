import axios from "axios";

const environment =
  (import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br") + "/maps";

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

export interface ShareResponse {
  id: string;
  shortUrl: string;
  directUrl: string;
}

export interface SharedMapItem {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    state: SyncData;
}

export interface SharedMap {
    id: string;
    name: string;
    description: string;
    userId: string;
    createdAt: string;
    state: SyncData;
}

export const shareService = {
  save: async (data: SyncData) => {
    console.log('[ShareService] Saving data...', data);
    // Mock API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, id: 'mock-id-' + Date.now() };
  },
  
  share: async (data: SyncData, name: string, description?: string, type: string = 'map'): Promise<ShareResponse> => {
     const payload = {
         name,
         description,
         type,
         state: data
     };
     
     const { data: responseData } = await axios.post(`${environment}/share`, payload);
     
     const id = responseData.id;
     const url = `${window.location.origin}/?shareId=${id}`;

     return { 
        id,
        shortUrl: url,
        directUrl: url
     };
  },

  load: async (id: string): Promise<SharedMap | null> => {
      try {
        const { data } = await axios.get(`${environment}/share/${id}`);
        return data;
      } catch (error) {
        console.error("Error loading shared state", error);
        return null;
      }
  },

  update: async (id: string, data: SyncData, name: string, description?: string, type: string = 'map'): Promise<SharedMap> => {
      const payload = {
         name,
         description,
         type,
         state: data
      };
      const { data: responseData } = await axios.patch(`${environment}/share/${id}`, payload);
      return responseData;
  },

  getHistory: async (userId: string, page: number = 1, limit: number = 10, type: string = 'map'): Promise<{ items: SharedMapItem[], total: number }> => {
      try {
        const { data } = await axios.get(`${environment}/share/user/${userId}`, {
            params: { page, limit, type }
        });
        return data;
      } catch (error) {
        console.error("Error loading share history", error);
        throw error;
      }
  }
};
