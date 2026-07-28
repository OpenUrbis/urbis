import { IBuilderTemplateConfig } from "../../builder/types";

export const GridColumnConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Coluna de Grid",
  description: "Coluna interna de um grid.",
  isWrapper: true,
  hiddenInPalette: true,
  validParents: ["wrapper-grid"],
  defaultProps: {
    templates: [],
  },
};
