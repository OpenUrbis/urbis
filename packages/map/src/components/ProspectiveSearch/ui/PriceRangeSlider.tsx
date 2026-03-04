import * as React from 'react';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@open-urbis/map-ui';
import { LocalSlider as Slider } from './LocalSlider';
import { X, ChevronDown } from 'lucide-react';

export type RangeFilterType = 'between' | 'greater_than' | 'less_than' | 'equal';

export interface RangeFilterValue {
  type: RangeFilterType;
  min: number;
  max: number;
  value: number; // for single value comparisons
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
  unit = '',
  options,
  value,
  onChange,
  onRemove
}: PriceRangeSliderProps) {

  const hasOptions = options && options.length > 0;

  // Helper to map real value to slider index (if options exist)
  const valToIndex = (val: number) => {
    if (!hasOptions || !options) return val;
    let closestIdx = 0;
    let minDiff = Infinity;
    options.forEach((opt, idx) => {
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
    if (!hasOptions || !options) return idx;
    return options[idx] ?? options[0];
  };

  const handleTypeChange = (newType: RangeFilterType) => {
    onChange({ ...value, type: newType });
  };

  const handleSliderChange = (newValues: number[]) => {
    if (hasOptions) {
      if (value.type === 'between') {
        onChange({ ...value, min: indexToVal(newValues[0]), max: indexToVal(newValues[1]) });
      } else {
        onChange({ ...value, value: indexToVal(newValues[0]) });
      }
    } else {
      if (value.type === 'between') {
        onChange({ ...value, min: newValues[0], max: newValues[1] });
      } else {
        onChange({ ...value, value: newValues[0] });
      }
    }
  };

  const handleInputChange = (field: 'min' | 'max' | 'value', newValue: string) => {
    const num = parseFloat(newValue);
    if (!isNaN(num)) {
      onChange({ ...value, [field]: num });
    }
  };

  const sliderValue = React.useMemo(() => {
    if (hasOptions) {
      if (value.type === 'between') return [valToIndex(value.min), valToIndex(value.max)];
      return [valToIndex(value.value)];
    }
    if (value.type === 'between') return [value.min, value.max];
    return [value.value];
  }, [value, hasOptions, options]);

  const sliderMin = hasOptions ? 0 : min;
  const rawMax = hasOptions && options ? options.length - 1 : max;
  const sliderMax = Math.max(rawMax, sliderMin + 1);
  const sliderStep = hasOptions ? 1 : step;

  const displayValue = value.type === 'between'
    ? <><span className="font-bold ">{value.min}</span> <span className="text-[10px]  font-bold">{unit}</span> <span className="mx-1 opacity-40">—</span> <span className="font-bold ">{value.max}</span> <span className="text-[10px]  font-bold">{unit}</span></>
    : <><span className="font-bold ">{value.value}</span> <span className="text-[10px]  font-bold">{unit}</span></>;

  return (
    <div className="group/slider bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col gap-0.5">
          <Label className="text-[10px] font-bold  ">{label}</Label>
          <div className="text-sm flex items-baseline gap-1">
            {displayValue}
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

      <div className="space-y-5">
        <div className="px-1.5 pt-1">
          <Slider
            key={sliderValue.join(',')}
            min={sliderMin}
            max={sliderMax}
            step={sliderStep}
            defaultValue={sliderValue}
            onValueCommit={handleSliderChange}
            ticks={hasOptions ? options.length : 6}
            tickLabels={hasOptions ? options : undefined}
            className="py-1 mb-4"
          />
        </div>


        {!hasOptions && (
          <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-300">
            {value.type === 'between' ? (
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <Input type="number" className="h-8 pl-9 text-xs font-bold rounded-lg border-slate-100 dark:border-slate-800" value={value.min} onChange={(e) => handleInputChange('min', e.target.value)} />
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold ">máx.</span>
                  <Input type="number" className="h-8 pl-9 text-xs font-bold rounded-lg border-slate-100 dark:border-slate-800" value={value.max} onChange={(e) => handleInputChange('max', e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold ">valor</span>
                <Input type="number" className="h-9 pl-14 text-xs font-bold rounded-lg border-slate-100 dark:border-slate-800" value={value.value} onChange={(e) => handleInputChange('value', e.target.value)} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
