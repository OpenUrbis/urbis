import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { ITemplate, ITemplatesDeclaration } from "../types/templates-type";

// Extension for builder-specific configuration
export interface IBuilderTemplateConfig extends ITemplatesDeclaration {
  friendlyName: string;
  icon?: ReactNode;
  description?: string;
  // Component to render the configuration form
  configComponent?: React.FC<{
    template: ITemplate;
    onChange: (newTemplate: ITemplate) => void;
  }>;
  // Default properties when adding this component
  defaultProps?: Partial<ITemplate>;
  // If defined, only these component types are allowed as children
  allowedChildren?: string[];
  // If true, this component is a wrapper that can accept children
  isWrapper?: boolean;
  // Property name for children (default: "templates")
  childrenProp?: string;
  // If defined, this component can only be placed inside these parents
  validParents?: string[];
}

export interface IBuilderContextType {
  template: ITemplate;
  setTemplate: (template: ITemplate) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateItem: (id: string, updates: Partial<ITemplate>) => void;
  addItem: (parentId: string | null, newItem: ITemplate, index?: number) => void;
  removeItem: (id: string) => void;
  moveItem: (dragId: string, hoverId: string) => void;
  mockData: any;
  setMockData: (data: any) => void;
  highlightConfig: number;
  triggerHighlightConfig: () => void;
}
