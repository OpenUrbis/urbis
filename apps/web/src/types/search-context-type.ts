import { useQuery$ } from "@preact-signals/query";
import { Signal } from "@preact/signals";
import { IGetSearchConfigResponse } from "./fetch-search-config-type";

export interface SearchContextType {
  currentTerm: Signal<string>;
  lastTerm: Signal<string>;
  history: Signal<string[]>;
  
  results: Signal<any>;
  
  searchQuery: ReturnType<typeof useQuery$<any>>;
  searchConfig: Signal<IGetSearchConfigResponse[]>;
}
