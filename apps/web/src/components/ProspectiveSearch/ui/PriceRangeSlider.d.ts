export type RangeFilterType = "between" | "greater_than" | "less_than" | "equal";
export interface RangeFilterValue {
    type: RangeFilterType;
    min: number;
    max: number;
    value: number;
    includeNA?: boolean;
    onlyNA?: boolean;
}
interface PriceRangeSliderProps {
    label: string;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: number[];
    value: RangeFilterValue;
    onChange: (value: RangeFilterValue) => void;
    onRemove?: () => void;
}
export declare function PriceRangeSlider({ label, min, max, step, unit, options, value, onChange, onRemove, }: PriceRangeSliderProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=PriceRangeSlider.d.ts.map