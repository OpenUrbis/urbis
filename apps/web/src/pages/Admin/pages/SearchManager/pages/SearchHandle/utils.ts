import * as z from "zod";
import { IGetSearchConfigResponse } from "@/types/fetch-search-config-type";

export const SearchSchemaFormSchema = z.object({
  // Step 1
  name: z.string().min(1, "Insira o nome da pesquisa"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  origin: z.string().min(1, "Insira a URL de origem"),
  index: z.string().optional(),
  layerId: z.string().optional(),
  isActive: z.boolean(),
  clickAction: z.string().optional(),
  clickActionParams: z
    .object({
      zoom: z.string().optional(),
      template: z.string().optional(),
    })
    .optional(),
  
  // Step 2
  transformParams: z.string().optional(),
  filterTree: z.any().optional(),
  
  // Step 3
  transformRequest: z.string().optional(),
  
  // Step 4
  transformResponse: z.string().optional(),
}) as any;

export type SearchSchemaFormValues = z.infer<typeof SearchSchemaFormSchema>;

export const buildSearchSchema = (data: SearchSchemaFormValues): Partial<IGetSearchConfigResponse> => {
  let clickActionObj = undefined;
  if (data.clickAction && data.clickAction !== "none") {
    clickActionObj = {
      action: data.clickAction,
      params: {},
    };

    if (data.clickAction === "setZoom" && data.clickActionParams?.zoom) {
      clickActionObj.params = { zoom: Number(data.clickActionParams.zoom) };
    } else if (data.clickAction === "openFeature" && data.clickActionParams?.template) {
      clickActionObj.params = { template: data.clickActionParams.template };
    }
  }

  return {
    name: data.name,
    method: data.method,
    origin: data.origin,
    index: data.index ? Number(data.index) : undefined,
    layerSchemaId: data.layerId || undefined,
    isActive: data.isActive,
    clickAction: clickActionObj,
    ...(data.transformParams ? { transformParams: data.transformParams } : {}),
    ...(data.filterTree ? { filterTree: data.filterTree } : {}),
    ...(data.transformRequest ? { transformRequest: data.transformRequest } : {}),
    ...(data.transformResponse ? { transformResponse: data.transformResponse } : {}),
  };
};

export const parseSearchSchemaToForm = (data: IGetSearchConfigResponse): SearchSchemaFormValues => {
  let formClickAction = "none";
  let formClickActionParams = {};

  if (data.clickAction?.action) {
    formClickAction = data.clickAction.action;
    
    if (formClickAction === "setZoom") {
      formClickActionParams = { zoom: data.clickAction.params?.zoom?.toString() };
    } else if (formClickAction === "openFeature") {
      formClickActionParams = { template: data.clickAction.params?.template };
    }
  }

  return {
    name: data.name,
    method: (data.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH") || "GET",
    origin: data.origin,
    index: data.index?.toString() || "",
    layerId: data.layerSchemaId || data.layerSchema?.id || "",
    isActive: data.isActive ?? true,
    clickAction: formClickAction,
    clickActionParams: formClickActionParams,
    transformParams: data.transformParams || "",
    filterTree: data.filterTree,
    transformRequest: data.transformRequest || "",
    transformResponse: data.transformResponse || "",
  };
};
