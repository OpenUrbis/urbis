import { Signal } from "@preact/signals";
import {
  IGetSearchConfigResponse,
  ISearchResponse,
} from "./fetch-search-config-type";

export interface ISearchFetchQuery {
  data: ISearchResponse | null;
  loading: boolean;
  error: string | null;
  clearResults: () => void;
  fetchData: (term: string) => Promise<void>;
  setResults: (results: ISearchResponse) => void;
}

export interface SearchContextType {
  currentTerm: Signal<string>;
  lastTerm: Signal<string>;
  history: Signal<string[]>;
  searchQuery: ISearchFetchQuery;
  searchConfig: Signal<IGetSearchConfigResponse[]>;
}
