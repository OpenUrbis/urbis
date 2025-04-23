import { Signal } from "@preact/signals";

export type SearchCategory = "Lotes" | "Distritos" | "Outros";

export type SearchResult = {
  id: string;
  name: string;
  type: "LOTE" | "DISTRITO" | string;
  latitude: number;
  longitude: number;
  category?: SearchCategory;
  rawData?: any;
};

export type SearchMultiResult = {
  districts: SearchResult[];
  lots: SearchResult[];
  geocoding: SearchResult[];
};

export interface SearchContextType {
  currentTerm: Signal<string>;
  lastTerm: Signal<string>;
  history: Signal<string[]>;
  results: Signal<SearchMultiResult>;
}
