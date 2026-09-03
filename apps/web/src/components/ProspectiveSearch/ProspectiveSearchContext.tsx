import React, { createContext, useContext, ReactNode } from "react";
import { useProspectiveSearch } from "./hooks/useProspectiveSearch";

export type ProspectiveSearchState = ReturnType<typeof useProspectiveSearch>;

export const ProspectiveSearchContext = createContext<
  ProspectiveSearchState | undefined
>(undefined);

export function ProspectiveSearchProvider({
  moduleData,
  children,
}: {
  moduleData: Record<string, any[]>;
  children: ReactNode;
}) {
  const state = useProspectiveSearch(moduleData);

  if (typeof window !== "undefined") {
    (window as any).__ProspectiveSearchContextValue = state;
  }

  return (
    <ProspectiveSearchContext.Provider value={state}>
      {children}
    </ProspectiveSearchContext.Provider>
  );
}

export function useProspectiveSearchContext() {
  const context = useContext(ProspectiveSearchContext);
  if (context === undefined) {
    if (
      typeof window !== "undefined" &&
      (window as any).__ProspectiveSearchContextValue
    ) {
      console.warn(
        "useProspectiveSearchContext: Falling back to window.__ProspectiveSearchContextValue due to HMR context mismatch.",
      );
      return (window as any).__ProspectiveSearchContextValue;
    }
    // Check if we are in a Hot Module Replacement (HMR) mismatch state
    // Sometimes Vite loads two copies of the context.
    // We can fallback to the window object if it was stored, but let's just log a warning and return a dummy object or throw.
    console.warn(
      "useProspectiveSearchContext: Context is undefined. This is often caused by Vite HMR or duplicate module instances loading .js vs .tsx files in the monorepo.",
    );
    throw new Error(
      "useProspectiveSearchContext must be used within a ProspectiveSearchProvider",
    );
  }
  return context;
}
