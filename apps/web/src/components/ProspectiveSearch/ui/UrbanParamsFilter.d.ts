import { UrbanParamsFilters } from "../utils/types";
import { RangeFilterValue } from "./PriceRangeSlider";
export interface FilterParamConfig {
    id: string;
    label: string;
    unit: string;
    defaultMax: number;
    step?: number;
}
interface UrbanParamsFilterProps {
    filters: UrbanParamsFilters;
    options?: Record<string, number[]>;
    availableParams?: FilterParamConfig[];
    disabledParams?: string[];
    updateFilter: (param: string, value: RangeFilterValue) => void;
    removeFilter?: (param: string) => void;
    clearFilters: () => void;
    resultsCount: number;
}
export declare const DEFAULT_URBAN_PARAMS: FilterParamConfig[];
export declare function UrbanParamsFilter({ filters, options, availableParams, disabledParams, updateFilter, removeFilter, }: UrbanParamsFilterProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=UrbanParamsFilter.d.ts.map