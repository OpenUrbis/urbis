import { signal } from "@preact/signals";
import { ComponentChildren, createContext } from "preact";
import { INavigationContextType } from "../types/navigation-context-type";


const currentPage = signal<any>(null);

const lastPage = signal<any>(null);

const history = signal<any[]>([]);

const navigationState: INavigationContextType = {
  currentPage,
  lastPage,
  history,
};

export const NavigationContext =
  createContext<INavigationContextType>(navigationState);

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
