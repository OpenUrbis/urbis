import { Signal } from "@preact/signals";
import { FilterGroup } from "../components/FilterBuilder/types";
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

export interface ConcatenatedSearchState {
  selectedLayerId: string;
  filterTree: FilterGroup;
  results: any[];
  totalCount?: number;
  isOpen: boolean;
}

export interface SearchContextType {
  currentTerm: Signal<string>;
  lastTerm: Signal<string>;
  history: Signal<string[]>;
  searchQuery: ISearchFetchQuery;
  searchConfig: Signal<IGetSearchConfigResponse[]>;
  concatenatedSearch: Signal<ConcatenatedSearchState>;
}
