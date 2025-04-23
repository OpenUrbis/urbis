import { Signal } from "@preact/signals";

export interface NavigationContextType {
  currentPage: Signal<any>;
  lastPage: Signal<any>;
  history: Signal<any[]>;
}
