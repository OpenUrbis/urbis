import axios from "axios";
import { getAuthHeaders } from "../utils/auth-headers";

const environment = (import.meta.env.VITE_API_URL || "/api") + "/maps";

export interface SyncData {
  root: {
    searchContext: {
      currentTerm: string;
      history: any[];
      searchQuery: any;
      searchConfig: any[];
      concatenatedSearch?: any;
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
      selectedBaseMaps?: any[];
      baseMapOpacity?: number;
      baseMapSaturation?: number;
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
    console.log("[ShareService] Saving data...", data);
    // Mock API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, id: "mock-id-" + Date.now() };
  },

  share: async (
    data: SyncData,
    name: string,
    description?: string,
    type: string = "map",
    isPublic: boolean = false,
  ): Promise<ShareResponse> => {
    const headers = await getAuthHeaders();
    const payload = {
      name,
      description,
      type,
      state: data,
      isPublic,
    };

    const { data: responseData } = await axios.post(
      `${environment}/share`,
      payload,
      { headers },
    );

    const id = responseData.id;
    const url = `${window.location.origin}/?shareId=${id}`;

    return {
      id,
      shortUrl: url,
      directUrl: url,
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

  findAllPublic: async (
    page: number = 1,
    limit: number = 10,
    type: string = "map",
  ): Promise<{ items: SharedMapItem[]; total: number }> => {
    try {
      const { data } = await axios.get(`${environment}/share/public/list`, {
        params: { page, limit, type },
      });
      return data;
    } catch (error) {
      console.error("Error loading public shares", error);
      throw error;
    }
  },

  update: async (
    id: string,
    data: SyncData,
    name: string,
    description?: string,
    type: string = "map",
    isPublic: boolean = false,
  ): Promise<SharedMap> => {
    const headers = await getAuthHeaders();
    const payload = {
      name,
      description,
      type,
      state: data,
      isPublic,
    };
    const { data: responseData } = await axios.patch(
      `${environment}/share/${id}`,
      payload,
      { headers },
    );
    return responseData;
  },

  getHistory: async (
    page: number = 1,
    limit: number = 10,
    type: string = "map",
  ): Promise<{ items: SharedMapItem[]; total: number }> => {
    const headers = await getAuthHeaders();
    try {
      const { data } = await axios.get(`${environment}/share/user/history`, {
        params: { page, limit, type },
        headers,
      });
      return data;
    } catch (error) {
      console.error("Error loading share history", error);
      throw error;
    }
  },

  getPublicShares: async (
    page: number = 1,
    limit: number = 10,
    type: string = "map",
  ): Promise<{ items: SharedMapItem[]; total: number }> => {
    try {
      const { data } = await axios.get(`${environment}/share/public/list`, {
        params: { page, limit, type },
      });
      return data;
    } catch (error) {
      console.error("Error loading public shares", error);
      throw error;
    }
  },
};
