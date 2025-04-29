import { ReadonlySignal, Signal } from "@preact/signals";

export interface INavigationContextType {
  
  currentPage: Signal<any>;
  
  lastPage: Signal<any>;
  
  history: Signal<any[]>;
}

export interface INavigationContextActions {
  
  currentPage: ReadonlySignal<any>;
  
  lastPage: ReadonlySignal<any>;
  
  history: ReadonlySignal<any[]>;
  
  navigateTo: (page: any) => void;
  clearCurrentPage: () => void;
}
