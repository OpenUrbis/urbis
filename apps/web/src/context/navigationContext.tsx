import { signal } from "@preact/signals";
import { ComponentChildren, createContext } from "preact";
import { NavigationContextType } from "../types/navigation-context-type";

const currentPage = signal<any>({});
const lastPage = signal<any>({});
const history = signal<any[]>([]);

const navigationState: NavigationContextType = {
  currentPage,
  lastPage,
  history,
};

export const NavigationContext =
  createContext<NavigationContextType>(navigationState);

export const NavigationProvider = ({
  children,
}: {
  children: ComponentChildren;
}) => {
  return (
    <NavigationContext.Provider value={navigationState}>
      {children}
    </NavigationContext.Provider>
  );
};
