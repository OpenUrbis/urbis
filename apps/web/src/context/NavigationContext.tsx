import { signal } from "@preact/signals";
import { createContext, ReactNode } from "react";
import { INavigationContextType } from "../types/navigation-context-type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const currentPage = signal<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lastPage = signal<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const history = signal<any[]>([]);

const drawerOpen = signal(false);

const navigationState: INavigationContextType = {
  currentPage,
  lastPage,
  history,
  drawerOpen,
};

export const NavigationContext =
  createContext<INavigationContextType>(navigationState);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  return (
    <NavigationContext.Provider value={navigationState}>
      {children}
    </NavigationContext.Provider>
  );
};
