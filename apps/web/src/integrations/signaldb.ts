import { Collection } from '@signaldb/core';
import createIndexedDBAdapter from '@signaldb/indexeddb';
import { IGetConfigLayerSchema } from '../types/fetch-map-config-type';

export const adapter = createIndexedDBAdapter('urbis-map-db-state', {
  prefix: 'urbis-map-',
});
const historyAdapter = createIndexedDBAdapter('urbis-map-db-history', {
  prefix: 'urbis-map-'
});

export interface AppStateDoc {
  id: string;
  searchContext?: {
    currentTerm: string;
    history: any[];
    searchConfig: any[];
  };
  mapContext?: {
    layerSchemas: IGetConfigLayerSchema[];
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
  lastUpdate: number;
}

export interface AppHistoryDoc {
  id: string;
  state: AppStateDoc;
  timestamp: number;
}

export const appState = new Collection<AppStateDoc>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  persistence: adapter as any,
});

export const appHistory = new Collection<AppHistoryDoc>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  persistence: historyAdapter as any,
});
