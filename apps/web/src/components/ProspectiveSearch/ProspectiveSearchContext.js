import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
import { useProspectiveSearch } from "./hooks/useProspectiveSearch";
export const ProspectiveSearchContext = createContext(undefined);
export function ProspectiveSearchProvider({ moduleData, children, }) {
    const state = useProspectiveSearch(moduleData);
    if (typeof window !== "undefined") {
        window.__ProspectiveSearchContextValue = state;
    }
    return (_jsx(ProspectiveSearchContext.Provider, { value: state, children: children }));
}
export function useProspectiveSearchContext() {
    const context = useContext(ProspectiveSearchContext);
    if (context === undefined) {
        if (typeof window !== "undefined" &&
            window.__ProspectiveSearchContextValue) {
            console.warn("useProspectiveSearchContext: Falling back to window.__ProspectiveSearchContextValue due to HMR context mismatch.");
            return window.__ProspectiveSearchContextValue;
        }
        // Check if we are in a Hot Module Replacement (HMR) mismatch state
        // Sometimes Vite loads two copies of the context.
        // We can fallback to the window object if it was stored, but let's just log a warning and return a dummy object or throw.
        console.warn("useProspectiveSearchContext: Context is undefined. This is often caused by Vite HMR or duplicate module instances loading .js vs .tsx files in the monorepo.");
        throw new Error("useProspectiveSearchContext must be used within a ProspectiveSearchProvider");
    }
    return context;
}
