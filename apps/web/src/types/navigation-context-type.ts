import { ReadonlySignal, Signal } from "@preact/signals";

export interface INavigationContextType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentPage: Signal<any | any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastPage: Signal<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: Signal<any[]>;
}

export interface INavigationContextActions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentPage: ReadonlySignal<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastPage: ReadonlySignal<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: ReadonlySignal<any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigateTo: (page: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addOnPage: (page: any) => void;
  rmOnPage: () => void;
  clearCurrentPage: () => void;
}
