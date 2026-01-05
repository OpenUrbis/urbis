import { IGetConfigLayerGroup } from "../types/fetch-map-config-type";

export const flattenLayerGroups = (groups: IGetConfigLayerGroup[]): IGetConfigLayerGroup[] => {
  let result: IGetConfigLayerGroup[] = [];
  
  for (const group of groups) {
    result.push(group);
    if (group.childGroups && group.childGroups.length > 0) {
      result = result.concat(flattenLayerGroups(group.childGroups));
    }
  }
  
  return result;
};
