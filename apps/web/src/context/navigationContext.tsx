import { signal } from "@preact/signals";
import { ComponentChildren, createContext } from "preact";
import { useContext } from "preact/hooks";
import { NavigationContextType } from "../dto/navigationContextDto";

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

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);

  // Logica

  if (!context)
    throw new Error(
      "useNavigationContext must be used within a NavigationProvider"
    );

  return context;
};

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
