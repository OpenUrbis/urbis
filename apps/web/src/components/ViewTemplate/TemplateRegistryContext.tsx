import { createContext, useContext } from "react";
import { ITemplatesDeclaration } from "./types/templates-type";

interface TemplateRegistryContextType {
  templates?: ITemplatesDeclaration[];
}

const TemplateRegistryContext = createContext<TemplateRegistryContextType>({
  templates: undefined,
});

export const useTemplateRegistry = () => useContext(TemplateRegistryContext);

export const TemplateRegistryProvider = TemplateRegistryContext.Provider;
