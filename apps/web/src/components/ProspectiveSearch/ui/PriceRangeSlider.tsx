import * as React from "react";
import { Checkbox, Input, Label } from "@open-urbis/map-ui";
import { LocalSlider as Slider } from "./LocalSlider";
import { X } from "lucide-react";

export type RangeFilterType =
  | "between"
  | "greater_than"
  | "less_than"
  | "equal";

export interface RangeFilterValue {
  type: RangeFilterType;
  min: number;
  max: number;
  value: number; // for single value comparisons
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

export function PriceRangeSlider({
  label,
  min = 0,
  max = 1000,
  step = 1,
  unit = "",
  options,
  value,
  onChange,
  onRemove,
}: PriceRangeSliderProps) {
  const optionValues = React.useMemo(
    () =>
      Array.from(new Set((options ?? []).filter(Number.isFinite))).sort(
        (a, b) => a - b,
      ),
    [options],
  );
  const hasOptions = optionValues.length > 0;
  const hasNAOption = (options ?? []).some((opt) => !Number.isFinite(opt));
  const canSlideDiscreteOptions = !hasOptions || optionValues.length > 1;
  const fallbackMin = hasOptions ? optionValues[0] : min;
  const fallbackMax = hasOptions ? optionValues[optionValues.length - 1] : max;
  const clamp = React.useCallback(
    (next: number, minValue = fallbackMin, maxValue = fallbackMax) => {
      const numeric = Number.isFinite(next) ? next : minValue;
      return Math.min(Math.max(numeric, minValue), maxValue);
    },
    [fallbackMin, fallbackMax],
  );
  const safeValue = React.useMemo<RangeFilterValue>(() => {
    const nextMin = clamp(value.min);
    const nextMax = clamp(value.max, nextMin, fallbackMax);
    const nextValue = clamp(value.value);

    return {
      ...value,
      min: nextMin,
      max: nextMax,
      value: nextValue,
    };
  }, [value, clamp, fallbackMax]);

  // Helper to map real value to slider index (if options exist)
  const valToIndex = (val: number) => {
    if (!hasOptions) return clamp(val);
    let closestIdx = 0;
    let minDiff = Infinity;
    optionValues.forEach((opt, idx) => {
      const diff = Math.abs(opt - val);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    return closestIdx;
  };

  // Helper to map slider index to real value
  const indexToVal = (idx: number) => {
    if (!hasOptions) return clamp(idx);
    const safeIndex = Math.min(
      Math.max(Math.round(idx), 0),
      optionValues.length - 1,
    );
    return optionValues[safeIndex] ?? optionValues[0];
  };

  const handleTypeChange = (newType: RangeFilterType) => {
    onChange({ ...safeValue, type: newType });
  };

  const handleSliderChange = (newValues: number[]) => {
    if (hasOptions) {
      if (safeValue.type === "between") {
        const nextMin = indexToVal(newValues[0]);
        const nextMax = indexToVal(newValues[1]);
        onChange({
          ...safeValue,
          min: Math.min(nextMin, nextMax),
          max: Math.max(nextMin, nextMax),
        });
      } else {
        onChange({ ...safeValue, value: indexToVal(newValues[0]) });
      }
    } else {
      if (safeValue.type === "between") {
        const nextMin = clamp(newValues[0]);
        const nextMax = clamp(newValues[1]);
        onChange({
          ...safeValue,
          min: Math.min(nextMin, nextMax),
          max: Math.max(nextMin, nextMax),
        });
      } else {
        onChange({ ...safeValue, value: clamp(newValues[0]) });
      }
    }
  };

  const handleInputChange = (
    field: "min" | "max" | "value",
    newValue: string,
  ) => {
    const num = Math.max(0, parseFloat(newValue));
    if (isNaN(num)) return;

    if (safeValue.type === "between") {
      if (field === "min") {
        const nextMin = clamp(num);
        onChange({
          ...safeValue,
          min: nextMin,
          max: Math.max(nextMin, safeValue.max),
        });
        return;
      }

      if (field === "max") {
        const nextMax = clamp(num);
        onChange({
          ...safeValue,
          min: Math.min(safeValue.min, nextMax),
          max: nextMax,
        });
        return;
      }
    }

    onChange({ ...safeValue, [field]: clamp(num) });
  };

  const sliderValue = React.useMemo(() => {
    if (hasOptions) {
      if (safeValue.type === "between")
        return [valToIndex(safeValue.min), valToIndex(safeValue.max)];
      return [valToIndex(safeValue.value)];
    }
    if (safeValue.type === "between") return [safeValue.min, safeValue.max];
    return [safeValue.value];
  }, [safeValue, hasOptions, optionValues, clamp]);

  const sliderMin = hasOptions ? 0 : min;
  const rawMax = hasOptions ? optionValues.length - 1 : max;
  const sliderMax = Math.max(rawMax, sliderMin + 1);
  const sliderStep = hasOptions ? 1 : step;

  const displayMin = safeValue.min;
  const displayMax = safeValue.max;
  const displaySingle = safeValue.value;

  const displayValue =
    safeValue.type === "between" ? (
      <>
        <span className="font-bold ">{displayMin}</span>{" "}
        <span className="text-[10px]  font-bold">{unit}</span>{" "}
        <span className="mx-1 opacity-40">—</span>{" "}
        <span className="font-bold ">{displayMax}</span>{" "}
        <span className="text-[10px]  font-bold">{unit}</span>
      </>
    ) : (
      <>
        <span className="font-bold ">{displaySingle}</span>{" "}
        <span className="text-[10px]  font-bold">{unit}</span>
      </>
    );

  return (
    <div className="group/slider bg-card/45 p-4 rounded-xl border border-border transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col gap-0.5">
          <Label className="text-[10px] font-bold  ">{label}</Label>
          <div className="text-sm flex flex-wrap items-baseline gap-1">
            {displayValue}
            {hasNAOption &&
              (safeValue.onlyNA ? (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full animate-in fade-in duration-200">
                  apenas NA
                </span>
              ) : safeValue.includeNA ? (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full animate-in fade-in duration-200">
                  inclui NA
                </span>
              ) : null)}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {hasNAOption && (
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground cursor-pointer select-none">
              <Checkbox
                checked={!!safeValue.includeNA && !safeValue.onlyNA}
                onCheckedChange={(checked) =>
                  onChange({
                    ...safeValue,
                    includeNA: checked === true,
                    onlyNA: false,
                  })
                }
                className="h-3.5 w-3.5"
              />
              Incluir registros sem valor informado (NA)
            </label>
            <label className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground cursor-pointer select-none">
              <Checkbox
                checked={!!safeValue.onlyNA}
                onCheckedChange={(checked) =>
                  onChange({
                    ...safeValue,
                    onlyNA: checked === true,
                    includeNA: checked === true ? true : safeValue.includeNA,
                  })
                }
                className="h-3.5 w-3.5"
              />
              Incluir apenas NA
            </label>
          </div>
        )}

        {canSlideDiscreteOptions ? (
          <div
            className={`px-1.5 pt-1 transition-opacity ${safeValue.onlyNA ? "opacity-45 pointer-events-none" : ""}`}
          >
            <Slider
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              value={sliderValue}
              onValueChange={handleSliderChange}
              ticks={hasOptions ? optionValues.length : 6}
              tickLabels={hasOptions ? optionValues : undefined}
              className="py-1 mb-4"
              disabled={!!safeValue.onlyNA}
            />
          </div>
        ) : (
          <div
            className={`rounded-lg border border-dashed border-slate-200 dark:border-slate-800 px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-opacity ${safeValue.onlyNA ? "opacity-45" : ""}`}
          >
            Valor disponível: {optionValues[0]} {unit}
          </div>
        )}

        {!hasOptions && (
          <div
            className={`flex items-center gap-2 pt-1 animate-in fade-in duration-300 transition-opacity ${safeValue.onlyNA ? "opacity-45 pointer-events-none" : ""}`}
          >
            {safeValue.type === "between" ? (
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min={0}
                    className="h-8 pl-9 text-xs font-bold rounded-lg border-slate-100 dark:border-slate-800"
                    value={safeValue.min}
                    onChange={(e) => handleInputChange("min", e.target.value)}
                    disabled={!!safeValue.onlyNA}
                  />
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold ">
                    máx.
                  </span>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 pl-9 text-xs font-bold rounded-lg border-slate-100 dark:border-slate-800"
                    value={safeValue.max}
                    onChange={(e) => handleInputChange("max", e.target.value)}
                    disabled={!!safeValue.onlyNA}
                  />
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold ">
                  valor
                </span>
                <Input
                  type="number"
                  min={0}
                  className="h-9 pl-14 text-xs font-bold rounded-lg border-slate-100 dark:border-slate-800"
                  value={safeValue.value}
                  onChange={(e) => handleInputChange("value", e.target.value)}
                  disabled={!!safeValue.onlyNA}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
