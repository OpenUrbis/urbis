import { signal } from "@preact/signals";
import { ComponentChildren, createContext } from "preact";
import { NavigationContextType } from "../types/navigation-context-type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const currentPage = signal<any>({});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lastPage = signal<any>({});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
