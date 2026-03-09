import { VIEW_TEMPLATE_TEMPLATES } from "../templates";
import { ButtonTemplateConfig } from "../templates/ButtonTemplate/config";
import { CardWrapperConfig } from "../templates/CardWrapper/config";
import { EditPolygonTemplateConfig } from "../templates/EditPolygonTemplate/config";
import { GridColumnConfig } from "../templates/GridColumn/config";
import { GridWrapperConfig } from "../templates/GridWrapper/config";
import { LabelValueConfig } from "../templates/LabelValueTemplate/config";
import { ListItemsWrapperConfig } from "../templates/ListItemsWrapper/config";
import { PolygonMapTemplateConfig } from "../templates/PolygonMapTemplate/config";
import { PrimaryItemTemplateConfig } from "../templates/PrimaryItemTemplate/config";
import { RequestWrapperConfig } from "../templates/RequestWrapper/config";
import { SecondaryItemTemplateConfig } from "../templates/SecondaryItemTemplate/config";
import { IBuilderTemplateConfig } from "./types";

// Map of template names to their builder configuration
const CONFIG_MAP: Record<string, Partial<IBuilderTemplateConfig>> = {
  "label-value": LabelValueConfig,
  "wrapper-card": CardWrapperConfig,
  "wrapper-request": RequestWrapperConfig,
  "wrapper-list-items": ListItemsWrapperConfig,
  "wrapper-grid": GridWrapperConfig,
  "wrapper-grid-column": GridColumnConfig,
  // "edit-polygon": EditPolygonTemplateConfig,
  // button: ButtonTemplateConfig,
  "polygon-map": PolygonMapTemplateConfig,
  "primary-item": PrimaryItemTemplateConfig,
  "secondary-item": SecondaryItemTemplateConfig,
};

export const BUILDER_TEMPLATES: IBuilderTemplateConfig[] =
  VIEW_TEMPLATE_TEMPLATES.map((t) => {
    const config = CONFIG_MAP[t.name];

    if (!config) return null;

    return {
      ...t,
      friendlyName: config.friendlyName || t.name,
      description: config.description || "",
      ...config,
    } as IBuilderTemplateConfig;
  }).filter((t): t is IBuilderTemplateConfig => t !== null);
