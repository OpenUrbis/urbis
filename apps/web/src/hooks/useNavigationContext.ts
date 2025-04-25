import { useContext } from "preact/hooks";
import { NavigationContext } from "../context/NavigationContext";

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);

  // Logica

  if (!context)
    throw new Error(
      "useNavigationContext must be used within a NavigationProvider"
    );

  return context;
};
